import { readFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist', 'relocation-dashboard');
const indexHtmlPath = path.join(distDir, 'index.html');

const forbiddenEagerPrefixes = [
  'cityExpansionWave-',
  'cityAuditMeta-',
  'city360Meta-',
  'citySourceMeta-',
  'cityTrendData-',
  'verifiedSnapshotSummary-',
];

const stripRelativePrefix = (value) => value.replace(/^\.\//, '');

const getAssetBasename = (value) => stripRelativePrefix(value).split('/').pop();

const parseQuotedStrings = (value) => Array.from(value.matchAll(/"([^"]+)"/g), (match) => match[1]);

const fail = (message) => {
  throw new Error(message);
};

async function main() {
  const indexHtml = await readFile(indexHtmlPath, 'utf8');
  const indexScriptMatch = indexHtml.match(/<script type="module" crossorigin src="\.\/assets\/([^"]+)"><\/script>/);

  if (!indexScriptMatch) {
    fail(`Could not find the built index asset in ${indexHtmlPath}.`);
  }

  const indexAssetName = indexScriptMatch[1];
  const indexAssetPath = path.join(distDir, 'assets', indexAssetName);
  const indexAsset = await readFile(indexAssetPath, 'utf8');

  const dependencyListMatch = indexAsset.match(/m\.f\s*\|\|\s*\(m\.f=\[(.*?)\]\)/s);

  if (!dependencyListMatch) {
    fail(`Could not parse __vite__mapDeps() from ${indexAssetPath}.`);
  }

  const dependencyList = parseQuotedStrings(dependencyListMatch[1]);
  const relocationImportMatch = indexAsset.match(/import\("\.\/(relocationData-[^"]+\.js)"\)\s*,\s*__vite__mapDeps\(\[([^\]]*)\]\)/);

  if (!relocationImportMatch) {
    fail(`Could not find the lazy relocationData import in ${indexAssetPath}.`);
  }

  const eagerDependencyIndices = relocationImportMatch[2]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number.parseInt(value, 10));

  if (eagerDependencyIndices.some(Number.isNaN)) {
    fail(`Could not parse relocationData preload indices from ${indexAssetPath}.`);
  }

  const eagerAssets = [
    relocationImportMatch[1],
    ...eagerDependencyIndices.map((index) => dependencyList[index]).filter(Boolean),
  ].map(getAssetBasename);

  const forbiddenAssets = eagerAssets.filter((assetName) =>
    forbiddenEagerPrefixes.some((prefix) => assetName.startsWith(prefix)),
  );

  if (forbiddenAssets.length > 0) {
    fail(
      [
        'Default dashboard preload regressed.',
        `Forbidden eager chunks: ${forbiddenAssets.join(', ')}`,
        `Observed eager chunks: ${eagerAssets.join(', ')}`,
      ].join('\n'),
    );
  }

  console.log(`Bundle boundary OK. Default dashboard eager chunks: ${eagerAssets.join(', ')}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});