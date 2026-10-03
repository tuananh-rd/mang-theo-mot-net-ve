$ErrorActionPreference = 'Stop'
$c03Dir = Join-Path (Get-Location) 'docs/evidence/C03'
$c03Sha = (& git rev-parse HEAD).Trim()
$c03Start = (Get-Date).ToUniversalTime().ToString('o')
function Get-C03DistInventory {
  @(Get-ChildItem -LiteralPath dist -Recurse -File | ForEach-Object {
    [ordered]@{path=$_.FullName.Substring((Get-Location).Path.Length+1);bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()}
  })
}
$c03Before = Get-C03DistInventory
$c03Results = @()
foreach ($c03Step in @(
  @{name='check';exe='npm.cmd';args=@('run','check')},
  @{name='test';exe='node';args=@('--test','tests/finance.test.mjs')},
  @{name='build';exe='npm.cmd';args=@('run','build')}
)) {
  $c03Log = Join-Path $c03Dir ('reviewer-'+$c03Sha.Substring(0,7)+'-'+$c03Step.name+'.log')
  $c03StepStart = (Get-Date).ToUniversalTime().ToString('o')
  & $c03Step.exe @($c03Step.args) 2>&1 | Out-File -LiteralPath $c03Log -Encoding utf8
  $c03Exit = $LASTEXITCODE
  $c03Results += [ordered]@{command=($c03Step.exe+' '+($c03Step.args -join ' '));exitCode=$c03Exit;startedAt=$c03StepStart;finishedAt=(Get-Date).ToUniversalTime().ToString('o');rawLog=$c03Log}
  if ($c03Exit -ne 0) { break }
}
$c03After = Get-C03DistInventory
$c03Changes = @($c03After | Where-Object {
  $c03Item = $_
  $c03Old = @($c03Before | Where-Object {$_.path -eq $c03Item.path})
  $c03Old.Count -ne 1 -or $c03Old[0].sha256 -ne $c03Item.sha256
})
$c03Result = [ordered]@{
  sha=$c03Sha;shaAfter=(& git rev-parse HEAD).Trim();startedAt=$c03Start;finishedAt=(Get-Date).ToUniversalTime().ToString('o');commands=$c03Results
  node=(& node --version);npm=(& npm.cmd --version);astro=(Get-Content -LiteralPath node_modules/astro/package.json -Raw -Encoding UTF8 | ConvertFrom-Json).version
  packageHash=(Get-FileHash -LiteralPath package.json -Algorithm SHA256).Hash.ToLower();lockfileHash=(Get-FileHash -LiteralPath package-lock.json -Algorithm SHA256).Hash.ToLower()
  distBefore=$c03Before;distAfter=$c03After;changedOutputs=$c03Changes;outputCountUnchanged=($c03Before.Count -eq $c03After.Count)
  appStatus=(& git status --porcelain --untracked-files=all -- src public tests package.json package-lock.json astro.config.mjs tsconfig.json) -join "`n"
  listener=@(Get-NetTCPConnection -LocalPort 4322 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess)
}
$c03Result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $c03Dir ('reviewer-checks-'+$c03Sha.Substring(0,7)+'.json')) -Encoding UTF8
[ordered]@{sha=$c03Sha;commands=$c03Results;distFiles=$c03After.Count;changedOutputs=$c03Changes.Count;appStatus=$c03Result.appStatus} | ConvertTo-Json -Depth 6
if (@($c03Results | Where-Object {$_.exitCode -ne 0}).Count -or $c03Changes.Count -or -not $c03Result.outputCountUnchanged -or $c03Result.appStatus -or $c03Result.shaAfter -ne $c03Sha) { exit 1 }
