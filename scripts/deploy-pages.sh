#!/bin/sh
# 아이폰 웹앱(PWA)을 GitHub Pages(gh-pages 브랜치)에 올린다.
# 사용법: npm run deploy:pages
set -e
cd "$(dirname "$0")/.."
REMOTE=$(git remote get-url origin)
npm run build
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@localhost" commit -q -m "PWA 배포 $(date '+%Y-%m-%d %H:%M')"
git push -f "$REMOTE" gh-pages
rm -rf .git
echo "배포 완료 → https://happyfamily1984.github.io/onchain-tracker/ (반영까지 1~2분)"
