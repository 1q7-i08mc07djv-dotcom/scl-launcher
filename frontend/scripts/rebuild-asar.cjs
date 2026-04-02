// scripts/rebuild-asar.cjs
// CommonJS version - rebuilds app.asar for the electron package
const { mkdirSync, cpSync, rmSync, writeFileSync, statSync, readdirSync } = require('fs');
const { join, dirname } = require('path');
const { execSync } = require('child_process');

const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const resourcesDir = join(root, 'release', 'win-unpacked', 'resources');

console.log('[rebuild] Step 1: Running vite build...');
try {
  execSync('npm run build', { cwd: root, stdio: 'inherit', timeout: 120000 });
  console.log('[rebuild] Vite done');
} catch (e) {
  console.error('[rebuild] Vite failed:', e.message);
  process.exit(1);
}

// Copy electron files
cpSync(join(root, 'electron', 'main.cjs'), join(distDir, 'main.cjs'));
cpSync(join(root, 'electron', 'preload.js'), join(distDir, 'preload.js'));
console.log('[rebuild] Copied electron files');

// Write package.json
const appPkg = { name: 'scl-launcher', productName: 'SCL Launcher', version: '1.0.0', main: 'main.cjs', private: true };
writeFileSync(join(distDir, 'package.json'), JSON.stringify(appPkg, null, 2));
console.log('[rebuild] Wrote package.json');

// Create app.asar using asar CLI
mkdirSync(resourcesDir, { recursive: true });
const appAsarPath = join(resourcesDir, 'app.asar');
rmSync(appAsarPath, { force: true });

console.log('[rebuild] Creating app.asar...');
try {
  execSync(`node "${join(root, 'node_modules', 'asar', 'cli.js')}" pack "${distDir}" "${appAsarPath}"`, {
    cwd: root,
    stdio: 'inherit',
    timeout: 60000
  });
  const size = statSync(appAsarPath).size;
  console.log(`[rebuild] app.asar created! Size: ${(size/1024/1024).toFixed(2)} MB`);
} catch (e) {
  console.error('[rebuild] asar failed:', e.message);
  process.exit(1);
}

// Copy start-backend.bat
const batDest = join(resourcesDir, 'start-backend.bat');
rmSync(batDest, { force: true });
cpSync(join(root, 'start-backend.bat'), batDest);
console.log('[rebuild] start-backend.bat copied');
console.log('[rebuild] All done!');
