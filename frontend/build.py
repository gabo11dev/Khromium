#!/usr/bin/env python3
"""Build GTK2 frontend. Cross build requires a Chromium checkout/sysroot."""
import os
from pathlib import Path
import shlex
import subprocess
import sys

project=Path(__file__).resolve().parents[1]
source=project/os.environ.get('KHROMIUM_SOURCE','frontend/browser.c')
arch=sys.argv[1] if len(sys.argv)>1 else 'armhf'
if arch not in ('armhf','amd64'):
    raise SystemExit('Usage: build.py [armhf|amd64]')
extra=['-march=armv7-a','-mfpu=neon','-mfloat-abi=hard','-DKINDLE_UI'] if arch=='armhf' else ['-DBROWSER_TEST']
env=dict(os.environ)
checkout=os.environ.get('CHROMIUM_SRC')
if checkout:
    checkout=Path(checkout)
    sysroot=checkout/f'build/linux/debian_bullseye_{arch}-sysroot'
    compiler=[str(checkout/'third_party/llvm-build/Release+Asserts/bin/clang'),
              '--target='+('arm-linux-gnueabihf' if arch=='armhf' else 'x86_64-linux-gnu'),
              f'--sysroot={sysroot}','-fuse-ld=lld']
    env.update(PKG_CONFIG_SYSROOT_DIR=str(sysroot),PKG_CONFIG_LIBDIR=f'{sysroot}/usr/lib/pkgconfig:{sysroot}/usr/share/pkgconfig')
else:
    if arch=='armhf':raise SystemExit('Set CHROMIUM_SRC to a Chromium checkout with the ARMhf Bullseye sysroot and Clang installed.')
    compiler=shlex.split(os.environ.get('CC','cc'))
flags=shlex.split(subprocess.check_output(['pkg-config','--cflags','--libs','gtk+-2.0'],env=env,text=True))
output=project/f'build/frontend-{arch}'
output.mkdir(parents=True,exist_ok=True)
binary=output/os.environ.get('KHROMIUM_BINARY','khromium')
subprocess.run([*compiler,'-std=c11','-O2','-g0','-Wall','-Wextra','-Werror',
               '-Wno-deprecated-declarations','-Wl,--as-needed',*extra,str(source),'-o',str(binary),*flags],check=True)
print(binary)
