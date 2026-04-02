#!/usr/bin/env python3
"""
rebuild.py - Rebuild app.asar using Python's tarfile module
asar format: tar archive with an 8-byte header followed by the tar data
"""
import tarfile, os, shutil, subprocess, json, struct, sys

FRONTEND = r"C:\Users\Doudou\WorkBuddy\20260401175534\frontend"
DIST = os.path.join(FRONTEND, "dist")
RESOURCES = os.path.join(FRONTEND, "release", "win-unpacked", "resources")
APP_ASAR = os.path.join(RESOURCES, "app.asar")
BACKEND_BAT = os.path.join(RESOURCES, "start-backend.bat")

def remove_file(path):
    if os.path.exists(path):
        os.remove(path)

def run_cmd(cmd, cwd):
    print(f"[rebuild] Running: {' '.join(cmd)}")
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=120)
    if r.stdout: print(r.stdout[-300:])
    if r.returncode != 0: print("FAILED:", r.stderr[-200:])
    return r.returncode == 0

# Step 1: Vite build
print("[1] Vite build...")
if not run_cmd(["npm", "run", "build"], FRONTEND):
    print("[1] Vite build failed")
    sys.exit(1)
print("[1] Vite done")

# Step 2: Copy electron files
print("[2] Copying electron files...")
for f in ["main.cjs", "preload.js"]:
    src = os.path.join(FRONTEND, "electron", f)
    dst = os.path.join(DIST, f)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"  copied {f}")

# Step 3: Write package.json
print("[3] Writing package.json...")
PKG = os.path.join(DIST, "package.json")
with open(PKG, "w") as f:
    json.dump({"name":"scl-launcher","productName":"SCL Launcher","version":"1.0.0","main":"main.cjs","private":True}, f, indent=2)
print("[3] Done")

# Step 4: Create asar (asar = tar + 8-byte header)
print("[4] Creating app.asar...")
os.makedirs(RESOURCES, exist_ok=True)
remove_file(APP_ASAR)

TEMP_TAR = APP_ASAR + ".tmp.tar"
try:
    # Create tar archive (ustar format, gzip optional)
    with tarfile.open(TEMP_TAR, "w") as tar:
        for root_dir, dirs, files in os.walk(DIST):
            # Skip node_modules and hidden dirs
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                if file.startswith('.'):
                    continue
                full_path = os.path.join(root_dir, file)
                arc_name = os.path.relpath(full_path, DIST)
                tar.add(full_path, arc_name)
    
    # Read tar file
    with open(TEMP_TAR, "rb") as f:
        tar_data = f.read()
    
    # Write asar: 8-byte header + tar data
    # Header: 4-byte BE size + 4-byte BE size (same size, for compatibility)
    size = len(tar_data)
    header = struct.pack(">II", size, size)
    with open(APP_ASAR, "wb") as f:
        f.write(header)
        f.write(tar_data)
    
    size_mb = os.path.getsize(APP_ASAR) / 1024 / 1024
    print(f"[4] app.asar created! Size: {size_mb:.2f} MB")
finally:
    remove_file(TEMP_TAR)

# Step 5: Copy start-backend.bat
print("[5] Copying start-backend.bat...")
remove_file(BACKEND_BAT)
ROOT_BAT = os.path.join(FRONTEND, "start-backend.bat")
if os.path.exists(ROOT_BAT):
    shutil.copy2(ROOT_BAT, BACKEND_BAT)
    print("[5] Done")
else:
    print(f"[5] WARNING: {ROOT_BAT} not found!")

print("\n=== All done! ===")
print(f"app.asar: {APP_ASAR}")
print(f"start-backend.bat: {BACKEND_BAT}")
