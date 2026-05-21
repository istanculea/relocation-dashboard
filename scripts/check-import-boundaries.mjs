import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const srcRoot = path.resolve('apps', 'web', 'src');

const importPattern = /(?:import\s+[^'"`]*?from\s+|import\s*\(\s*)["']([^"']+)["']/g;

const toPosix = (value) => value.split(path.sep).join('/');

const collectSourceFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(absPath);
    }
    if (!/\.(js|jsx|mjs)$/.test(entry.name)) {
      return [];
    }
    if (/\.test\.(js|jsx|mjs)$/.test(entry.name)) {
      return [];
    }
    return [absPath];
  }));

  return files.flat();
};

const resolveImportPath = (filePath, importSpecifier) => {
  if (!importSpecifier.startsWith('.')) {
    return null;
  }

  return path.resolve(path.dirname(filePath), importSpecifier);
};

const isPlatformAdapter = (relativeFile) => {
  const file = toPosix(relativeFile);
  return file === 'platform/graph/contracts.js'
    || file === 'platform/maps/transportHeuristics.js'
    || file === 'platform/simulation/budgetShockAdapters.js'
    || file === 'platform/exports/exportActions.js'
    || file.endsWith('/index.js');
};

const isApplicationAdapter = (relativeFile) => {
  const file = toPosix(relativeFile);
  return file === 'application/atlas/mobilityState.jsx'
    || file === 'application/compare/dashboardState.jsx'
    || file.endsWith('/index.js');
};

const fail = (message) => {
  throw new Error(message);
};

const violations = [];

const checkBoundaryViolation = ({ relativeFile, resolvedImportAbs }) => {
  const relImport = toPosix(path.relative(srcRoot, resolvedImportAbs));
  const relFile = toPosix(relativeFile);

  if (relFile.startsWith('platform/') && !isPlatformAdapter(relFile)) {
    const forbidden = [
      'components/',
      'app/',
      'context/',
      'relocationData.js',
    ];

    if (forbidden.some((prefix) => relImport === prefix || relImport.startsWith(prefix))) {
      violations.push(`${relFile} imports forbidden source layer path: apps/web/src/${relImport}`);
    }
  }

  if (relFile.startsWith('application/') && !isApplicationAdapter(relFile)) {
    const forbidden = ['data/', 'relocationData.js'];
    if (forbidden.some((prefix) => relImport === prefix || relImport.startsWith(prefix))) {
      violations.push(`${relFile} imports forbidden data layer path: apps/web/src/${relImport}`);
    }
  }
};

async function main() {
  const sourceFiles = await collectSourceFiles(srcRoot);

  await Promise.all(sourceFiles.map(async (filePath) => {
    const fileContent = await readFile(filePath, 'utf8');
    const relativeFile = path.relative(srcRoot, filePath);

    for (const match of fileContent.matchAll(importPattern)) {
      const specifier = match[1];
      const resolved = resolveImportPath(filePath, specifier);
      if (!resolved) {
        continue;
      }

      checkBoundaryViolation({ relativeFile, resolvedImportAbs: resolved });
    }
  }));

  if (violations.length > 0) {
    fail(`Import boundary violations:\n- ${violations.join('\n- ')}`);
  }

  console.log('Import boundary OK.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
