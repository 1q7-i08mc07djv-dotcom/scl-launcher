// scripts/sign-exe.js
// Windows Authenticode signing for SCL Launcher exe
// Production: set SCL_SIGN_CERT_PATH and SCL_SIGN_CERT_PASSWORD env vars
// Test: creates a self-signed certificate automatically (for testing only)

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIGNTOOL = '"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22621.0\\x64\\signtool.exe"';

const CERT_PATH = process.env.SCL_SIGN_CERT_PATH || '';
const CERT_PASSWORD = process.env.SCL_SIGN_CERT_PASSWORD || '';
const CERT_SUBJECT = process.env.SCL_SIGN_CERT_SUBJECT || 'SCL Launcher';

function log(msg) {
  console.log(`[sign] ${msg}`);
}

function run(cmd, opts = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
    return true;
  } catch (e) {
    return false;
  }
}

async function createSelfSignedCert() {
  log('Creating self-signed code signing certificate for testing...');

  const certFile = join(__dirname, '..', 'release', 'scl-test-cert.pfx');
  const certPassword = 'SCL-Test-2026';

  try {
    // Create self-signed cert using PowerShell
    const psScript = `
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=${CERT_SUBJECT}" -KeyUsage DigitalSignature -KeyAlgorithm RSA -KeyLength 2048 -CertStoreLocation "Cert:\\CurrentUser\\My" -NotAfter (Get-Date).AddYears(1)
$pwd = ConvertTo-SecureString -String "${certPassword}" -Force -AsPlainText
Export-PfxCertificate -Cert "Cert:\\CurrentUser\\My\\$($cert.Thumbprint)" -FilePath "${certFile}" -Password $pwd
Remove-Item "Cert:\\CurrentUser\\My\\$($cert.Thumbprint)"
Write-Host "CERT_CREATED"
`;

    const psFile = join(__dirname, '..', 'release', 'create-cert.ps1');
    writeFileSync(psFile, `\ufeff${psScript}`, 'utf8');

    const result = execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, { stdio: 'pipe' });
    const output = result.toString();

    if (output.includes('CERT_CREATED')) {
      log('Self-signed certificate created successfully');
      return { certFile, password: certPassword };
    }
  } catch (e) {
    log(`Failed to create self-signed cert: ${e.message}`);
  }

  // Fallback: try with makecert if available
  log('Trying makecert fallback...');
  return null;
}

async function signFile(filePath, certFile, password) {
  const timestampServer = 'http://timestamp.digicert.com';

  // Sign with SHA256
  const cmd = `${SIGNTOOL} sign /fd SHA256 /a /f "${certFile}" /p "${password}" /tr "${timestampServer}" /td SHA256 "${filePath}"`;

  log(`Signing: ${filePath}`);
  const success = run(cmd);

  if (success) {
    log(`Signed successfully: ${filePath}`);
  } else {
    // Try alternate timestamp server
    const altTimestamp = 'http://timestamp.sectigo.com';
    const cmd2 = `${SIGNTOOL} sign /fd SHA256 /a /f "${certFile}" /p "${password}" /tr "${altTimestamp}" /td SHA256 "${filePath}"`;
    const success2 = run(cmd2);
    if (success2) {
      log(`Signed with alternate timestamp: ${filePath}`);
    } else {
      log(`Failed to sign: ${filePath}`);
    }
  }
}

async function signDirectory(dirPath) {
  const { readdirSync, statSync } = await import('fs');
  const { join } = await import('path');

  const files = readdirSync(dirPath);
  for (const file of files) {
    const fullPath = join(dirPath, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      await signDirectory(fullPath);
    } else if (file.endsWith('.exe') || file.endsWith('.dll')) {
      await signFile(fullPath, certFile, password);
    }
  }
}

async function main() {
  const releaseDir = join(__dirname, '..', 'release');
  const unpackedDir = join(__dirname, '..', 'dist', 'dist', 'win-unpacked');
  const exeFile = join(unpackedDir, 'SCL Launcher.exe');

  // Determine signing method
  let certFile = CERT_PATH;
  let password = CERT_PASSWORD;

  if (!certFile || !existsSync(certFile)) {
    log('No certificate provided or file not found.');
    log('To sign for production, set environment variables:');
    log('  SCL_SIGN_CERT_PATH     - Path to .pfx certificate file');
    log('  SCL_SIGN_CERT_PASSWORD - Certificate password');
    log('');
    log('Creating test certificate (Windows SmartScreen will show warning)...');

    const testCert = await createSelfSignedCert();
    if (!testCert) {
      log('Could not create test certificate. Skipping signing.');
      log('The unsigned exe will still run but may be flagged by Windows SmartScreen.');
      process.exit(0);
    }
    certFile = testCert.certFile;
    password = testCert.password;
  }

  // Sign the main exe
  await signFile(exeFile, certFile, password);

  // Also sign DLLs in the unpacked directory (not just resources/app)
  await signDirectory(unpackedDir);

  // Clean up test certificate
  if (certFile.includes('scl-test-cert')) {
    try { unlinkSync(certFile); } catch {}
    const psFile = join(__dirname, '..', 'release', 'create-cert.ps1');
    try { unlinkSync(psFile); } catch {}
    log('Test certificate cleaned up.');
  }

  log('Signing complete!');
}

main().catch(e => {
  console.error('[sign] Error:', e.message);
  process.exit(1);
});
