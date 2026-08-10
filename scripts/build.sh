#!/usr/bin/env bash
# 武汉中考文言文 App — 数据构建管线
#   1) 运行时数据: src/data/raw/*.json -> src/data/runtime/*.json
#   2) 校验:     原始数据、运行时数据及引用完整性
# 用法: ./scripts/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> [1/2] build-runtime-data.mjs  (raw -> runtime)"
node scripts/build-runtime-data.mjs

echo "==> [2/2] validate-data.mjs   (源数据与运行时数据校验)"
node scripts/validate-data.mjs

echo ""
echo "✅ 构建完成."
