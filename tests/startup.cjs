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
 append(...elements){for(const e of elements){if(e.parent)e.parent.children=e.parent.children.filter(c=>c!==e);this.children.push(e);e.parent=this}}prepend(e){this.children.unshift(e);e.parent=this}replaceChildren(...elements){for(const c of this.children)c.parent=null;this.children=[];this.append(...elements)}contains(e){return e===this||walk(this).includes(e)}get parentElement(){return this.parent}appendChild(e){this.append(e)}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this);this.parent=null}
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
const context={console,document,URL,innerWidth:1200,innerHeight:900,ResizeObserver:class{constructor(callback){this.callback=callback;context.tabsObserver=this}observe(){}disconnect(){}},isLoggedIn:true,confirm:()=>true,sidebarFolderColour:colour=>colour||'#243f59',lightenColor:(colour,amount)=>{const rgb=[1,3,5].map(i=>Math.min(255,parseInt(colour.slice(i,i+2),16)+Math.round(amount*2.55)));return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('')},chrome:{storage:{onChanged:{addListener:f=>listeners.push(f),removeListener:f=>listeners=listeners.filter(x=>x!==f)}},runtime:{sendMessage(){return Promise.resolve({success:true})}}},showUnifiedFolderManager(name,mode,onCreated){adds++;context.pendingCreated=onCreated},showCreateSubfolderModal(){adds++},refreshFolderDropdown(){},setTimeout:f=>f(),logStatus(){},showUserNotification(){},folderLimit:3,isPremium:false,folderDropdown:null};


