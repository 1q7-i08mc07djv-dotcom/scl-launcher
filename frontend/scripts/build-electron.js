// scripts/build-electron.js
import { mkdirSync, cpSync, rmSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const backendDir = join(root, '..', 'backend');
const backendJarSrc = join(backendDir, 'build', 'libs', 'scl-backend-1.0.0.jar');
const backendJarDst = join(distDir, 'scl-backend-1.0.0.jar');

console.log('[build] Preparing dist/ as electron app bundle...');

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('[build] Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

// Build backend if jar doesn't exist
if (!existsSync(backendJarSrc)) {
  console.log('[build] Building backend jar...');
  try {
    execSync('cd "' + backendDir + '" && .\\gradlew.bat build --no-daemon', { stdio: 'inherit', windowsHide: true });
  } catch (e) {
    console.error('[build] Backend build failed:', e.message);
    process.exit(1);
  }
}

// Copy backend jar to dist/
cpSync(backendJarSrc, backendJarDst);
console.log('[build] Copied backend jar to dist/');

// Copy electron files into dist/
cpSync(join(root, 'electron', 'main.cjs'), join(distDir, 'main.cjs'));
cpSync(join(root, 'electron', 'preload.js'), join(distDir, 'preload.js'));
console.log('[build] Copied main.cjs, preload.js');

// Copy start-backend.bat to dist/
const batContent = `@echo off
cd /d "%~dp0"
echo Starting SCL Backend...
start "" javaw -jar "%~dp0scl-backend-1.0.0.jar"
`;
writeFileSync(join(distDir, 'start-backend.bat'), batContent);
console.log('[build] Created start-backend.bat');

// Also update root frontend/start-backend.bat
writeFileSync(join(root, 'start-backend.bat'), batContent);
console.log('[build] Updated root start-backend.bat');

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
      'start-backend.bat',
      'scl-backend-1.0.0.jar'
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

console.log('[build] Build complete!');
console.log('[build] To sign the exe, run: node scripts/sign-exe.js');
console.log('[build] For production signing, set SCL_SIGN_CERT_PATH and SCL_SIGN_CERT_PASSWORD env vars');
