from pathlib import Path
import os,select,subprocess,json,tempfile
w=Path(__file__).resolve().parents[1]
old=Path(os.environ['KHROMIUM_TEST_RUNTIME'])
full=os.environ.get('KHROMIUM_TEST_FULL')=='1'
env=dict(os.environ,LD_LIBRARY_PATH=str(old/'test-runtime/root/usr/lib/x86_64-linux-gnu'),GTK_MODULES='',GTK_UI_TEST_LOG='1')
Path('/tmp/khromium-input.html').write_text('''<meta charset="utf-8"><title>Full-page test</title><style>body{height:3000px;margin:0}input{margin:50px;font-size:28px}</style><input autofocus><script>window.enters=0;window.arrows=[];document.querySelector('input').onkeydown=e=>{if(e.key==='Enter')enters++;if(e.key.startsWith('Arrow'))arrows.push(e.key)}</script>''')
for name in ('a','b'):
 Path('/tmp/khromium-nav-'+name+'.html').write_text('<title>Page '+name.upper()+'</title><h1>Page '+name.upper()+'</h1><script>window.loads=+(sessionStorage.getItem("loads-'+name+'")||0)+1;sessionStorage.setItem("loads-'+name+'",loads)</script>')
out=w/'build/test';out.mkdir(parents=True,exist_ok=True)
logname='full' if full else 'integration'
with tempfile.TemporaryDirectory(prefix='khromium-profile-') as profile,(out/'xvfb.log').open('w') as log:
 helper=Path(profile)/'orientation.sh';record=Path(profile)/'orientation.log'
 helper.write_text('#!/bin/sh\necho "$*" >> "'+str(record)+'"\n');helper.chmod(0o755)
 refresh=Path(profile)/'refresh.log';eips=Path(profile)/'eips';eips.write_text('#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$KHROMIUM_REFRESH_LOG"\n');eips.chmod(0o755)
 env.update(KHROMIUM_ORIENTATION_HELPER=str(helper),KHROMIUM_ORIENTATION_PREVIOUS='U',KHROMIUM_REFRESH_LOG=str(refresh),PATH=profile+os.pathsep+os.environ['PATH'])
 if full:(Path(profile)/'khromium.ini').write_text('[FullPage]\nurl=file:///tmp/khromium-input.html\norientation=3\n')
 else:
  (Path(profile)/'khromium.ini').write_text('[Browser]\nhomepage=chrome://dino\n[FullPage]\nurl=chromium://dino\n')
  old_pages=''.join('[Page'+str(i)+']\ntitle=Removed\nurl='+url+'\n' for i,url in enumerate(('chrome://settings','chromium://settings','chrome://dino','chromium://dino')))
  (Path(profile)/'favorites.ini').write_text(old_pages+'[Page4]\ntitle=Keep me\nurl=https://example.test/keep\n')
  (Path(profile)/'history.ini').write_text(old_pages)

 server=subprocess.Popen([str(old/'test-runtime/root/usr/bin/Xvfb'),'-displayfd','1','-screen','0','1600x1600x24','-nolisten','tcp'],env=env,stdout=subprocess.PIPE,stderr=log)
 try:
  assert select.select([server.stdout],[],[],15)[0];env['DISPLAY']=':'+server.stdout.readline().decode().strip()
  with (out/(logname+'.log')).open('w') as result:
   subprocess.run([str(w/'build/frontend-amd64/integration'),'--engine',os.environ.get('UI_TEST_ENGINE',str(old/'official-engine/chrome-headless-shell-linux64/chrome-headless-shell')),'--profile',profile,'--assets',str(w/'assets'),'--unsafe-no-sandbox',*(['--full-page'] if full else [])],cwd=out,env=env,stdout=result,stderr=result,check=True,timeout=110)
  prefs=(Path(profile)/'khromium.ini').read_text();rotations=record.read_text().splitlines()
  assert rotations[-1]=='set U',rotations
  assert ('set L' if full else 'set R') in rotations,rotations
  if not full:
   assert refresh.read_text().strip()=='-c'
   assert all(v in prefs for v in ('user_agent=1','search=2','ui_scale=150','orientation=3','url=file:///tmp/khromium-input.html')),prefs
   saved=(Path(profile)/'favorites.ini').read_text();assert 'khromium-input.html' in saved and 'https://example.test/keep' in saved and 'chrome://' not in saved and 'chromium://' not in saved
 finally:server.terminate();server.wait(timeout=10)
values=[];logtext=(out/(logname+'.log')).read_text()
for line in logtext.splitlines():
 if line.startswith('CDP JSON '):
  data=json.loads(line[9:]);remote=data.get('result',{}).get('result',{})
  if isinstance(remote.get('value'),str):
   try:
    v=json.loads(remote['value'])
    if isinstance(v,dict) and 'test' in v:values.append(v)
   except ValueError:pass
print(values)
if full:
 assert values==[{'test':'full','title':'Full-page test','value':'ñ'}],values
 print('PASS: configured full-page URL, hidden chrome, automatic keyboard focus/blur, exit hold, orientation request/restoration')
else:
 assert '"cookies":[]' in logtext
 checks={v['test']:v for v in values};assert set(checks)=={'zoom','typing','scroll','back','reload','forward'},values
 assert checks['zoom']['dpr']==1.5 and 'Android 11' in checks['zoom']['ua'] and checks['zoom']['mobile'],values
 assert checks['typing']['value']=='hIñÑ' and checks['typing']['enters']==1,values
 assert checks['typing']['arrows']==['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'],values
 assert checks['scroll']['y']>0,values
 assert checks['back']['title']=='Page A' and checks['forward']['title']=='Page B',values
 assert checks['reload']['loads']>checks['back']['loads'],values
 print('PASS: single-window panels, radio selectors, both scales, page zoom, keyboard focus/blur, ñ/Ñ/Enter/arrows, scrolling, favorites, cookies, orientation persistence and landscape UI')
