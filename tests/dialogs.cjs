const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname, '..')+'/';
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
for(const f of manifest.content_scripts[0].js)new vm.Script(fs.readFileSync(root+f,'utf8'),{filename:f});
function decode(s){return s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')}
function matches(e,s){if(s==='[data-dialog-close]')return e.hasAttribute('data-dialog-close');if(s==='[data-channel]')return e.hasAttribute('data-channel');if(s.startsWith('[data-action='))return e.dataset.action===s.match(/"([^"]*)"/)[1];if(s.startsWith('.'))return e.className.split(' ').includes(s.slice(1));if(s.startsWith('#'))return e.id===s.slice(1);return e.tag===s;}
function walk(e){return e.children.flatMap(c=>[c,...walk(c)])}
class E{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.style={setProperty(k,v){this[k]=v}};this.value='';this.hidden=false;this.text='';}
 get classList(){const e=this;return {contains:c=>e.className.split(' ').includes(c),add(c){e.attrs.class=(e.className+' '+c).trim()},remove(c){e.attrs.class=e.className.split(' ').filter(x=>x!==c).join(' ')},toggle(c,on){if(on)this.add(c);else this.remove(c)}}}
 get className(){return this.attrs.class||''}get id(){return this.attrs.id||''}set id(v){this.attrs.id=v}set className(v){this.attrs.class=v}get firstElementChild(){return this.children[0]}get tagName(){return this.tag.toUpperCase()}
 setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);if(k==='value')this.value=String(v);if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true}
 hasAttribute(k){return k in this.attrs}
 getBoundingClientRect(){return {top:200,bottom:230,right:700,left:420,width:280,height:300}}
 get clientWidth(){return this.testWidth??430}
 get isConnected(){return this===body||!!this.parent?.isConnected}
 append(e){if(e.parent)e.parent.children=e.parent.children.filter(c=>c!==e);this.children.push(e);e.parent=this}appendChild(e){this.append(e)}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null}
 set textContent(v){this.text=String(v);this.children=[]}get textContent(){return this.text+this.children.map(c=>c.textContent).join('')}
 set innerHTML(html){this.children=[];const stack=[this];for(const t of html.match(/<[^>]+>|[^<]+/g)||[]){if(t.startsWith('</')){stack.pop();continue}if(t.startsWith('<')){const tag=t.match(/^<(\w+)/)[1];const e=new E(tag);const attrs=t.slice(tag.length+1,-1);for(const m of attrs.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g))e.setAttribute(m[1],decode(m[2]??m[3]??''));stack.at(-1).append(e);if(!t.endsWith('/>')&&!['input','img','br','hr'].includes(tag))stack.push(e)}else stack.at(-1).text+=decode(t)}}
 querySelectorAll(sel){if(sel.includes(','))return [...new Set(sel.split(',').flatMap(s=>this.querySelectorAll(s.trim())))];const parts=sel.split(' ');return walk(this).filter(e=>matches(e,parts.at(-1))&& (parts.length===1||!!e.closest(parts.slice(0,-1).join(' '))))}
 querySelector(s){return this.querySelectorAll(s)[0]||null}closest(s){for(let e=this;e;e=e.parent)if(s.split(',').some(part=>matches(e,part.trim())))return e;return null}
 addEventListener(k,f){this.events[k]=f}focus(){document.activeElement=this}getClientRects(){return this.hidden?[]:[{}]}
}
const body=new E('body');const document={body,activeElement:body,createElement:t=>new E(t),events:{},addEventListener(k,f){(this.events[k]??=new Set()).add(f)},removeEventListener(k,f){this.events[k]?.delete(f)}};
let listeners=[],writes=0,moves=0,removes=0,adds=0;
const sub=(id,title)=>({snippet:{title,resourceId:{channelId:id}}});
const a=sub('UC_A','Zulu <safe>'),b=sub('UC_B','Alpha'),c=sub('UC_C','Beta');b.snippet.description='A <script> & description';b.snippet.thumbnails={default:{url:'https://yt3.ggpht.com/mock.jpg'}};
const context={console,document,URL,innerWidth:1200,innerHeight:900,ResizeObserver:class{constructor(callback){this.callback=callback;context.tabsObserver=this}observe(){}disconnect(){}},isLoggedIn:true,confirm:()=>true,sidebarFolderColour:colour=>colour||'#243f59',lightenColor:(colour,amount)=>{const rgb=[1,3,5].map(i=>Math.min(255,parseInt(colour.slice(i,i+2),16)+Math.round(amount*2.55)));return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('')},chrome:{storage:{onChanged:{addListener:f=>listeners.push(f),removeListener:f=>listeners=listeners.filter(x=>x!==f)}},runtime:{sendMessage(){return Promise.resolve({success:true})}}},showUnifiedFolderManager(name,mode,onCreated){adds++;context.pendingCreated=onCreated},showCreateSubfolderModal(){adds++},safeSaveFolderData(){writes++},refreshFolderDropdown(){},setTimeout:f=>f(),logStatus(){},showUserNotification(){},folderLimit:3,isPremium:false,folderDropdown:null};

