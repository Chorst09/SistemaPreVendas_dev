import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep shared presentation code in sync without replacing either app's access flow or APIs.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'components/layout/application-shell.tsx', 'components/layout/application-header.tsx',
  'components/layout/Nav3DIcon.tsx',
  'components/dashboard/DashboardOverview.tsx', 'components/dashboard/MetricCard.tsx',
  'components/dashboard/RevenueChart.tsx', 'components/dashboard/PipelineChart.tsx',
  'components/shared/ModuleLauncher.tsx', 'components/ui/page-header.tsx',
  'components/ui/card.tsx', 'components/ui/button.tsx', 'components/ui/dialog.tsx',
  'components/ui/table.tsx', 'components/ui/input.tsx', 'components/ui/select.tsx', 'components/ui/badge.tsx',
  'lib/dashboard.ts', 'hooks/use-module-navigation.ts', 'hooks/use-record-link.ts', 'styles/workspace.css',
];
const check = process.argv.includes('--check');
const pairs = files.map(file => [`src/${file}`, `frontend/src/${file}`]);
for (const file of await readdir(path.join(root, 'public/fonts'))) pairs.push([`public/fonts/${file}`, `frontend/public/fonts/${file}`]);
let mismatches = 0;
for (const [source, target] of pairs) {
  if (check) {
    try { if (!(await readFile(path.join(root, source))).equals(await readFile(path.join(root, target)))) throw new Error('different'); }
    catch { console.error(`Interface divergente: ${target}`); mismatches++; }
  } else {
    await mkdir(path.dirname(path.join(root, target)), { recursive: true });
    await copyFile(path.join(root, source), path.join(root, target));
  }
}
if (mismatches) process.exitCode = 1;
else console.log(`${pairs.length} arquivos de interface ${check ? 'conferidos' : 'sincronizados'}.`);
