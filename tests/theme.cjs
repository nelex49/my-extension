const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/services/ThemeService.js'),'utf8');
function setup(initial, options={}) {
 const attrs={},store={folderData:{Art:{subfolders:{}}},developmentFolderPlan:'free',subscriptionTheme:initial},listeners=[];
 let fail=false,release=null;
 const c={document:{documentElement:{setAttribute:(key,value)=>attrs[key]=value}},chrome:{storage:{local:{
  get:async()=>options.delayed?await new Promise(resolve=>{release=()=>resolve({subscriptionTheme:initial})}):structuredClone(store),
  set:async patch=>{if(fail)throw Error('storage full');Object.assign(store,patch)}
 },onChanged:{addListener:fn=>listeners.push(fn)}}}};
 c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);
 return {service:c.ThemeService,attrs,store,listeners,setFail:value=>fail=value,release:()=>release()};
}
(async()=>{
 for(const value of [undefined,'invalid','dark']){const t=setup(value);await t.service.ready;assert.equal(t.service.current,'dark');assert.equal(t.attrs['data-ytsm-theme'],'dark')}
 const t=setup('light');await t.service.ready;assert.equal(t.service.current,'light');
 const before=JSON.stringify(t.store.folderData);t.setFail(true);assert.equal(await t.service.select('dark'),false);assert.equal(t.service.current,'light');
 t.setFail(false);assert.equal(await t.service.select('dark'),true);assert.equal(t.store.subscriptionTheme,'dark');assert.equal(JSON.stringify(t.store.folderData),before);assert.equal(t.store.developmentFolderPlan,'free');
 t.listeners[0]({subscriptionTheme:{newValue:'light'}},'local');assert.equal(t.service.current,'light');
 t.listeners[0]({subscriptionTheme:{newValue:'dark'}},'sync');assert.equal(t.service.current,'light');
 t.listeners[0]({subscriptionTheme:{newValue:undefined}},'local');assert.equal(t.service.current,'dark');
 const race=setup('light',{delayed:true});await race.service.select('dark');race.release();await race.service.ready;assert.equal(race.service.current,'dark');
 // Color token substitution must preserve every existing dark declaration exactly.
 for(const name of ['sidebar','subfolder-view','folder-dialogs']){
  const css=fs.readFileSync(path.join(root,'src/styles',name+'.css'),'utf8');
  const expected={'sidebar': '76f19718438af5a33e25b613161c482b23b22c6ce623b721d1636716bb954246', 'subfolder-view': 'f9c6394ecaf41be87be5698554377d9f7a327a8f641dd272240bd276e65d2c06', 'folder-dialogs': '7895222de45b4377035b5e04c382a5cb47f8d715157547ca69ceee5e6a25a3cf'};
  assert.equal(require('crypto').createHash('sha256').update((css.includes('/* Pro selection controls') ? css.split('/* Pro selection controls')[0].slice(0,-1) : css).replace(/var\(--ytsm-theme-[a-z-]+, (#[a-fA-F0-9]+)\)/g,'$1')).digest('hex'),expected[name]);
 }
 const theme=fs.readFileSync(path.join(root,'src/styles/theme.css'),'utf8');
 assert.ok(theme.includes(':root[data-ytsm-theme="light"]'));assert.ok(!theme.includes('filter: invert'));
 // Check readable text on both light navigation surfaces, including selected state.
 function luminance(hex) { const rgb=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; }
 const lightText=theme.match(/--ytsm-theme-text:\s*(#[a-f0-9]{6})/)[1];
 for(const color of ['#edf1f6','#c6daef','#bfd4ea']) { const contrast=(luminance(color)+.05)/(luminance(lightText)+.05);assert.ok(contrast>=4.5,`Navigation contrast: ${contrast}`); }
 assert.ok(theme.includes('.ysm-parent-heading .ysm-uncategorised span,'));
 assert.ok(theme.includes('.ysm-all-folders-slot .ysm-more-parents summary {\n  color: var(--ytsm-theme-text);'));
 console.log('PASS: dark default, stored choice, cross-tab updates, failed-save retention, plan/folder isolation, initialization race and exact dark CSS preservation.');
})().catch(error=>{console.error(error);process.exitCode=1});
