#!/usr/bin/env python3
"""Package the new frontend with the known working ARM GTK2 runtime."""
import argparse,hashlib,importlib.util,json,re,shutil,subprocess,tempfile,zipfile
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--base',type=Path,required=True)
p.add_argument('--engine-dir',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args()
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patcher',root/'scripts/patch-interpreter.py')
patcher=importlib.util.module_from_spec(spec);spec.loader.exec_module(patcher)
def sha(path):
 with Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def copy(source,dest,mode=0o644):
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest);dest.chmod(mode)
def source_files():
 return sorted(p for p in root.rglob('*') if p.is_file() and not any(s in ('build','.git','__pycache__') for s in p.relative_to(root).parts) and p.suffix not in ('.zip','.pyc','.core') and p.name!='bundle-dino.js' and 'third_party/dino' not in str(p.relative_to(root)) and not (p.relative_to(root).parts[0]=='assets' and p.name!='home.html'))
with tempfile.TemporaryDirectory(prefix='khromium-package-') as temp:
 stage=Path(temp);app=stage/'extensions/khromium-sf'
 with zipfile.ZipFile(a.base) as base:
  for entry in base.infolist():
   prefix='extensions/chromium-pw4/'
   if entry.filename=='cr156ld.so':
    target=stage/'khromiumsfld.so';target.write_bytes(base.read(entry));target.chmod(0o755)
   elif entry.filename.startswith(prefix):
    rel=Path(entry.filename[len(prefix):])
    if '..' in rel.parts or rel.is_absolute():raise ValueError('Invalid base path')
    if rel.parts and rel.parts[0] in ('runtime','licenses','engine') and not entry.is_dir():
     target=app/rel;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(base.read(entry));target.chmod(0o644)
  old=json.loads(base.read('extensions/chromium-pw4/manifest.json'))
 for name in ('chromium-headless-shell','chrome_crashpad_handler'):
  target=app/'engine'/name;copy(a.engine_dir/name,target,0o755);patcher.patch(target,'/mnt/us/khromiumsfld.so')
 copy(root/'build/frontend-sf/khromium',app/'bin/khromium',0o755)
 for name in ('engine.sh','launch.sh','stop.sh','check.sh','orientation.sh'):copy(root/'scripts'/name,app/name,0o755)
 copy(root/'assets/home.html',app/'assets/home.html')
 for name in ('README.md','LICENSE','THIRD_PARTY_NOTICES.md','CHANGELOG.md','VALIDATION.md'):copy(root/name,app/name)
 shutil.copytree(root/'docs',app/'docs')
 copy(root/'scripts/menu.json',app/'menu.json')
 (app/'config.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<extension><information><name>Khromium SF (Alpha)</name><version>156.0 SF Build 1</version><author>Khromium contributors (AI-assisted)</author></information><menus><menu type="json" dynamic="true">menu.json</menu></menus></extension>\n')
 with zipfile.ZipFile(app/'Khromium-source.zip','w',zipfile.ZIP_DEFLATED) as sources:
  for path in source_files():sources.write(path,path.relative_to(root))
 missing={}
 for path in [app/'engine/chromium-headless-shell',app/'engine/chrome_crashpad_handler',*(app/'runtime/lib').iterdir()]:
  result=subprocess.run(['readelf','-d',str(path)],capture_output=True,text=True)
  if result.returncode:continue
  for name in re.findall(r'\(NEEDED\).*\[([^\]]+)\]',result.stdout):
   if not (app/'runtime/lib'/name).is_file():missing.setdefault(name,[]).append(path.name)
 if missing:raise ValueError('Missing dependencies: '+json.dumps(missing))
 manifest={k:v for k,v in old.items() if k in ('engine','engine_package','engine_source','engine_deb_sha256','common_deb_sha256','runtime','kernel_abi_note')}
 manifest.update(name='Khromium',version='156.0 SF Build 1',interpreter='/mnt/us/khromiumsfld.so',frontend='GTK2 ARMv7 soft-float ABI (softfp), NEON',ai_assisted=True,hardware_tested=False,status='ALPHA: no PW3 available; not tested on any physical PW3; compatibility unconfirmed',sandbox=False,publication='GitHub pre-release', release_stage='alpha', target='PW3 / soft-float firmware <=5.16.2.1.1', engine_abi='ARMhf in a separate process with private libraries', minimum_kernel_verified=False,kindle_window_title='L:A_N:application_PC:T_ID:org.khromium.sf_O:UDLR')
 (app/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (stage/'INSTALL.txt').write_text('Khromium 156.0 SF Build 1\n\nExtract this ZIP into the Kindle USB root. Keep khromiumsfld.so in the root and extensions/khromium-sf as shown. Eject safely, then open Khromium from KUAL. Read extensions/khromium-sf/README.md before use. Jailbroken PW3, soft-float firmware (5.16.2.1.1 or older) and KUAL required. ALPHA: no physical PW3 test; startup and usability are unconfirmed.\n\nThis AI-assisted experimental browser runs without the Chromium sandbox. Avoid sensitive accounts and untrusted pages. The Chromium runtime declares Linux 3.2; PW3 kernel compatibility remains unconfirmed despite QEMU user-mode checks.\n')
 (stage/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+str(p.relative_to(stage))+'\n' for p in sorted(stage.rglob('*')) if p.is_file()))
 a.output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(a.output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as out:
  for path in sorted(stage.rglob('*')):
   if path.is_file():out.write(path,path.relative_to(stage))
 with zipfile.ZipFile(a.output) as check:assert check.testzip() is None
 print(json.dumps({'output':str(a.output),'size_MiB':round(a.output.stat().st_size/2**20,1),'sha256':sha(a.output)},indent=2))
