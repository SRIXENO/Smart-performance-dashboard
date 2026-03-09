const { existsSync, mkdirSync, writeFileSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = process.cwd();
const hooksDir = path.join(repoRoot, '.githooks');
const hookFile = path.join(hooksDir, 'pre-push');

if (!existsSync(hooksDir)) {
  mkdirSync(hooksDir, { recursive: true });
}

if (!existsSync(hookFile)) {
  writeFileSync(
    hookFile,
    '#!/usr/bin/env sh\nnpm run test:prepush\n',
    'utf8'
  );
}

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
  console.log('[hooks] core.hooksPath set to .githooks');
} catch (error) {
  console.warn('[hooks] Could not configure git hooks automatically:', error.message);
}
