$ErrorActionPreference = 'Stop'
$t04Dir = Join-Path (Get-Location) 'docs/evidence/T04'
$t04Sha = (& git rev-parse HEAD).Trim()
$t04Start = (Get-Date).ToUniversalTime().ToString('o')
function Get-T04DistInventory {
  @(Get-ChildItem -LiteralPath dist -Recurse -File | ForEach-Object {
    [ordered]@{path=$_.FullName.Substring((Get-Location).Path.Length+1);bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()}
  })
}
$t04Before = Get-T04DistInventory
$t04Results = @()
foreach ($t04Step in @(
  @{name='check';exe='npm.cmd';args=@('run','check')},
  @{name='test';exe='node';args=@('--test','tests/finance.test.mjs')},
  @{name='build';exe='npm.cmd';args=@('run','build')}
)) {
  $t04Log = Join-Path $t04Dir ('reviewer-'+$t04Sha.Substring(0,7)+'-'+$t04Step.name+'.log')
  $t04StepStart = (Get-Date).ToUniversalTime().ToString('o')
  & $t04Step.exe @($t04Step.args) 2>&1 | Out-File -LiteralPath $t04Log -Encoding utf8
  $t04Exit = $LASTEXITCODE
  $t04Results += [ordered]@{command=($t04Step.exe+' '+($t04Step.args -join ' '));exitCode=$t04Exit;startedAt=$t04StepStart;finishedAt=(Get-Date).ToUniversalTime().ToString('o');rawLog=$t04Log}
  if ($t04Exit -ne 0) { break }
}
$t04After = Get-T04DistInventory
$t04Changes = @($t04After | Where-Object {
  $t04Item = $_
  $t04Old = @($t04Before | Where-Object {$_.path -eq $t04Item.path})
  $t04Old.Count -ne 1 -or $t04Old[0].sha256 -ne $t04Item.sha256
})
$t04Result = [ordered]@{
  sha=$t04Sha;shaAfter=(& git rev-parse HEAD).Trim();startedAt=$t04Start;finishedAt=(Get-Date).ToUniversalTime().ToString('o');commands=$t04Results
  node=(& node --version);npm=(& npm.cmd --version);astro=(Get-Content -LiteralPath node_modules/astro/package.json -Raw -Encoding UTF8 | ConvertFrom-Json).version
  packageHash=(Get-FileHash -LiteralPath package.json -Algorithm SHA256).Hash.ToLower();lockfileHash=(Get-FileHash -LiteralPath package-lock.json -Algorithm SHA256).Hash.ToLower()
  distBefore=$t04Before;distAfter=$t04After;changedOutputs=$t04Changes;outputCountUnchanged=($t04Before.Count -eq $t04After.Count)
  appStatus=(& git status --porcelain --untracked-files=all -- src public tests package.json package-lock.json astro.config.mjs tsconfig.json) -join "`n"
  listener=@(Get-NetTCPConnection -LocalPort 4321 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess)
}
$t04Result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $t04Dir ('reviewer-checks-'+$t04Sha.Substring(0,7)+'.json')) -Encoding UTF8
[ordered]@{sha=$t04Sha;commands=$t04Results;distFiles=$t04After.Count;changedOutputs=$t04Changes.Count;appStatus=$t04Result.appStatus} | ConvertTo-Json -Depth 6
if (@($t04Results | Where-Object {$_.exitCode -ne 0}).Count -or $t04Changes.Count -or -not $t04Result.outputCountUnchanged -or $t04Result.appStatus -or $t04Result.shaAfter -ne $t04Sha) { exit 1 }
