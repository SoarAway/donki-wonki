#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname, '..');

process.env.NODE_PATH = [
  path.join(workspaceRoot, 'node_modules'),
  path.join(appRoot, 'node_modules'),
  process.env.NODE_PATH || ''
].filter(Boolean).join(path.delimiter);

require('module').Module._initPaths();

const metro = spawn(
  'npx',
  ['react-native', 'start', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    shell: true,
    env: process.env,
    cwd: appRoot
  }
);

metro.on('exit', (code) => {
  process.exit(code);
});
