from pathlib import Path
import os,select,subprocess,json,tempfile
w=Path(__file__).resolve().parents[1]
old=Path(os.environ['KHROMIUM_TEST_RUNTIME'])
env=dict(os.environ,LD_LIBRARY_PATH=str(old/'test-runtime/root/usr/lib/x86_64-linux-gnu'),GTK_MODULES='',GTK_UI_TEST_LOG='1')
Path('/tmp/khromium-input.html').write_text('<meta charset="utf-8"><input autofocus><script>window.enters=0;document.querySelector("input").onkeydown=e=>{if(e.key==="Enter")enters++}</script>')
out=w/'build/test';out.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory(prefix='khromium-profile-') as profile,(out/'xvfb.log').open('w') as log:
 server=subprocess.Popen([str(old/'test-runtime/root/usr/bin/Xvfb'),'-displayfd','1','-screen','0','1200x1600x24','-nolisten','tcp'],env=env,stdout=subprocess.PIPE,stderr=log)
 try:
  assert select.select([server.stdout],[],[],15)[0];env['DISPLAY']=':'+server.stdout.readline().decode().strip()
  with (out/'integration.log').open('w') as result:
   subprocess.run([str(w/'build/frontend-amd64/integration'),'--engine',os.environ.get('UI_TEST_ENGINE',str(old/'official-engine/chrome-headless-shell-linux64/chrome-headless-shell')),'--profile',profile,'--assets',str(w/'assets'),'--unsafe-no-sandbox'],cwd=out,env=env,stdout=result,stderr=result,check=True,timeout=110)
  prefs=(Path(profile)/'khromium.ini').read_text();assert 'user_agent=1' in prefs and 'search=2' in prefs
  assert 'khromium-input.html' in (Path(profile)/'favorites.ini').read_text()
 finally:server.terminate();server.wait(timeout=10)
values=[]
logtext=(out/'integration.log').read_text()
assert '"cookies":[]' in logtext, "Cookie deletion did not complete"
for line in (out/'integration.log').read_text().splitlines():
 if line.startswith('CDP JSON '):
  data=json.loads(line[9:]);remote=data.get('result',{}).get('result',{})
  if isinstance(remote.get('value'),str):
   try:
    v=json.loads(remote['value'])
    if isinstance(v,dict) and 'test' in v:values.append(v)
   except ValueError:pass
print(values)
assert len(values)==4,values
assert values[0]['title']=='Khromium',values
assert 'Android 11' in values[1]['ua'] and values[1]['mobile'],values
assert values[2]['canvas'] and 'error' not in values[2]['status'].lower(),values
assert values[3]['value']=='hI' and values[3]['enters']==1,values
print('PASS: home, direct addresses, keyboard toggle/Shift/Enter, user agent, favorites, settings, Dino, persistent preferences')
