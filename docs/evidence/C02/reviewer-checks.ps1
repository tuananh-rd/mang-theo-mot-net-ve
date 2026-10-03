$ErrorActionPreference = 'Stop'
$c01Dir = Join-Path (Get-Location) 'docs/evidence/C02'
$c01Sha = (& git rev-parse HEAD).Trim()
$c01Start = (Get-Date).ToUniversalTime().ToString('o')
function Get-C01DistInventory {
  @(Get-ChildItem -LiteralPath dist -Recurse -File | ForEach-Object {
    [ordered]@{path=$_.FullName.Substring((Get-Location).Path.Length+1);bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()}
  })
}
$c01Before = Get-C01DistInventory
$c01Results = @()
foreach ($c01Step in @(
  @{name='check';exe='npm.cmd';args=@('run','check')},
  @{name='test';exe='node';args=@('--test','tests/finance.test.mjs')},
  @{name='build';exe='npm.cmd';args=@('run','build')}
)) {
  $c01Log = Join-Path $c01Dir ('reviewer-'+$c01Sha.Substring(0,7)+'-'+$c01Step.name+'.log')
  $c01StepStart = (Get-Date).ToUniversalTime().ToString('o')
  & $c01Step.exe @($c01Step.args) 2>&1 | Out-File -LiteralPath $c01Log -Encoding utf8
  $c01Exit = $LASTEXITCODE
  $c01Results += [ordered]@{command=($c01Step.exe+' '+($c01Step.args -join ' '));exitCode=$c01Exit;startedAt=$c01StepStart;finishedAt=(Get-Date).ToUniversalTime().ToString('o');rawLog=$c01Log}
  if ($c01Exit -ne 0) { break }
}
$c01After = Get-C01DistInventory
$c01Changes = @($c01After | Where-Object {
  $c01Item = $_
  $c01Old = @($c01Before | Where-Object {$_.path -eq $c01Item.path})
  $c01Old.Count -ne 1 -or $c01Old[0].sha256 -ne $c01Item.sha256
})
$c01Result = [ordered]@{
  sha=$c01Sha;shaAfter=(& git rev-parse HEAD).Trim();startedAt=$c01Start;finishedAt=(Get-Date).ToUniversalTime().ToString('o');commands=$c01Results
  node=(& node --version);npm=(& npm.cmd --version);astro=(Get-Content -LiteralPath node_modules/astro/package.json -Raw -Encoding UTF8 | ConvertFrom-Json).version
  packageHash=(Get-FileHash -LiteralPath package.json -Algorithm SHA256).Hash.ToLower();lockfileHash=(Get-FileHash -LiteralPath package-lock.json -Algorithm SHA256).Hash.ToLower()
  distBefore=$c01Before;distAfter=$c01After;changedOutputs=$c01Changes;outputCountUnchanged=($c01Before.Count -eq $c01After.Count)
  appStatus=(& git status --porcelain --untracked-files=all -- src public tests package.json package-lock.json astro.config.mjs tsconfig.json) -join "`n"
  listener=@(Get-NetTCPConnection -LocalPort 4322 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess)
}
$c01Result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $c01Dir ('reviewer-checks-'+$c01Sha.Substring(0,7)+'.json')) -Encoding UTF8
[ordered]@{sha=$c01Sha;commands=$c01Results;distFiles=$c01After.Count;changedOutputs=$c01Changes.Count;appStatus=$c01Result.appStatus} | ConvertTo-Json -Depth 6
if (@($c01Results | Where-Object {$_.exitCode -ne 0}).Count -or $c01Changes.Count -or -not $c01Result.outputCountUnchanged -or $c01Result.appStatus -or $c01Result.shaAfter -ne $c01Sha) { exit 1 }
