param(
  [Parameter(Mandatory = $true)]
  [string]$EnvId,

  [Parameter(Mandatory = $true)]
  [string]$AdminToken,

  [string]$ApiBase = "",

  [string]$FunctionName = "submissions",
  [string]$CollectionName = "survey_submissions",
  [string]$QuestionnaireCollectionName = "survey_questionnaires"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Node = "node"
$Npx = "npx.cmd"
$DeployRoot = Join-Path $Root "dist\deploy"
$FrontendDir = Join-Path $DeployRoot "frontend"
$FunctionDir = Join-Path $DeployRoot "cloudfunctions\$FunctionName"
$CloudbaseConfig = Join-Path $Root "cloudbaserc.json"

Set-Location $Root

Write-Host "1/6 Building deploy package..."
& $Node "scripts\build-deploy-package.mjs"

if (-not $ApiBase) {
  $ApiBase = "https://$EnvId.service.tcloudbase.com"
}

Write-Host "2/6 Writing frontend config..."
@"
window.SMART_SURVEY_API_BASE = "$ApiBase";
window.SMART_SURVEY_ADMIN_TOKEN = "";
"@ | Set-Content -LiteralPath (Join-Path $FrontendDir "config.js") -Encoding UTF8

Write-Host "3/6 Writing cloudbaserc.json..."
$cloudbaseJson = @{
  envId = $EnvId
  functionRoot = "dist/deploy/cloudfunctions"
  functions = @(
    @{
      name = $FunctionName
      timeout = 10
      runtime = "Nodejs16.13"
      handler = "index.main"
      installDependency = $true
      envVariables = @{
        SUBMISSIONS_COLLECTION = $CollectionName
        QUESTIONNAIRE_COLLECTION = $QuestionnaireCollectionName
        ADMIN_TOKEN = $AdminToken
      }
    }
  )
} | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($CloudbaseConfig, $cloudbaseJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "4/6 Installing cloud function dependencies..."
Push-Location $FunctionDir
npm.cmd install --omit=dev
Pop-Location

Write-Host "5/6 Deploying cloud function and HTTP routes..."
& $Npx cloudbase fn deploy $FunctionName --force -e $EnvId

$routeJson = (@{
  domain = "$EnvId.service.tcloudbase.com"
  routes = @(
    @{
      path = "/api/submissions"
      upstreamResourceType = "SCF"
      upstreamResourceName = $FunctionName
      enable = $true
      enableAuth = $false
      enableSafeDomain = $false
      enablePathTransmission = $true
    },
    @{
      path = "/api/demo/reset"
      upstreamResourceType = "SCF"
      upstreamResourceName = $FunctionName
      enable = $true
      enableAuth = $false
      enableSafeDomain = $false
      enablePathTransmission = $true
    },
    @{
      path = "/api/questionnaire"
      upstreamResourceType = "SCF"
      upstreamResourceName = $FunctionName
      enable = $true
      enableAuth = $false
      enableSafeDomain = $false
      enablePathTransmission = $true
    }
  )
} | ConvertTo-Json -Depth 8 -Compress).Replace('"', '\"')

& $Npx cloudbase routes add -e $EnvId --data $routeJson --json --yes

Write-Host "6/6 Deploying frontend static hosting..."
& $Npx cloudbase hosting deploy $FrontendDir "/" -e $EnvId

Write-Host ""
Write-Host "Deployment commands completed."
Write-Host "If hosting is enabled, open CloudBase console > Static Website Hosting to copy the public domain."
Write-Host "Public form path: /"
Write-Host "Admin path: /?admin=1"
Write-Host "Admin token: $AdminToken"
