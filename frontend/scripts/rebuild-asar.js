// scripts/rebuild-asar.js
// Rebuilds app.asar from dist/
import { mkdirSync, cpSync, rmSync, existsSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const resourcesDir = join(root, 'release', 'win-unpacked', 'resources');

// 1. Remove old dist contents to start fresh
console.log('[rebuild] Cleaning old dist...');
try { rmSync(distDir, { recursive: true, force: true }); } catch {}

// 2. Run vite build
console.log('[rebuild] Running vite build...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { cwd: root, stdio: 'pipe' });
  console.log('[rebuild] Vite done');
} catch (e) {
  console.error('[rebuild] Vite build failed:', e.message);
  process.exit(1);
}

// 3. Copy electron files into dist/
cpSync(join(root, 'electron', 'main.cjs'), join(distDir, 'main.cjs'));
cpSync(join(root, 'electron', 'preload.js'), join(distDir, 'preload.js'));
console.log('[rebuild] Copied electron files');

// 4. Write package.json to dist/
const appPkg = { name: 'scl-launcher', productName: 'SCL Launcher', version: '1.0.0', main: 'main.cjs', private: true };
writeFileSync(join(distDir, 'package.json'), JSON.stringify(appPkg, null, 2));
console.log('[rebuild] Wrote package.json');

// 5. Create app.asar
mkdirSync(resourcesDir, { recursive: true });
const appAsarPath = join(resourcesDir, 'app.asar');
rmSync(appAsarPath, { force: true });

console.log('[rebuild] Creating app.asar...');
const asar = require(join(root, 'node_modules', 'asar'));
asar.createPackage(distDir, appAsarPath, () => {
  const size = statSync(appAsarPath).size;
  console.log(`[rebuild] app.asar created! Size: ${(size/1024/1024).toFixed(2)} MB`);

  // 6. Copy start-backend.bat
  const batDest = join(resourcesDir, 'start-backend.bat');
  rmSync(batDest, { force: true });
  cpSync(join(root, 'start-backend.bat'), batDest);
  console.log('[rebuild] start-backend.bat copied');

  // 7. Delete empty dist
  try { rmSync(distDir, { recursive: true, force: true }); } catch {}
  console.log('[rebuild] All done!');
});
