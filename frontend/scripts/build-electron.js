// scripts/build-electron.js
import { mkdirSync, cpSync, rmSync, existsSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const serverDir = join(root, '..', 'server');

console.log('[build] Preparing dist/ as electron app bundle...');

if (!existsSync(join(distDir, 'index.html'))) {
  console.error('[build] Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

// 安装 server 依赖（如果还没有 node_modules）
if (!existsSync(join(serverDir, 'node_modules'))) {
  console.log('[build] Installing server dependencies...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
}

// 复制 server 目录到 dist/server/（排除 node_modules 内部的大文件，保留需要的）
console.log('[build] Copying server/ to dist/server/...');
cpSync(serverDir, join(distDir, 'server'), {
  recursive: true,
  filter: (src) => {
    // 排除不需要的文件
    const rel = src.replace(serverDir, '').replace(/\\/g, '/');
    if (rel.includes('/.git')) return false;
    if (rel.includes('/.gitignore')) return false;
    return true;
  }
});
console.log('[build] Copied server/ to dist/');

// 复制 Electron 文件到 dist/
cpSync(join(root, 'electron', 'main.cjs'), join(distDir, 'main.cjs'));
cpSync(join(root, 'electron', 'preload.js'), join(distDir, 'preload.js'));
console.log('[build] Copied main.cjs, preload.js');

// 创建 package.json 供 electron-builder 使用
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
      'server/**/*'
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