context.window=context;
context.setTimeout=fn=>fn();
context.folderData={Sports:{color:'#44345d',subfolders:{Ball:{subscriptions:[a]}}}};
context.userSubscriptions=[a,b,c];
let failure=false,pendingSave=null,holdSave=false;
context.chrome.storage.local={set(data,callback){writes++;if(holdSave){pendingSave=callback;return}context.chrome.runtime.lastError=failure?{message:'test error'}:null;callback?.();context.chrome.runtime.lastError=null}};
vm.createContext(context);
for(const file of ['src/utils/FolderColours.js','src/services/FolderService.js','src/components/FolderDialogs/DialogLifecycle.js','src/components/FolderDialogs/DialogControls.js','src/components/FolderDialogs/ParentFolderDialog.js','src/components/FolderDialogs/SubfolderDialog.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),context,{filename:file});
function click(modal,button){button?.events.click?.({target:button});if(modal.isConnected)modal.events.click?.({target:button})}
function listenerCount(){return Object.values(document.events).reduce((n,set)=>n+set.size,0)}
let created=[];
context.showUnifiedFolderManager(null,'create',name=>created.push(name));let modal=body.children.at(-1);
assert.equal(listenerCount(),1);assert.equal(document.activeElement,modal.querySelector('#ytsm-folder-name'));
modal.querySelector('#ytsm-folder-name').value='New folder';click(modal,modal.querySelector('[data-action="save"]'));
assert.deepEqual(created,['New folder']);assert.equal(writes,1);assert.equal(listenerCount(),0);assert.equal(body.children.length,0);
for(let i=0;i<10;i++){context.showUnifiedFolderManager();modal=body.children.at(-1);click(modal,modal.querySelector('[data-dialog-close]'));assert.equal(listenerCount(),0)}
assert.equal(writes,1);
context.showUnifiedFolderManager();modal=body.children.at(-1);modal.querySelector('#ytsm-folder-name').value='Sports';click(modal,modal.querySelector('[data-action="save"]'));assert.ok(modal.isConnected);assert.equal(writes,1);click(modal,modal.querySelector('[data-dialog-close]'));
failure=true;context.showUnifiedFolderManager();modal=body.children.at(-1);modal.querySelector('#ytsm-folder-name').value='Failed save';click(modal,modal.querySelector('[data-action="save"]'));assert.ok(modal.isConnected);assert.equal(context.folderData['Failed save'],undefined);assert.equal(modal.querySelector('[data-action="save"]').disabled,false);click(modal,modal.querySelector('[data-dialog-close]'));failure=false;
context.showUnifiedFolderManager();modal=body.children.at(-1);modal.querySelector('#ytsm-folder-name').value='Only once';holdSave=true;const before=writes;click(modal,modal.querySelector('[data-action="save"]'));click(modal,modal.querySelector('[data-action="save"]'));assert.equal(writes,before+1);pendingSave();holdSave=false;assert.equal(listenerCount(),0);
// Quoted names remain text rather than becoming markup.
context.folderData['Name "<script>"']={color:'#44345d',subfolders:{}};context.showUnifiedFolderManager('Name "<script>"','edit');modal=body.children.at(-1);assert.equal(modal.querySelector('#ytsm-folder-name').value,'Name "<script>"');assert.equal(modal.querySelectorAll('script').length,0);click(modal,modal.querySelector('[data-dialog-close]'));
// Subfolder creation is unlimited during development and keeps channel records intact.
for(let i=0;i<5;i++){context.showCreateSubfolderModal('Sports');modal=body.children.at(-1);modal.querySelector('#ytsm-folder-name').value='Team '+i;click(modal,modal.querySelector('[data-action="save"]'));assert.equal(listenerCount(),0)}
assert.equal(Object.keys(context.folderData.Sports.subfolders).length,6);assert.deepEqual(context.folderData.Sports.subfolders.Ball.subscriptions[0],a);
const saved=JSON.stringify(context.folderData.Sports.subfolders.Ball);context.showCreateSubfolderModal('Sports');modal=body.children.at(-1);modal.querySelector('#ytsm-folder-name').value='Ball';click(modal,modal.querySelector('[data-action="save"]'));assert.ok(modal.isConnected);assert.equal(JSON.stringify(context.folderData.Sports.subfolders.Ball),saved);click(modal,modal.querySelector('[data-dialog-close]'));
context.showCreateSubfolderModal('Sports');modal=body.children.at(-1);modal.events.pointerdown({target:modal});assert.equal(listenerCount(),0);
context.showCreateSubfolderModal('Sports');modal=body.children.at(-1);for(const fn of [...document.events.keydown])fn({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert.equal(listenerCount(),0);assert.equal(body.children.length,0);
// Drag listeners are removed on close, including a close during a drag.
const anchor=new E('button');body.append(anchor);context.showUnifiedFolderManager('Sports','edit',null,anchor);modal=body.children.at(-1);assert.equal(modal.classList.contains('is-anchored'),true);assert.ok(modal.firstElementChild.style.left);click(modal,modal.querySelector('[data-dialog-close]'));anchor.remove();assert.equal(listenerCount(),0);
// Custom colours display exactly as saved; muted colours use white and custom colours auto-select readable text.
assert.equal(context.sidebarFolderColour('#12abef',0),'#12abef');assert.equal(context.folderTextColour('#44345d'),'#ffffff');assert.equal(context.folderTextColour('#f5f5f5'),'#111111');
// Both shared forms activate the picker and persist arbitrary bright colours unchanged.
for (const kind of ['parent', 'subfolder']) {
  if (kind === 'parent') context.showUnifiedFolderManager('Sports', 'edit');
  else context.showCreateSubfolderModal('Sports', 'Ball');
  modal=body.children.at(-1);
  const picker=modal.querySelector('.ytsm-colour-input');
  let opened=0; picker.showPicker=()=>opened++;
  click(modal,modal.querySelector('.ytsm-custom-colour'));
  assert.equal(opened,0); assert.equal(modal.querySelector('.ytsm-custom-panel').hidden,false);
  const hex=modal.querySelector('.ytsm-colour-hex'); hex.value='#00ff00'; hex.events.input(); assert.equal(picker.value,'#00ff00');
  hex.value='invalid'; hex.events.input(); assert.equal(picker.value,'#00ff00');
  click(modal,modal.querySelector('.ytsm-colour-done')); assert.equal(modal.querySelector('.ytsm-custom-panel').hidden,true);
  click(modal,modal.querySelector('.ytsm-custom-colour')); assert.equal(modal.querySelector('.ytsm-custom-panel').hidden,false);
  click(modal,modal.querySelector('.ytsm-custom-colour')); assert.equal(modal.querySelector('.ytsm-custom-panel').hidden,true);
  picker.value='#ffff00'; picker.events.input();
  click(modal,modal.querySelector('[data-action="save"]'));
  const record=kind==='parent'?context.folderData.Sports:context.folderData.Sports.subfolders.Ball;
  assert.equal(record.color,'#ffff00'); assert.equal(record.textColor,'#111111');
  assert.deepEqual(context.folderData.Sports.subfolders.Ball.subscriptions[0],a);
  assert.equal(listenerCount(),0);
}
assert.equal(context.folderTextColour('#12abef'),'#111111');
// Editing preserves assignments and subfolders while renaming.
const sportsChannels=JSON.stringify(context.folderData.Sports.subfolders.Ball.subscriptions);context.updateParentFolderRecord('Sports','Sport renamed','#12abef','#ffffff',ok=>assert.equal(ok,true));assert.equal(JSON.stringify(context.folderData['Sport renamed'].subfolders.Ball.subscriptions),sportsChannels);
// Same subfolder name is allowed under different parents, but duplicate within one parent is rejected.
context.createParentFolderRecord('Other','#44345d','#ffffff',()=>{});context.createSubfolderRecord('Other','Ball','#44345d','#ffffff',ok=>assert.equal(ok,true));const beforeDuplicate=writes;context.createSubfolderRecord('Other','Ball','#53303d','#ffffff',ok=>assert.equal(ok,false));assert.equal(writes,beforeDuplicate);
// Parent deletion removes its tree only; YouTube subscription cache is untouched.
const youtubeBefore=JSON.stringify(context.userSubscriptions);context.deleteParentFolderRecord('Other',ok=>assert.equal(ok,true));assert.equal(context.folderData.Other,undefined);assert.equal(JSON.stringify(context.userSubscriptions),youtubeBefore);
// No entitlement caps remain in the extracted folder service.
for(let i=0;i<8;i++)context.createParentFolderRecord('Extra '+i,'#44345d','#ffffff',()=>{});assert.ok(context.folderData['Extra 7']);
const checkedManifest=JSON.parse(fs.readFileSync(root+'manifest.json'));assert.ok(!checkedManifest.content_scripts[0].js.some(f=>/SubscriptionDisplay|FolderModals|ModalManager/.test(f)));
console.log('PASS: dialog save once, cancel, duplicate names, storage failure rollback, escaped names, unlimited parents and subfolders, preserved assignments, outside click, Escape and anchored-editor listener cleanup across repeated openings.');
