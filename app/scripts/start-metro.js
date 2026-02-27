#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(appRoot, '..');

const appCliPath = path.join(
  appRoot,
  'node_modules',
  '@react-native-community',
  'cli',
  'build',
  'bin.js'
);
const rootCliPath = path.join(
  workspaceRoot,
  'node_modules',
  '@react-native-community',
  'cli',
  'build',
  'bin.js'
);

const cliPath = fs.existsSync(appCliPath) ? appCliPath : rootCliPath;

const metro = spawn(
  process.execPath,
  [cliPath, 'start', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: [path.join(appRoot, 'node_modules'), path.join(workspaceRoot, 'node_modules')]
        .join(path.delimiter),
    },
    cwd: appRoot
  }
);

metro.on('exit', (code) => {
  process.exit(code);
});
