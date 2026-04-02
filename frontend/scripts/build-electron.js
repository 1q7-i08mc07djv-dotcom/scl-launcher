// scripts/build-electron.js
import { mkdirSync, cpSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const resourcesDir = join(distDir, '..', 'resources'); // win-unpacked/resources/

console.log('[build] Preparing dist/ as electron app bundle...');

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('[build] Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

try { rmSync(join(root, 'release'), { recursive: true, force: true }); } catch {}

// Copy electron files into dist/
cpSync(join(root, 'electron', 'main.cjs'), join(distDir, 'main.cjs'));
cpSync(join(root, 'electron', 'preload.js'), join(distDir, 'preload.js'));
console.log('[build] Copied main.cjs, preload.js');

// Copy start-backend.bat to dist/ (electron-builder extraResources picks it up from here)
cpSync(join(root, 'start-backend.bat'), join(distDir, 'start-backend.bat'));
console.log('[build] Copied start-backend.bat');

// Create package.json in dist/ for electron-builder
const appPkg = {
  name: 'scl-launcher',
  productName: 'SCL Launcher',
  version: '1.0.0',
  description: 'SCL Minecraft Launcher - A modern Minecraft launcher',
  author: { name: 'SCL Team' },
  main: 'main.cjs',
  private: true,
  build: {
    appId: 'com.scl.launcher',
    productName: 'SCL Launcher',
    electronVersion: '41.1.1',
    asar: false,
    files: [
      'package.json',
      'main.cjs',
      'preload.js',
      'index.html',
      'favicon.svg',
      'icons.svg',
      'assets',
      'start-backend.bat'
    ],
    win: {
      target: [
        { target: 'portable', arch: ['x64'] }
      ]
    },
    portable: {
      artifactName: '${productName}-${version}-portable.exe'
    }
  }
};
writeFileSync(join(distDir, 'package.json'), JSON.stringify(appPkg, null, 2));
console.log('[build] Created dist/package.json');
console.log('[build] Done!');
