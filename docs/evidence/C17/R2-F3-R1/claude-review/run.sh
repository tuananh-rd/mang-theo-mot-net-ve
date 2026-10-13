#!/bin/bash
cd "C:/Users/tuana/Documents/Codex/2026-10-02/t/outputs/mang-theo-mot-net-ve"
D=docs/evidence/C17/R2-F3-R1/claude-review/logs
run(){ n=$1; shift; echo "== $n" > $D/$n.log; timeout 900 "$@" >> $D/$n.log 2>&1; echo "exit=$?" >> $D/$n.log; }
echo "head=$(git rev-parse HEAD)" > $D/head.log
run studio-build npm.cmd run studio:build
run preview-build npx astro build --config astro.preview.config.mjs
run root-check npm.cmd run check
run root-test npm.cmd test
run studio-typecheck npm.cmd run studio:typecheck
run studio-test npm.cmd run studio:test
echo done > $D/ALLDONE
