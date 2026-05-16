const { spawnSync } = require('node:child_process');

require('rigour-cli-shim');

const shimPath = require.resolve('rigour-cli-shim/bin/rigour.js');
const result = spawnSync(process.execPath, [shimPath, 'init', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);