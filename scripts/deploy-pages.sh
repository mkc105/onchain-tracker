#!/bin/sh
# 아이폰 웹앱(PWA)을 GitHub Pages(gh-pages 브랜치)에 올린다.
# 사용법: npm run deploy:pages
set -e
cd "$(dirname "$0")/.."
# 기본은 origin, 다른 저장소로 올리려면: DEPLOY_REMOTE=mine npm run deploy:pages
REMOTE=$(git remote get-url "${DEPLOY_REMOTE:-origin}")
# https://github.com/<계정>/<저장소>(.git) → https://<계정>.github.io/<저장소>/
URL=$(echo "$REMOTE" | sed -E 's#(https://github.com/|git@github.com:)([^/]+)/([^/.]+)(\.git)?#https://\2.github.io/\3/#')
npm run build
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@localhost" commit -q -m "PWA 배포 $(date '+%Y-%m-%d %H:%M')"
git push -f "$REMOTE" gh-pages
rm -rf .git
echo "배포 완료 → $URL (반영까지 1~2분)"
