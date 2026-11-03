#!/usr/bin/env python3
"""Cross-compile the GTK2 frontend with the Kindle soft-float ABI.

KINDLE_SF_TOOLCHAIN: extracted koxtoolchain arm-kindlepw2-linux-gnueabi directory.
KINDLE_SF_SYSROOT: extracted Debian Wheezy armel GTK2 development packages.
The compiler supplies its own glibc 2.12 headers/start files; GTK libraries are
link-time inputs only. Production uses the Kindle's existing GTK2 libraries.
"""
from pathlib import Path
import os, subprocess, shlex
root=Path(__file__).resolve().parents[1]
toolchain=Path(os.environ.get('KINDLE_SF_TOOLCHAIN',str(root/'build/sf-toolchain/x-tools/arm-kindlepw2-linux-gnueabi'))).resolve()
sysroot=Path(os.environ.get('KINDLE_SF_SYSROOT',str(root/'build/sf-sysroot'))).resolve()
compiler=toolchain/'bin/arm-kindlepw2-linux-gnueabi-gcc'
env=dict(os.environ,PKG_CONFIG_SYSROOT_DIR=str(sysroot),PKG_CONFIG_LIBDIR=':'.join(str(sysroot/p) for p in ('usr/lib/arm-linux-gnueabi/pkgconfig','usr/lib/pkgconfig','usr/share/pkgconfig')),PKG_CONFIG_PATH='')
flags=shlex.split(subprocess.check_output(['pkg-config','--cflags','--libs','gtk+-2.0'],env=env,text=True))
out=root/'build/frontend-sf';out.mkdir(parents=True,exist_ok=True)
binary=out/os.environ.get('KHROMIUM_BINARY','khromium')
source=root/os.environ.get('KHROMIUM_SOURCE','frontend/browser.c')
extra=['-DBROWSER_TEST'] if os.environ.get('KHROMIUM_TEST')=='1' else []
subprocess.run([str(compiler),'-std=c11','-O2','-g0','-Wall','-Wextra','-Werror','-Wno-deprecated-declarations','-march=armv7-a','-mfpu=neon','-mfloat-abi=softfp','-DKINDLE_UI','-Wl,--as-needed',*extra,str(source),'-o',str(binary),*flags,'-Wl,-rpath-link,'+str(sysroot/'usr/lib/arm-linux-gnueabi'),'-Wl,-rpath-link,'+str(sysroot/'lib/arm-linux-gnueabi')],check=True)
print(binary)
