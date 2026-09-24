#!/bin/zsh
set -e

cd "${0:A:h}"
node scripts/generate.mjs

echo
echo "生成完成。按回车键关闭窗口。"
read
