const fs=require('fs'),path=require('path');
const ts=require(process.env.TYPESCRIPT_PATH || 'typescript');
const dir=path.join(__dirname,'third_party/dino');
let output='/* Chromium Dino, BSD-3-Clause. See third_party/dino/LICENSE. */\n(function(){const modules={},cache={};\n';
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.ts'))){
 let source=fs.readFileSync(path.join(dir,file),'utf8').replaceAll("'chrome://resources/js/assert.js'","'./shims.js'").replaceAll("'chrome://resources/js/load_time_data.js'","'./shims.js'").replaceAll("'../constants.js'","'./parent_constants.js'");
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 output+=`modules[${JSON.stringify(file.replace(/\.ts$/,'.js'))}]=function(require,exports,module){\n${code}\n};\n`;
}
output+=`modules['shims.js']=function(require,exports){exports.assert=v=>{if(!v)throw new Error('Dino assertion failed')};const values={dinoGameA11yAriaLabel:'Dino',dinoGameA11yDescription:'Press Space or tap Jump to play.',dinoGameA11yGameOver:'Game over',dinoGameA11yHighScore:'High score',dinoGameA11yJump:'Jump',dinoGameA11yStartGame:'Game started',dinoGameA11ySpeedToggle:'Slow mode'};exports.loadTimeData={valueExists:k=>Object.hasOwn(values,k),getString:k=>values[k]||'',getValue:k=>values[k]};};
modules['parent_constants.js']=function(require,exports){exports.HIDDEN_CLASS='hidden'};
function require(name){name=name.replace(/^\\.\\//,'');if(cache[name])return cache[name].exports;let m={exports:{}};cache[name]=m;if(!modules[name])throw Error('Missing module '+name);modules[name](require,m.exports,m);return m.exports;}
const Runner=require('offline.js').Runner;Runner.prototype.loadSounds=function(){};window.KhromiumDino=Runner;
window.addEventListener('load',()=>{try{window.runner=Runner.initializeInstance('#main-frame-error');document.getElementById('status').textContent='Tap Jump or press Space. Display refresh is limited on e-ink.';}catch(e){document.getElementById('status').textContent='Dino could not start: '+e.message;console.error(e)}});
})();\n`;
fs.writeFileSync(path.join(__dirname,'assets/dino.js'),output);