context.window=context;document.readyState='loading';
document.getElementById=id=>body.querySelector('#'+id);
document.querySelector=sel=>body.querySelector(sel);
context.MutationObserver=class{observe(){}disconnect(){}};
context.requestAnimationFrame=fn=>fn();
const section=new E('ytd-guide-section-renderer'),items=new E('div');items.id='items';section.append(items);body.append(section);
let store={folderData:{Sports:{color:'#44345d',subfolders:{Ball:{subscriptions:[a,b]}}}},userSubscriptions:[a,b,c],accessToken:'token',folderOwner:{id:'UC_OWNER',title:'Owner'},accountStatus:{state:'ready',session:'token',account:{id:'UC_OWNER',title:'Owner'}},subscriptionLoadStatus:{state:'ready'}};
context.chrome.storage.local={get(keys,callback){const result=structuredClone(store);if(callback)callback(result);else return Promise.resolve(result)},set(data,callback){for(const [key,value] of Object.entries(data))store[key]=structuredClone(value);callback?.()}};
context.chrome.runtime.onMessage={addListener(){}};
vm.createContext(context);
for(const file of manifest.content_scripts[0].js)vm.runInContext(fs.readFileSync(root+file,'utf8'),context,{filename:file});
(async()=>{
await context.initialize();assert.equal(store.accountSetupData.activeAccountId,'UC_OWNER');assert.equal(JSON.stringify(store.accountSetupData.setups.UC_OWNER.folderData),JSON.stringify(store.folderData));assert.equal(context.FolderPlan.state,'free');assert.equal(context.appInitialized,true);assert.equal(context.userSubscriptions.length,3);
let entry=document.getElementById('yt-manage-guide-entry');assert.equal(entry.dataset.state,'ready');entry.querySelector('button').events.click();
let sidebar=document.getElementById('yt-folder-dropdown');assert.equal(sidebar.hidden,false);assert.equal(sidebar.querySelector('.ytsm-count'),null);assert.ok(sidebar.querySelector('.ytsm-folder-more'));
sidebar.querySelector('.ytsm-folder').events.click();sidebar=document.getElementById('yt-folder-dropdown');assert.ok(sidebar.querySelector('.ytsm-subfolder'));sidebar.querySelector('.ytsm-subfolder').events.click();assert.equal(sidebar.querySelectorAll('.ytsm-channel').length,2);
const channels=sidebar.querySelector('.ytsm-channels');channels.scrollTop=45;context.refreshFolderDropdown();assert.equal(sidebar.querySelector('.ytsm-channels').scrollTop,45);
sidebar.querySelector('.ytsm-manage').events.click();let manage=document.getElementById('subfolder-view-modal');assert.ok(manage);assert.equal(manage.querySelector('.ysm-total').textContent,'3 subscriptions');
// Routine refresh keeps the same Manage mounted, blocks writes and updates Uncategorised.
const emitChanges=data=>{
  const changes={};for(const [key,value] of Object.entries(data)){changes[key]={newValue:value};store[key]=value;}
  for(const listener of [...listeners])listener(changes,'local');
};
let finishRefresh;
context.chrome.runtime.sendMessage=request=>{
  assert.equal(request.action,'refreshSubscriptions');
  emitChanges({accountStatus:{state:'verifying',session:'token'},subscriptionLoadStatus:{state:'loading'}});
  return new Promise(resolve=>finishRefresh=resolve);
};
context.showUserNotification=()=>{};
manage.events.click({target:manage.querySelector('[data-action="menu"]')});
manage.events.click({target:manage.querySelector('[data-action="refresh"]')});
assert.ok(manage.isConnected);assert.equal(document.getElementById('subfolder-view-modal'),manage);
assert.equal(manage.querySelector('.ysm-main-menu').hidden,true);
assert.ok(manage.querySelector('.ysm-total').textContent.includes('Updating...'));
assert.equal(manage.querySelector('[data-action="refresh"]').disabled,true);assert.equal(context.accountIsReady(),false);
let pendingSaved;const pendingFolders=JSON.stringify(context.folderData);
context.createParentFolderRecord('While verifying','#123456','#ffffff',ok=>pendingSaved=ok);
assert.equal(pendingSaved,false);assert.equal(JSON.stringify(context.folderData),pendingFolders);
emitChanges({accountStatus:{state:'ready',session:'token',account:store.folderOwner}});
const fresh=sub('UC_NEW','New arrival');
emitChanges({userSubscriptions:[a,b,c,fresh],subscriptionLoadStatus:{state:'ready'}});finishRefresh({success:true,count:4});
await new Promise(resolve=>setImmediate(resolve));
assert.ok(manage.isConnected);assert.equal(manage.querySelector('.ysm-total').textContent,'4 subscriptions');
assert.ok(manage.querySelector('.ysm-channel-list').textContent.includes('New arrival'));
assert.equal(manage.querySelector('[data-action="refresh"]').disabled,false);
manage.events.click({target:manage.querySelectorAll('button').find(e=>e.dataset.parent==='Sports')});
assert.equal(manage.querySelector('.ysm-selected').textContent,'Ball');
manage.events.click({target:manage.querySelector('[data-action="refresh"]')});assert.ok(manage.isConnected);
emitChanges({accountStatus:{state:'ready',session:'token',account:store.folderOwner},subscriptionLoadStatus:{state:'error',message:'YouTube unavailable'}});
finishRefresh({success:false,error:'YouTube unavailable'});await new Promise(resolve=>setImmediate(resolve));
assert.ok(manage.isConnected);assert.equal(manage.querySelector('.ysm-selected').textContent,'Ball');
assert.ok(manage.querySelector('.ysm-load-message').textContent.includes('YouTube unavailable'));assert.equal(context.userSubscriptions.length,4);
emitChanges({userSubscriptions:[a,b,c],subscriptionLoadStatus:{state:'ready'}});
manage.events.click({target:manage.querySelector('[data-action="uncategorised"]')});
// The separate development page writes only this key; open tabs apply it immediately.
emitChanges({developmentFolderPlan:'pro'});assert.equal(context.FolderPlan.state,'pro');
emitChanges({developmentFolderPlan:'expired'});assert.equal(context.FolderPlan.state,'expired');assert.ok(manage.isConnected);
emitChanges({developmentFolderPlan:'free'});assert.equal(context.FolderPlan.state,'free');assert.ok(manage.isConnected);
// Free/Expired discovery, shared dialog lifecycle and Pro direct selection.
const beforeProPrompt=JSON.stringify([store.folderData,store.accountSetupData]), promptWrites=writes;
for (const plan of ['free','expired']) {
  emitChanges({developmentFolderPlan:plan});
  const trigger=manage.querySelector('[data-action="start-selection"]');trigger.focus();
  assert.ok(trigger.textContent.includes('Pro'));
  manage.events.click({target:trigger});
  let prompt=body.children.at(-1);assert.ok(prompt.classList.contains('ytsm-multi-move-pro-dialog'));
  const cancel=prompt.querySelector('[data-dialog-close]');assert.equal(document.activeElement,cancel);
  const upgrade=prompt.querySelector('[data-action="multi-move-upgrade"]');
  assert.equal(upgrade.textContent,plan==='expired'?'Renew Pro':'Upgrade to Pro');
  let tabTrapped=false;prompt.events.keydown({key:'Tab',shiftKey:true,preventDefault(){tabTrapped=true}});assert.ok(tabTrapped);assert.equal(document.activeElement,upgrade);
  upgrade.events.click();assert.equal(prompt.querySelector('.ytsm-multi-move-pro-details').hidden,false);
  assert.ok(prompt.textContent.includes('not available yet'));assert.equal(document.activeElement,cancel);
  prompt.events.click({target:cancel});assert.ok(!prompt.isConnected);assert.equal(document.activeElement,trigger);
  manage.events.click({target:trigger});prompt=body.children.at(-1);
  prompt.events.pointerdown({target:prompt});assert.ok(!prompt.isConnected);
  manage.events.click({target:trigger});prompt=body.children.at(-1);
  context.showMultiMoveProDialog();assert.equal(body.children.filter(e=>e.classList.contains('ytsm-multi-move-pro-dialog')).length,1);
  const escapeHandler=[...document.events.keydown].at(-1);escapeHandler({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert.ok(!prompt.isConnected);
}
assert.equal(writes,promptWrites);assert.equal(JSON.stringify([store.folderData,store.accountSetupData]),beforeProPrompt);
emitChanges({developmentFolderPlan:'pro'});
assert.ok(!manage.querySelector('[data-action="start-selection"]').textContent.includes('Pro'));
manage.events.click({target:manage.querySelector('[data-action="start-selection"]')});assert.ok(manage.querySelector('[data-action="move-selected"]'));
assert.ok(!body.children.some(e=>e.classList.contains('ytsm-multi-move-pro-dialog')));
emitChanges({developmentFolderPlan:'free'});assert.ok(manage.querySelector('[data-action="start-selection"]').textContent.includes('Pro'));
// Backup menu routing and themed confirmation use real manifest-loaded modules.
context.TextEncoder=TextEncoder;context.clearTimeout=()=>{};
context.setTimeout=()=>1;
const notifications=[];context.showUserNotification=(message,type)=>notifications.push({message,type});
const backupText=JSON.stringify(context.BackupFormat.create(store.folderData,store.folderOwner));
let messages=[],releaseBackup;
context.chrome.runtime.sendMessage=request=>{messages.push(request);return new Promise(resolve=>releaseBackup=resolve)};
manage.events.click({target:manage.querySelector('[data-action="backup"]')});
assert.equal(messages[0].action,'exportFolderBackup');releaseBackup({success:true});await new Promise(resolve=>setImmediate(resolve));
assert.equal(manage.querySelector('.ysm-backup-notice-text').textContent,'Backup downloaded');
const restorePayload=context.BackupFormat.parse(backupText);
context.showFolderRestoreDialog(backupText,restorePayload);
let restoreDialog=body.children.at(-1);
assert.ok(restoreDialog.classList.contains('ytsm-restore-dialog'));
assert.ok(restoreDialog.textContent.includes('replace all current folders'));
restoreDialog.querySelector('[data-dialog-close]').events; // shared close is delegated
restoreDialog.events.click({target:restoreDialog.querySelector('[data-dialog-close]')});
assert.ok(!restoreDialog.isConnected);assert.equal(messages.length,1);
context.showFolderRestoreDialog(backupText,restorePayload);restoreDialog=body.children.at(-1);
const restoreButton=restoreDialog.querySelector('[data-action="restore-confirm"]');
const restoring=restoreButton.events.click();assert.equal(messages.at(-1).action,'restoreFolderBackup');assert.equal(restoreButton.disabled,true);
restoreDialog.events.click({target:restoreDialog.querySelector('[data-dialog-close]')});assert.ok(restoreDialog.isConnected);
releaseBackup({success:false,error:'Download cancelled'});await restoring;assert.ok(restoreDialog.isConnected);assert.equal(restoreButton.disabled,false);assert.equal(restoreDialog.querySelector('.ytsm-backup-status').textContent,'Download cancelled');
const retrying=restoreButton.events.click();releaseBackup({success:true});await retrying;assert.ok(!restoreDialog.isConnected);assert.equal(manage.querySelector('.ysm-backup-notice-text').textContent,'Folders restored. Safety copy downloaded.');
context.chrome.runtime.sendMessage=()=>Promise.resolve({success:true});
// Sidebar menus open shared dialogs directly and keep Manage current.
assert.equal(manage.querySelector('.ysm-folder-search-field').hidden,true);
assert.ok(manage.querySelector('.ysm-uncategorised-help'));
assert.equal(manage.querySelector('.ysm-parent-count'),null);assert.equal(manage.querySelector('.ysm-heading-count').hidden,true);
manage.events.click({target:manage.querySelectorAll('button').find(e=>e.dataset.parent==='Sports')});
assert.equal(manage.querySelector('.ysm-folder-search-field').hidden,true);manage.events.click({target:manage.querySelector('.ysm-subfolder-search-toggle')});assert.equal(manage.querySelector('.ysm-folder-search-field').hidden,false);assert.equal(document.activeElement,manage.querySelector('.ysm-folder-search'));
const menuListeners=Object.values(document.events).reduce((n,set)=>n+set.size,0);
function openParentMenu(){sidebar.querySelector('.ytsm-folder-more').events.click();return document.getElementById('ytsm-sidebar-folder-menu')}
let menu=openParentMenu();assert.equal(menu.parentElement,body);sidebar.querySelector('.ytsm-folder-more').events.click();assert.equal(document.getElementById('ytsm-sidebar-folder-menu'),null);menu=openParentMenu();assert.equal(menu.style.left,'702px');assert.equal(menu.style.top,'202px');assert.equal(menu.querySelectorAll('button').length,2);assert.equal(sidebar.querySelector('.ytsm-folder').attrs['aria-expanded'],'true');
const menuEscape={key:'Escape',preventDefault(){},stopImmediatePropagation(){this.stopped=true}};for(const fn of [...document.events.keydown].reverse()){fn(menuEscape);if(menuEscape.stopped)break;}
assert.equal(document.getElementById('ytsm-sidebar-folder-menu'),null);assert.ok(manage.isConnected);assert.equal(Object.values(document.events).reduce((n,set)=>n+set.size,0),menuListeners);
menu=openParentMenu();for(const fn of [...document.events.pointerdown])fn({target:manage.querySelector('.ysm-selected')});assert.equal(document.getElementById('ytsm-sidebar-folder-menu'),null);
menu=openParentMenu();menu.querySelectorAll('button')[1].events.click();let quickDialog=body.children.at(-1);assert.ok(quickDialog.classList.contains('ytsm-folder-dialog'));
quickDialog.querySelector('#ytsm-folder-name').value='Quick child';quickDialog.querySelector('[data-action="save"]').events.click();assert.ok(store.folderData.Sports.subfolders['Quick child']);assert.ok(manage.querySelectorAll('button').find(e=>e.dataset.child==='Quick child'));
let childOptions=sidebar.querySelector('.ytsm-subfolder-group .ytsm-folder-more');childOptions.events.click();menu=document.getElementById('ytsm-sidebar-folder-menu');assert.equal(menu.style.left,'702px');assert.equal(menu.style.top,'202px');assert.equal(menu.querySelectorAll('button').length,1);assert.equal(menu.querySelector('button').textContent,'Edit subfolder');menu.querySelector('button').events.click();quickDialog=body.children.at(-1);assert.equal(quickDialog.firstElementChild.style.left,'422px');assert.equal(quickDialog.firstElementChild.style.top,'202px');assert.equal(quickDialog.querySelector('#ytsm-folder-name').value,'Ball');quickDialog.querySelector('#ytsm-folder-name').value='Renamed ball';quickDialog.querySelector('[data-action="save"]').events.click();assert.ok(store.folderData.Sports.subfolders['Renamed ball']);assert.equal(manage.querySelector('.ysm-selected').textContent,'Renamed ball');assert.equal(store.folderData.Sports.subfolders['Renamed ball'].subscriptions.length,2);
menu=openParentMenu();menu.querySelector('button').events.click();quickDialog=body.children.at(-1);assert.equal(quickDialog.firstElementChild.style.left,'422px');assert.equal(quickDialog.firstElementChild.style.top,'202px');assert.equal(quickDialog.querySelector('#ytsm-folder-name').value,'Sports');quickDialog.querySelector('#ytsm-folder-name').value='Sports renamed';quickDialog.querySelector('[data-action="save"]').events.click();assert.ok(store.folderData['Sports renamed']);assert.equal(manage.querySelector('.ysm-nav-heading h3').textContent,'Sports renamed folders');assert.equal(manage.querySelector('.ysm-selected').textContent,'Renamed ball');
// The real themed Remove dialog cancels safely, retains failed saves and blocks duplicates.
const originalConfirm=context.confirm;context.confirm=()=>{throw Error('Native confirm must not be used')};
const removeTrigger=()=>manage.querySelector('[data-action="remove"]');
let removalView;
function openRemoval(){manage.events.click({target:removeTrigger()});removalView=body.children.at(-1);assert.ok(removalView.classList.contains('ytsm-remove-channel-dialog'));return removalView}
const beforeRemoval=JSON.stringify(store.folderData),subscriptionsBeforeRemoval=JSON.stringify(store.userSubscriptions);
const removalListeners=listeners.length;
openRemoval();assert.equal(document.activeElement,removalView.querySelector('[data-action="remove-cancel"]'));
assert.ok(removalView.textContent.includes('You will remain subscribed to this channel on YouTube.'));
assert.ok(removalView.textContent.includes('Sports renamed / Renamed ball'));
removalView.querySelector('[data-action="remove-cancel"]').events.click();assert.ok(!removalView.isConnected);assert.equal(JSON.stringify(store.folderData),beforeRemoval);assert.equal(listeners.length,removalListeners);
openRemoval();for(const fn of [...document.events.keydown])fn({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});
assert.ok(!removalView.isConnected);assert.ok(manage.isConnected);assert.equal(JSON.stringify(store.folderData),beforeRemoval);
openRemoval();const storageBeforeRemoval=context.chrome.storage.local.set;
context.chrome.storage.local.set=(patch,callback)=>{if(patch.folderData){context.chrome.runtime.lastError={message:'Storage full'};callback?.();delete context.chrome.runtime.lastError}else storageBeforeRemoval(patch,callback)};
removalView.querySelector('[data-action="remove-confirm"]').events.click();assert.ok(removalView.isConnected);assert.equal(removalView.querySelector('.ytsm-form-error').hidden,false);assert.equal(JSON.stringify(store.folderData),beforeRemoval);
context.chrome.storage.local.set=storageBeforeRemoval;
let finishRemoval,removalWrites=0;
context.chrome.storage.local.set=(patch,callback)=>{if(patch.folderData){removalWrites++;finishRemoval=()=>storageBeforeRemoval(patch,callback)}else storageBeforeRemoval(patch,callback)};
const confirmRemoval=removalView.querySelector('[data-action="remove-confirm"]');confirmRemoval.events.click();confirmRemoval.events.click();assert.equal(removalWrites,1);assert.equal(confirmRemoval.disabled,true);
removalView.querySelector('[data-action="remove-cancel"]').events.click();assert.ok(removalView.isConnected);
finishRemoval();context.chrome.storage.local.set=storageBeforeRemoval;
assert.ok(!removalView.isConnected);assert.equal(manage.querySelector('.ysm-selected').textContent,'Renamed ball');assert.equal(store.folderData['Sports renamed'].subfolders['Renamed ball'].subscriptions.length,1);
assert.equal(JSON.stringify(store.userSubscriptions),subscriptionsBeforeRemoval);assert.equal(listeners.length,removalListeners);
// A changed folder requires review instead of applying a stale confirmation.
openRemoval();context.folderData['Sports renamed'].subfolders['Renamed ball'].subscriptions.push(c);
removalView.querySelector('[data-action="remove-confirm"]').events.click();assert.ok(removalView.textContent.includes('This folder changed.'));
context.folderData['Sports renamed'].subfolders['Renamed ball'].subscriptions.pop();removalView.querySelector('[data-action="remove-cancel"]').events.click();
context.confirm=originalConfirm;
// Tools include the theme control alongside the existing entries; About uses the shared lifecycle and restores focus.
manage.events.click({target:manage.querySelector('[data-action="uncategorised"]')});
const moveExample=manage.querySelector('.ysm-move-example');assert.ok(moveExample);assert.equal(moveExample.tag,'span');assert.equal(moveExample.attrs.tabindex,undefined);assert.ok(moveExample.textContent.includes('Move'));
// Restore the current folder for the rest of the startup checks.
manage.events.click({target:manage.querySelectorAll('button').find(button=>button.dataset.parent==='Sports renamed')});
const tools=manage.querySelector('.ysm-main-menu');
assert.equal(tools.querySelectorAll('button').length,5);
assert.equal(tools.querySelectorAll('svg').length,5);
assert.ok(tools.textContent.includes('Download your folders'));
const toolsTrigger=manage.querySelector('[data-action="menu"]');toolsTrigger.focus();
// Theme selection is a working Tools action, independent of plan/owner data.
manage.events.click({target:tools.querySelector('[data-action="theme"]')});
let themeDialog=body.children.at(-1);assert.ok(themeDialog.classList.contains('ytsm-theme-dialog'));
const themeChoices=themeDialog.querySelectorAll('button').filter(button=>button.dataset.theme);
assert.equal(themeChoices.length,2);
await themeChoices.find(button=>button.dataset.theme==='light').events.click();
assert.equal(store.subscriptionTheme,'light');assert.equal(context.ThemeService.current,'light');
assert.equal(themeChoices.find(button=>button.dataset.theme==='light').attrs['aria-pressed'],'true');
const foldersBeforeTheme=JSON.stringify(store.folderData);
await themeChoices.find(button=>button.dataset.theme==='dark').events.click();
assert.equal(store.subscriptionTheme,'dark');assert.equal(JSON.stringify(store.folderData),foldersBeforeTheme);
themeDialog.querySelector('[data-action="theme-done"]').events.click();assert.ok(!themeDialog.isConnected);assert.ok(manage.isConnected);

manage.events.click({target:toolsTrigger});
manage.events.click({target:tools.querySelector('[data-action="about"]')});
let about=body.children.at(-1);assert.ok(about.classList.contains('ytsm-about-dialog'));
assert.equal(tools.hidden,true);assert.ok(about.textContent.includes('stored locally'));
const aboutClose=about.querySelector('[data-dialog-close]');assert.equal(document.activeElement,aboutClose);
let trapped=false;aboutClose.events.keydown({key:'Tab',preventDefault(){trapped=true}});assert.ok(trapped);
about.events.click({target:aboutClose});assert.ok(!about.isConnected);assert.equal(document.activeElement,toolsTrigger);
manage.events.click({target:tools.querySelector('[data-action="about"]')});about=body.children.at(-1);
for(const fn of [...document.events.keydown])fn({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});
assert.ok(!about.isConnected);assert.ok(manage.isConnected);
// Open the real shared parent dialog from Manage, save and select the new parent.
manage.events.click({target:manage.querySelector('[data-action="create-parent"]')});let dialog=body.children.at(-1);dialog.querySelector('#ytsm-folder-name').value='From Manage';dialog.querySelector('[data-action="save"]').events.click();assert.equal(store.folderData['From Manage'].color,'#393052');assert.equal(manage.querySelector('.ysm-selected').textContent,'From Manage');assert.equal(manage.querySelector('.ysm-add'),document.activeElement);
// Escape on a folder dialog must not close the Manage layer below it.
manage.events.click({target:manage.querySelector('[data-action="add"]')});dialog=body.children.at(-1);const event={key:'Escape',preventDefault(){},stopImmediatePropagation(){}};for(const fn of [...document.events.keydown])fn(event);assert.ok(manage.isConnected);assert.ok(!dialog.isConnected);
manage.events.click({target:manage.querySelector('[data-action="close"]')});assert.equal(Object.values(document.events).reduce((n,set)=>n+set.size,0),1); // DOMContentLoaded listener only
assert.equal(JSON.stringify(store.accountSetupData.setups.UC_OWNER.folderData),JSON.stringify(store.folderData));
// Account state still remounts the correct launcher and removes the previous dropdown.
for(const fn of [...listeners])fn({accessToken:{newValue:null}},'local');entry=document.getElementById('yt-manage-guide-entry');assert.equal(entry.dataset.state,'login');assert.equal(document.getElementById('yt-folder-dropdown'),null);
// Verification failure still closes an existing Manage instance.
emitChanges({accessToken:'token',accountStatus:{state:'ready',session:'token',account:store.folderOwner}});
context.showSubfolderView();let verificationView=document.getElementById('subfolder-view-modal');assert.ok(verificationView);
emitChanges({accountStatus:{state:'verifying',session:'token'}});assert.ok(verificationView.isConnected);
emitChanges({accountStatus:{state:'error',session:'token',message:'Cannot verify'}});assert.ok(!verificationView.isConnected);
emitChanges({accountStatus:{state:'ready',session:'token',account:store.folderOwner}});
context.showSubfolderView();verificationView=document.getElementById('subfolder-view-modal');assert.ok(verificationView);
// Saved browsing state restores through the real sidebar/Manage integration.
context.ViewPreferences.update({sidebarOpen:true,parents:['Sports renamed'],children:[JSON.stringify(['Sports renamed','Renamed ball'])],manageOpen:true,parent:'Sports renamed',child:'Renamed ball'});
await context.ViewPreferences.flush();
vm.runInContext('activeManageView.close(false); sidebarExpandedParents.clear(); sidebarExpandedSubfolders.clear();',context);
await context.ViewPreferences.initialize(store.folderOwner.id);
context.ViewPreferences.restoreSidebar();
assert.equal(document.getElementById('subfolder-view-modal'),null);
assert.equal(typeof context.ViewPreferences.restoreManage,'undefined');
context.showSubfolderView();
assert.equal(document.getElementById('yt-folder-dropdown').hidden,false);
assert.ok(document.querySelector('#yt-manage-guide-entry .ytsm-launcher-chevron'));
assert.equal(document.querySelector('#yt-manage-guide-entry .ytsm-launcher').attrs['aria-expanded'],'true');
context.toggleFolderDropdown();
assert.equal(document.querySelector('#yt-manage-guide-entry .ytsm-launcher').attrs['aria-expanded'],'false');
context.toggleFolderDropdown();
assert.ok(vm.runInContext("sidebarExpandedParents.has('Sports renamed')",context));
assert.ok(vm.runInContext("sidebarExpandedSubfolders.has(JSON.stringify(['Sports renamed','Renamed ball']))",context));
verificationView=document.getElementById('subfolder-view-modal');
assert.equal(verificationView.querySelector('.ysm-selected').textContent,'Renamed ball');
// Explicit close is retained; missing folder references fall back without changing folders.
verificationView.events.click({target:verificationView.querySelector('[data-action="close"]')});
assert.equal(document.getElementById('subfolder-view-modal'),null);
context.ViewPreferences.update({manageOpen:true,parent:'Deleted',child:'Missing'});
context.showSubfolderView();verificationView=document.getElementById('subfolder-view-modal');
assert.equal(context.ViewPreferences.read().parent,null);assert.equal(context.ViewPreferences.read().child,null);
// A mismatched authorised account closes Manage and prevents folder writes.
const beforeBlocked=JSON.stringify(context.folderData), writesBeforeBlocked=writes;
for(const listener of [...listeners])listener({accountStatus:{newValue:{state:'blocked',session:'token',account:{id:'UC_OTHER',title:'Other'},owner:store.folderOwner}}},'local');
assert.equal(context.isLoggedIn,false);assert.ok(!verificationView.isConnected);
context.createParentFolderRecord('Blocked create','#123456','#ffffff',ok=>assert.equal(ok,false));
assert.equal(JSON.stringify(context.folderData),beforeBlocked);assert.equal(writes,writesBeforeBlocked);
console.log('PASS: Refresh keeps Manage open during same-session verification, blocks pending saves, updates Uncategorised, preserves selection/cache on fetch error, and closes on verification error or mismatch; full manifest load and startup; login launcher, sidebar parent/subfolder expansion, direct edit/create menus, Escape and outside-click cleanup, open Manage rename refresh, no sidebar counts, independent channel scroll; Manage creation selects parent; nested-dialog Escape; logout remount.');
})().catch(error=>{console.error(error);process.exitCode=1});
