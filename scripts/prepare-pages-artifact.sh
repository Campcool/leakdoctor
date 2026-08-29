#!/usr/bin/env bash
set -euo pipefail

readonly output_dir="_site"

# Site policy: deny internal roots first, then allow only explicit public paths.
readonly -a deny_rules=(
  '/_site/***'
  '/work/***'
  '/.git*'
  '/.github/***'
  '/scripts/***'
  '/docs/***'
  '/ads/***'
  '/*.md'
  '/data/service-options.json'
  '/logo/manifest.csv'
  '/logo/*.zip'
)
readonly -a public_rules=(
  '/.nojekyll'
  '/CNAME'
  '/*.html'
  '/header.js'
  '/leak-guide.js'
  '/*.png'
  '/*.jpg'
  '/*.svg'
  '/*.ico'
  '/assets/***'
  '/articles/***'
  '/cases/***'
  '/cases-clean/***'
  '/cases.json'
  '/data/'
  '/data/leak-guide.json'
  '/logo/'
  '/logo/logos/'
  '/logo/logos/logo-master-transparent.png'
  '/logo/logos/logo-master-transparent.webp'
  '/logo/logos/website-header-logo-640x240.png'
  '/logo/logos/website-header-logo-640x240.webp'
  '/robots.txt'
  '/sitemap.xml'
  '/llms.txt'
)
readonly -a required_paths=(
  'index.html'
  'CNAME'
  'header.js'
  'cases.json'
  'data/leak-guide.json'
  'logo/logos/logo-master-transparent.png'
  'logo/logos/website-header-logo-640x240.png'
  'logo/logos/website-header-logo-640x240.webp'
  'robots.txt'
  'sitemap.xml'
  'llms.txt'
)
readonly -a denied_paths=(
  'AI-README.md'
  'scripts'
  'docs'
  'ads'
  'data/service-options.json'
  'logo/manifest.csv'
  'logo/huitailang-download-ready-web-optimized.zip'
)

mkdir -p "$output_dir"
rsync_args=(-a --delete --delete-excluded --prune-empty-dirs)
for rule in "${deny_rules[@]}"; do rsync_args+=(--exclude "$rule"); done
for rule in "${public_rules[@]}"; do rsync_args+=(--include "$rule"); done
rsync_args+=(--exclude '*')
rsync "${rsync_args[@]}" ./ "$output_dir/"

for required in "${required_paths[@]}"; do
  if [ ! -e "$output_dir/$required" ]; then
    echo "::error title=Pages artifact invalid::$required is missing from $output_dir"
    exit 1
  fi
done

for denied in "${denied_paths[@]}"; do
  if [ -e "$output_dir/$denied" ]; then
    echo "::error title=Internal path leaked::$denied must not be included in the Pages artifact"
    exit 1
  fi
done

echo "Public Pages artifact ready: $(find "$output_dir" -type f | wc -l | tr -d ' ') files"
find "$output_dir" -type f -print | sort
