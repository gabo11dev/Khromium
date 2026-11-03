#!/usr/bin/env python3
"""Download and verify pinned SF build inputs; extract only inside build/."""
from pathlib import Path
import hashlib, json, os, subprocess, urllib.request
root=Path(__file__).resolve().parents[1]
inputs=json.loads((root/'frontend/sf-inputs.json').read_text())
cache=root/'build/sf-downloads';cache.mkdir(parents=True,exist_ok=True)
def download(record):
    target=cache/record['filename']
    if not target.exists() or hashlib.file_digest(target.open('rb'),'sha256').hexdigest()!=record['sha256']:
        part=target.with_suffix(target.suffix+'.part')
        with urllib.request.urlopen(record['url'],timeout=120) as src,part.open('wb') as dst:
            while chunk:=src.read(1024*1024):dst.write(chunk)
        if hashlib.file_digest(part.open('rb'),'sha256').hexdigest()!=record['sha256']:
            part.unlink();raise ValueError('SHA256 mismatch: '+record['filename'])
        part.replace(target)
    return target
compiler=root/'build/sf-toolchain';compiler.mkdir(parents=True,exist_ok=True)
subprocess.run(['tar','--zstd','-xf',str(download(inputs['toolchain'])),'-C',str(compiler)],check=True)
sysroot=root/'build/sf-sysroot';sysroot.mkdir(parents=True,exist_ok=True)
for record in inputs['packages']:
    subprocess.run(['dpkg-deb','-x',str(download(record)),str(sysroot)],check=True)
# Development packages may use absolute links. Keep them within this sysroot.
for path in sysroot.rglob('*'):
    if path.is_symlink() and os.readlink(path).startswith('/'):
        target=sysroot/os.readlink(path).lstrip('/');path.unlink()
        path.symlink_to(os.path.relpath(target,path.parent))
print('Verified SF compiler and development sysroot ready under build/.')
