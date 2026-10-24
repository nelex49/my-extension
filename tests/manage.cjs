const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname, '..')+'/';
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));
for(const f of manifest.content_scripts[0].js)new vm.Script(fs.readFileSync(root+f,'utf8'),{filename:f});
function decode(s){return s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')}
function matches(e,s){if(s==='[data-channel]')return e.hasAttribute('data-channel');if(s.startsWith('[data-action='))return e.dataset.action===s.match(/"([^"]*)"/)[1];if(s.startsWith('.'))return e.className.split(' ').includes(s.slice(1));if(s.startsWith('#'))return e.id===s.slice(1);return e.tag===s;}
function walk(e){return e.children.flatMap(c=>[c,...walk(c)])}
class E{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.style={setProperty(k,v){this[k]=v}};this.value='';this.hidden=false;this.text='';}
 get classList(){const e=this;return {contains:c=>e.className.split(' ').includes(c),add(c){e.attrs.class=(e.className+' '+c).trim()},remove(c){e.attrs.class=e.className.split(' ').filter(x=>x!==c).join(' ')},toggle(c,on){if(on)this.add(c);else this.remove(c)}}}
 get className(){return this.attrs.class||''}get id(){return this.attrs.id||''}set id(v){this.attrs.id=v}
 setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true}
 hasAttribute(k){return k in this.attrs}
 getBoundingClientRect(){return this.testRect || {top:200,bottom:230,right:700,width:280,height:300}}
 get clientWidth(){return this.testWidth??430}
 get isConnected(){return this===body||!!this.parent?.isConnected}
 append(e){if(e.parent)e.parent.children=e.parent.children.filter(c=>c!==e);this.children.push(e);e.parent=this}remove(){if(this.parent)this.parent.children=this.parent.children.filter(e=>e!==this)}
 set textContent(v){this.text=String(v);this.children=[]}get textContent(){return this.text+this.children.map(c=>c.textContent).join('')}
 set innerHTML(html){this.children=[];const stack=[this];for(const t of html.match(/<[^>]+>|[^<]+/g)||[]){if(t.startsWith('</')){stack.pop();continue}if(t.startsWith('<')){const tag=t.match(/^<(\w+)/)[1];const e=new E(tag);const attrs=t.slice(tag.length+1,-1);for(const m of attrs.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g))e.setAttribute(m[1],decode(m[2]??m[3]??''));stack.at(-1).append(e);if(!t.endsWith('/>')&&!['input','img','br','hr'].includes(tag))stack.push(e)}else stack.at(-1).text+=decode(t)}}
 querySelectorAll(sel){if(sel.includes(','))return [...new Set(sel.split(',').flatMap(s=>this.querySelectorAll(s.trim())))];const parts=sel.split(' ');return walk(this).filter(e=>matches(e,parts.at(-1))&& (parts.length===1||!!e.closest(parts.slice(0,-1).join(' '))))}
 querySelector(s){return this.querySelectorAll(s)[0]||null}closest(s){for(let e=this;e;e=e.parent)if(matches(e,s))return e;return null}
 addEventListener(k,f){this.events[k]=f}focus(){document.activeElement=this}getClientRects(){return this.hidden?[]:[{}]}
}
const body=new E('body');const document={body,activeElement:body,createElement:t=>new E(t),events:{},addEventListener(k,f){this.events[k]=f},removeEventListener(k){delete this.events[k]}};
let listeners=[],writes=0,moves=0,removes=0,adds=0;
const sub=(id,title)=>({snippet:{title,resourceId:{channelId:id}}});
const a=sub('UC_A','Zulu <safe>'),b=sub('UC_B','Alpha'),c=sub('UC_C','Beta');b.snippet.description='A <script> & description';b.snippet.thumbnails={default:{url:'https://yt3.ggpht.com/mock.jpg'}};
const context={console,document,URL,innerWidth:1200,innerHeight:900,ResizeObserver:class{constructor(callback){this.callback=callback;context.tabsObserver=this}observe(){}disconnect(){}},isLoggedIn:true,confirm:()=>true,sidebarFolderColour:colour=>colour||'#243f59',folderTextColour:()=> '#ffffff',lightenColor:(colour,amount)=>{const rgb=[1,3,5].map(i=>Math.min(255,parseInt(colour.slice(i,i+2),16)+Math.round(amount*2.55)));return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('')},chrome:{storage:{onChanged:{addListener:f=>listeners.push(f),removeListener:f=>listeners=listeners.filter(x=>x!==f)}},runtime:{sendMessage(){return Promise.resolve({success:true})}}},showUnifiedFolderManager(name,mode,onCreated){adds++;context.pendingCreated=onCreated},showCreateSubfolderModal(){adds++},refreshFolderDropdown(){},setTimeout:f=>f(),clearTimeout(){},logStatus(){},showUserNotification(){},folderLimit:3,isPremium:false,folderDropdown:null};
context.window=context;context.userSubscriptions=[a,b,c];context.folderData={'Music "test"':{color:'#44345d',subfolders:{Blues:{subscriptions:[a,b]},Empty:{color:'#12ab34',subscriptions:[]}},subscriptions:[]},Sports:{subfolders:{Ball:{subscriptions:[]}}}};
vm.createContext(context);
context.chrome.storage.local={set(data,callback){writes++;callback?.();}};
for(const file of ['src/accounts/AccountSetupStore.js','src/accounts/AccountSetupMigration.js','src/plans/FolderPlan.js','src/plans/FolderCreationGate.js','src/services/FolderService.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),context);
vm.runInContext(fs.readFileSync(root+'src/components/SubscriptionManager.js','utf8'),context);
vm.runInContext(fs.readFileSync(root+'src/components/SubfolderView/ManageViewHelpers.js','utf8'),context);
for(const name of ['ManageState', 'ManageTools', 'ManageLayout', 'MovePicker', 'ChannelOptionsMenu', 'ParentFolderNavigation', 'SubfolderNavigation', 'ChannelList', 'ManageActions'])vm.runInContext(fs.readFileSync(root+'src/components/SubfolderView/'+name+'.js','utf8'),context);
vm.runInContext(fs.readFileSync(root+'src/components/SubfolderView/BackupNotice.js','utf8'),context);
vm.runInContext(fs.readFileSync(root+'src/components/SubfolderView/SubfolderViewPanel.js','utf8'),context);
context.manageEscape=vm.runInContext('manageEscape',context);
assert.equal(context.manageEscape('<"&'), '&lt;&quot;&amp;');assert.deepEqual(context.manageUncategorised().map(x=>x.snippet.title),['Beta']);
assert.deepEqual(context.manageFilteredSubscriptions('Music "test"','Blues','', 'az').map(x=>x.snippet.title),['Alpha','Zulu <safe>']);
assert.deepEqual(context.manageFilteredSubscriptions('Music "test"','Blues','ZULU','za').map(x=>x.snippet.title),['Zulu <safe>']);
assert.equal(context.manageParentCount({subscriptions:[a],subfolders:{One:{subscriptions:[a,b]},Two:{subscriptions:[b,c]}}}),3);assert.equal(context.manageParentCount({subscriptions:Array.from({length:1234},(_,i)=>sub('ID'+i,'Channel'))}),1234);assert.ok(!context.manageParentLabel('Large').includes('ysm-parent-count'));
// Component instances must not share mutable state or leave arrow timers running.
const stateOne=context.createManageState(),stateTwo=context.createManageState();
stateOne.descriptionChannels.add('UC_A');stateOne.arrowHold.suppressClick=true;
assert.equal(stateTwo.descriptionChannels.size,0);assert.equal(stateTwo.arrowHold.suppressClick,false);
const timerFunctions={setTimeout:context.setTimeout,setInterval:context.setInterval,clearTimeout:context.clearTimeout,clearInterval:context.clearInterval};
const pendingTimers=new Map();let nextTimer=0;
context.setTimeout=fn=>{pendingTimers.set(++nextTimer,fn);return nextTimer};
context.setInterval=fn=>{pendingTimers.set(++nextTimer,fn);return nextTimer};
context.clearTimeout=context.clearInterval=id=>pendingTimers.delete(id);
const componentModal=new E('div');componentModal.innerHTML=context.manageLayoutHTML();
const componentState=context.createManageState();
const navigation=context.createParentFolderNavigation({modal:componentModal,state:componentState});
navigation.render();const componentStrip=componentModal.querySelector('.ysm-visible-parents');componentStrip.scrollLeft=0;componentStrip.scrollWidth=1000;
const nextArrow=componentModal.querySelector('[data-action="parent-next"]');nextArrow.events.pointerdown({currentTarget:nextArrow});
assert.equal(pendingTimers.size,1);pendingTimers.get(componentState.arrowHold.timer)();assert.equal(pendingTimers.size,2);
pendingTimers.get(componentState.arrowHold.interval)();assert.ok(componentStrip.scrollLeft>0);
navigation.destroy();assert.equal(pendingTimers.size,0);assert.equal(componentState.arrowHold.timer,null);assert.equal(componentState.arrowHold.interval,null);
Object.assign(context,timerFunctions);
const original=JSON.stringify(context.folderData);context.showSubfolderView();let modal=body.children[0];assert.equal(body.children.length,1);context.showSubfolderView();assert.equal(body.children.length,1);assert.equal(listeners.length,1);assert.equal(modal.querySelector('.ysm-selected').textContent,'Uncategorised');assert.equal(JSON.stringify(context.folderData),original);assert.equal(writes,0);assert.equal(modal.querySelector('.ysm-add').hidden,true);assert.ok(modal.querySelector('.ysm-create-parent').textContent.includes('Add Folder'));
assert.equal(modal.querySelector('.ysm-folder-search-field').hidden,true);assert.ok(modal.querySelector('.ysm-uncategorised-help'));
function click(button){modal.events.click({target:button})}
const menuButton=modal.querySelectorAll('button').find(e=>e.dataset.action==='menu');click(menuButton);assert.equal(modal.querySelector('.ysm-main-menu').hidden,false);document.events.pointerdown({target:modal.querySelector('.ysm-selected')});assert.equal(modal.querySelector('.ysm-main-menu').hidden,true);
click(modal.querySelectorAll('button').find(e=>e.dataset.action==='create-parent'));assert.equal(adds,1);adds=0;

click(modal.querySelectorAll('[data-parent]')[0]||modal.querySelectorAll('button').find(e=>e.dataset.parent==='Music "test"'));
assert.equal(modal.querySelector('.ysm-selected').textContent,'Blues');const avatar=modal.querySelector('.ysm-avatar');assert.equal(avatar.querySelector('img').src,'https://yt3.ggpht.com/mock.jpg');avatar.querySelector('img').events.error();assert.equal(avatar.querySelector('img'),null);assert.equal(avatar.querySelector('span').textContent,'AL');assert.equal(modal.querySelector('.ysm-add').hidden,false);assert.equal(modal.querySelector('.ysm-add').textContent,' Add Subfolder+');assert.equal(modal.querySelector('.ysm-subfolders').style['--subfolder-fill'],context.lightenColor('#44345d',8));assert.equal(modal.querySelector('.ysm-selected-count').textContent,'2 subscriptions');
assert.equal(modal.querySelector('.ysm-folder-search-field').hidden,true);click(modal.querySelector('.ysm-subfolder-search-toggle'));assert.equal(modal.querySelector('.ysm-folder-search-field').hidden,false);const folderSearch=modal.querySelector('.ysm-folder-search');folderSearch.value='empty';folderSearch.events.input({target:folderSearch});assert.equal(modal.querySelectorAll('.ysm-subfolder-item').length,1);assert.equal(modal.querySelector('.ysm-folder-search-clear').hidden,false);click(modal.querySelector('.ysm-folder-search-clear'));assert.equal(folderSearch.value,'');assert.equal(modal.querySelectorAll('.ysm-subfolder-item').length,2);assert.equal(modal.querySelector('.ysm-folder-search-clear').hidden,true);assert.equal(document.activeElement,folderSearch);folderSearch.value='empty';folderSearch.events.input({target:folderSearch});click(modal.querySelector('.ysm-subfolder-search-toggle'));assert.equal(modal.querySelector('.ysm-folder-search-field').hidden,true);assert.equal(folderSearch.value,'');assert.equal(modal.querySelectorAll('.ysm-subfolder-item').length,2);assert.equal(document.activeElement,modal.querySelector('.ysm-subfolder-search-toggle'));click(modal.querySelector('.ysm-subfolder-search-toggle'));folderSearch.events.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert.equal(modal.querySelector('.ysm-folder-search-field').hidden,true);assert.ok(body.children.includes(modal));
assert.equal(modal.querySelector('.ysm-heading-count').textContent,'2 Subs');assert.equal(modal.querySelector('.ysm-parent-count'),null);
const infoButton=modal.querySelectorAll('button').find(e=>e.dataset.action==='description');click(infoButton);assert.equal(modal.querySelector('.ysm-description').textContent,'A <script> & description');assert.equal(modal.querySelectorAll('script').length,0);click(modal.querySelectorAll('button').find(e=>e.dataset.action==='description'));assert.equal(modal.querySelector('.ysm-description'),null);
const search=modal.querySelector('.ysm-channel-search');search.events.input({target:{value:'alpha'}});assert.equal(modal.querySelector('.ysm-selected-count').textContent,'1 of 2 subscriptions');search.events.input({target:{value:''}});
click(modal.querySelectorAll('button').find(e=>e.dataset.action==='move'));assert.equal(modal.querySelectorAll('[data-action="move-parent"]').length,2);assert.equal(modal.querySelector('.ysm-move-picker strong').textContent,'Choose parent folder');
const musicRow=modal.querySelectorAll('[data-action="move-parent"]').find(e=>e.dataset.moveParent==='Music "test"');assert.equal(musicRow.attrs.style,'--destination-colour: #9764e6');assert.equal(musicRow.querySelector('svg').attrs.fill,'none');assert.equal(musicRow.querySelector('svg').attrs.stroke,'currentColor');
let moveSearch=modal.querySelector('.ysm-move-search');assert.ok(moveSearch);assert.equal(moveSearch.attrs['aria-label'],'Search parent folders');assert.equal(modal.querySelector('[data-action="move-search"]'),null);assert.ok(modal.querySelector('.ysm-move-search-field svg'));assert.equal(moveSearch.attrs.placeholder,'Search folders...');assert.equal(modal.querySelector('.ysm-move-divider'),null);assert.equal(modal.querySelector('.ysm-move-clear').hidden,true);moveSearch.focus();
moveSearch.events.input({target:{value:'  SPORT  '}});assert.equal(modal.querySelectorAll('[data-action="move-parent"]').length,1);
assert.equal(document.activeElement,modal.querySelector('.ysm-move-search'));assert.equal(modal.querySelector('.ysm-move-clear').hidden,false);click(modal.querySelector('.ysm-move-clear'));assert.equal(modal.querySelector('.ysm-move-search').attrs.value,'');assert.equal(modal.querySelectorAll('[data-action="move-parent"]').length,2);assert.equal(modal.querySelector('.ysm-move-clear').hidden,true);assert.equal(document.activeElement,modal.querySelector('.ysm-move-search'));
modal.querySelector('.ysm-move-search').events.input({target:{value:'absent'}});assert.equal(modal.querySelector('.ysm-move-list .ysm-empty').textContent,'No matching folders.');
modal.querySelector('.ysm-move-search').events.input({target:{value:''}});assert.equal(modal.querySelectorAll('[data-action="move-parent"]').length,2);
const pickerPosition={...modal.querySelector('.ysm-move-picker').style};modal.querySelector('.ysm-move-picker').testRect={top:200,bottom:700,right:700,width:280,height:800};
click(modal.querySelectorAll('button').find(e=>e.dataset.moveParent==='Music "test"'));assert.ok(modal.querySelectorAll('button').find(e=>e.dataset.destinationChild==='Blues').disabled);assert.equal(modal.querySelector('.ysm-move-picker strong').textContent,'Choose subfolder');
assert.ok(modal.querySelector('.ysm-move-search'));assert.equal(modal.querySelector('.ysm-move-picker').style.top,pickerPosition.top);assert.equal(modal.querySelector('.ysm-move-picker').style.left,pickerPosition.left);assert.equal(modal.querySelector('.ysm-move-search').attrs.value,'');assert.equal(modal.querySelector('.ysm-move-search').attrs['aria-label'],'Search subfolders');assert.equal(modal.querySelector('.ysm-move-search').attrs.placeholder,'Search subfolders...');assert.ok(modal.querySelector('.ysm-move-divider'));assert.equal(modal.querySelector('.ysm-move-picker').style['--move-gutter'],'0px');assert.equal(modal.querySelector('[data-action="move-back"]').textContent,'Back to parent folders');assert.equal(modal.querySelector('.ysm-move-back svg').attrs['stroke-width'],'2.5');
modal.querySelector('.ysm-move-search').events.input({target:{value:'empty'}});
assert.equal(modal.querySelectorAll('[data-action="destination"]').length,1);assert.equal(modal.querySelector('[data-action="destination"]').attrs.style,'--destination-colour: #64e681');
click(modal.querySelector('.ysm-move-clear'));assert.equal(modal.querySelectorAll('[data-action="destination"]').length,2);assert.equal(modal.querySelector('.ysm-move-clear').hidden,true);assert.equal(document.activeElement,modal.querySelector('.ysm-move-search'));
modal.querySelector('.ysm-move-search').events.input({target:{value:'missing'}});assert.equal(modal.querySelector('.ysm-move-list .ysm-empty').textContent,'No matching folders.');
modal.querySelector('.ysm-move-search').events.input({target:{value:''}});assert.equal(modal.querySelectorAll('[data-action="destination"]').length,2);assert.equal(modal.querySelectorAll('[data-action="destination"]').find(e=>e.dataset.destinationChild==='Blues').attrs.style,'--destination-colour: #9764e6');
modal.querySelector('.ysm-move-search').events.input({target:{value:'empty'}});
click(modal.querySelector('[data-action="move-back"]'));assert.equal(modal.querySelector('.ysm-move-divider'),null);assert.ok(modal.querySelector('.ysm-move-search'));assert.equal(modal.querySelector('.ysm-move-search').attrs.value,'');assert.equal(modal.querySelectorAll('[data-action="move-parent"]').length,2);click(modal.querySelectorAll('button').find(e=>e.dataset.moveParent==='Sports'));let dest=modal.querySelectorAll('button').find(e=>e.dataset.destinationParent==='Sports');assert.ok(dest.querySelector('.ysm-destination-icon'));assert.equal(dest.attrs.style,'--destination-colour: #aebbc8');
// Exercise actual persistence: no success while pending or after failure, then retry.
const liveTimers={setTimeout:context.setTimeout,clearTimeout:context.clearTimeout};
Object.assign(context,{setTimeout:(fn,ms)=>{pendingTimers.set(++nextTimer,{fn,ms});return nextTimer},clearTimeout:id=>pendingTimers.delete(id)});
const savedSet=context.chrome.storage.local.set;let finishMove;
context.chrome.storage.local.set=(data,callback)=>{writes++;finishMove=callback};
const beforeMove=JSON.stringify(context.folderData);
click(dest);assert.equal(modal.querySelector('.ysm-backup-notice').hidden,true);
assert.equal(JSON.stringify(context.folderData),beforeMove);
context.chrome.runtime.lastError={message:'Save failed'};finishMove();delete context.chrome.runtime.lastError;
assert.equal(modal.querySelector('.ysm-backup-notice').hidden,true);assert.equal(JSON.stringify(context.folderData),beforeMove);
assert.equal(modal.querySelector('.ysm-selected').textContent,'Blues');
click(modal.querySelectorAll('[data-action="destination"]').find(e=>e.dataset.destinationParent==='Sports'));
assert.equal(modal.querySelector('.ysm-backup-notice').hidden,true);finishMove();
assert.equal(modal.querySelector('.ysm-backup-notice').hidden,false);
assert.equal(modal.querySelector('.ysm-backup-notice-text').textContent,'Moved to Sports / Ball');
assert.equal(modal.querySelector('.ysm-selected').textContent,'Blues');
assert.equal([...pendingTimers.values()][0].ms,2000);
const moveDisplay=[...pendingTimers.values()][0];pendingTimers.clear();moveDisplay.fn();
assert.ok(modal.querySelector('.ysm-backup-notice').classList.contains('is-fading'));
assert.equal([...pendingTimers.values()][0].ms,300);
const moveFade=[...pendingTimers.values()][0];pendingTimers.clear();moveFade.fn();
assert.equal(modal.querySelector('.ysm-backup-notice').hidden,true);
context.chrome.storage.local.set=savedSet;Object.assign(context,liveTimers);
assert.equal(modal.querySelector('.ysm-move-picker').hidden,true);click(modal.querySelector('[data-action="move"]'));assert.equal(modal.querySelector('.ysm-move-search').attrs.value,'');assert.equal(modal.querySelector('.ysm-move-search').attrs['aria-label'],'Search parent folders');document.events.keydown({key:'Escape'});assert.equal(modal.querySelector('.ysm-move-picker').hidden,true);click(modal.querySelector('[data-action="move"]'));document.events.pointerdown({target:modal.querySelector('.ysm-selected')});assert.equal(modal.querySelector('.ysm-move-picker').hidden,true);assert.equal(context.folderData.Sports.subfolders.Ball.subscriptions.length,1);assert.equal(context.folderData['Music "test"'].subfolders.Blues.subscriptions.length,1);
let pendingRemoval;context.showRemoveChannelDialog=options=>{pendingRemoval=options};
click(modal.querySelectorAll('button').find(e=>e.dataset.action==='remove'));assert.ok(pendingRemoval);context.removeFromSubfolder(pendingRemoval.channelId,pendingRemoval.parent,pendingRemoval.child,pendingRemoval.onRemoved);assert.equal(context.folderData['Music "test"'].subfolders.Blues.subscriptions.length,0);assert.equal(context.userSubscriptions.length,3);
click(modal.querySelectorAll('button').find(e=>e.dataset.action==='add'));assert.equal(adds,1);
click(modal.querySelectorAll('button').find(e=>e.dataset.action==='close'));assert.equal(listeners.length,0);assert.equal(body.children.length,0);context.userSubscriptions=[];context.showSubfolderView();modal=body.children[0];assert.equal(modal.querySelector('.ysm-total').textContent,'Subscription total unavailable');listeners[0]({accessToken:{newValue:null}},'local');assert.equal(body.children.length,0);assert.equal(listeners.length,0);
context.folderData=Object.fromEntries(Array.from({length:100},(_,i)=>['Folder '+i,{subfolders:{},color:'#243f59'}]));context.showSubfolderView();modal=body.children[0];let overflow=modal.querySelector('.ysm-parent-results');assert.equal(overflow.querySelectorAll('button').filter(e=>e.dataset.parent!==undefined).length,100);assert.equal(modal.querySelector('summary').textContent,'All Folders (100) ▾');const folderOrder=overflow.querySelectorAll('button').filter(e=>e.dataset.parent!==undefined).map(e=>e.dataset.parent);
overflow.scrollTop=270;overflow.events.scroll();
click(overflow.querySelectorAll('button').find(e=>e.dataset.parent==='Folder 90'));
overflow=modal.querySelector('.ysm-parent-results');let reopened=modal.querySelector('.ysm-more-parents');reopened.open=true;reopened.events.toggle();
assert.equal(modal.querySelector('.ysm-parent-results').scrollTop,270);
assert.deepEqual(modal.querySelector('.ysm-parent-results').querySelectorAll('button').filter(e=>e.dataset.parent!==undefined).map(e=>e.dataset.parent),folderOrder);
const parentSearch=modal.querySelector('.ysm-parent-search');parentSearch.value='Folder 99';parentSearch.events.input();assert.equal(overflow.querySelectorAll('button').filter(e=>e.dataset.parent!==undefined).length,1);click(overflow.querySelectorAll('button').find(e=>e.dataset.parent!==undefined));assert.equal(modal.querySelector('.ysm-selected').textContent,'Folder 99');assert.ok(modal.querySelector('.ysm-visible-parents').querySelectorAll('button').some(e=>e.dataset.parent==='Folder 99'));const retained=modal.querySelector('.ysm-visible-parents').querySelectorAll('button').filter(e=>e.dataset.parent!==undefined&&!e.parent.hidden).map(e=>e.dataset.parent);const other=modal.querySelector('.ysm-visible-parents').querySelectorAll('button').find(e=>e.dataset.parent!==undefined&&!e.parent.hidden&&e.dataset.parent!=='Folder 99');click(other);assert.deepEqual(modal.querySelector('.ysm-visible-parents').querySelectorAll('button').filter(e=>e.dataset.parent!==undefined&&!e.parent.hidden).map(e=>e.dataset.parent),retained);const more=modal.querySelector('.ysm-more-parents');more.open=true;document.events.pointerdown({target:modal.querySelector('.ysm-selected')});assert.equal(more.open,false);click(modal.querySelectorAll('button').find(e=>e.dataset.action==='create-parent'));assert.equal(typeof context.pendingCreated,'function');context.folderData['New parent']={color:'#44345d',subfolders:{}};context.pendingCreated('New parent');assert.equal(modal.querySelector('.ysm-selected').textContent,'New parent');assert.equal(modal.querySelector('.ysm-nav-heading h3').textContent,'New parent folders');assert.ok(modal.querySelector('.ysm-visible-parents').querySelectorAll('button').some(e=>e.dataset.parent==='New parent'&&e.attrs['aria-pressed']==='true'));assert.equal(document.activeElement,modal.querySelector('.ysm-add'));assert.equal(modal.querySelector('.ysm-add').style['--add-fill'],'#44345d');click(modal.querySelectorAll('button').find(e=>e.dataset.action==='close'));assert.equal(document.events.pointerdown,undefined);
assert.deepEqual(context.manageVisibleParents(['One','Two','Long parent name'],'Long parent name',2),['Long parent name','Two']);assert.deepEqual(context.manageVisibleParents(['One','Two'],null,1),['One']);
assert.equal(modal.querySelector('.ysm-nav-heading h3').title,modal.querySelector('.ysm-nav-heading h3').textContent);assert.equal(modal.querySelector('.ysm-youtube'),null);
context.chrome.runtime.onMessage={addListener(){}};
context.chrome.storage.local={get(keys,callback){callback({userSubscriptions:[a,b]})}};
vm.runInContext(fs.readFileSync(root+'src/core/App.js','utf8'),context);
vm.runInContext(fs.readFileSync(root+'src/services/YouTubeAPI.js','utf8'),context);
context.syncSubscriptions([a]);context.loadUserData('mock');assert.equal(context.userSubscriptions.length,2);assert.equal(vm.runInContext('userSubscriptions.length',context),2);
vm.runInContext('isLoggedIn=true',context);context.showSubfolderView();modal=body.children.at(-1);assert.equal(modal.querySelector('.ysm-total').textContent,'2 saved subscriptions');const strip=modal.querySelector('.ysm-visible-parents');strip.testWidth=140;context.tabsObserver.callback();assert.ok(strip.querySelectorAll('.ysm-parent-item').filter(e=>!e.hidden).length<=1);strip.testWidth=430;context.tabsObserver.callback();assert.ok(strip.querySelectorAll('.ysm-parent-item').filter(e=>!e.hidden).length<=3);
context.syncSubscriptions([a,b,c]);assert.equal(modal.querySelector('.ysm-total').textContent,'3 saved subscriptions');click(modal.querySelectorAll('button').find(e=>e.dataset.action==='close'));
console.log('PASS: component state isolation and timer cleanup; Uncategorised explanation and hidden folder search; subfolder clear control; unique parent totals and four-digit count labels; always-visible search filtering in both steps, search focus and reset, clearer headings;  folder SVG icons and heading tooltip; unavailable total instead of false zero; cached subscription load uses shared state and updates open Manage; menu outside-click dismissal; permanent Create Folder; escaped description toggles; searchable 100-folder overflow and selected tab promotion; document listener cleanup; manifest JS parsing; escaping; uncategorised data; search/sort; singleton modal; read-only rendering; parent navigation; move/remove retain YouTube subscriptions; Add shared dialog; empty account; logout and listener cleanup.');
