const vm=require('vm'),fs=require('fs'),assert=require('assert');
const source=fs.readFileSync(require('path').resolve(__dirname,'..','src/background/AccountProtection.js'),'utf8')+'\n'+fs.readFileSync(require('path').resolve(__dirname,'..','background.js'),'utf8').replace(/^importScripts.*\n/,'');new vm.Script(source);
function setup(fetcher){
 const cache={accessToken:'mock-session',userSubscriptions:[{id:'old'}],folderOwner:{id:'UC_OWNER',title:'Owner'}};let tokenCalls=0,forgot=0;const listeners=[];
 const c={URL,URLSearchParams,Date,Map,Set,console,fetch:(url,options)=>new URL(url).pathname.endsWith('/channels')?Promise.resolve({ok:true,json:async()=>({items:[{id:'UC_OWNER',snippet:{title:'Owner'}}]})}):fetcher(url,options),chrome:{runtime:{onMessage:{addListener(){}},lastError:null},action:{openPopup:async()=>{}},identity:{getAuthToken(options,callback){tokenCalls++;assert.equal(options.interactive,false);callback(tokenCalls===1?'mock-oauth':{token:'mock-renewed'})},removeCachedAuthToken({token},callback){forgot++;callback()}},storage:{local:{get:async()=>({...cache}),set:async data=>{Object.assign(cache,data)}},onChanged:{addListener:f=>listeners.push(f)}},tabs:{onUpdated:{addListener(){}}}}};vm.createContext(c);vm.runInContext(source,c);return {c,cache,listeners,get tokens(){return tokenCalls},get forgot(){return forgot}};
}
const ok=page=>({ok:true,status:200,json:async()=>page});const fail=status=>({ok:false,status,json:async()=>({error:{errors:[{reason:status===403?'accessNotConfigured':'authError'}]}})});
(async()=>{
 let calls=[];const all=setup(async(url,options)=>{calls.push(new URL(url));assert.ok(options.headers.Authorization.startsWith('Bearer '));const i=calls.length-1;return ok({items:Array.from({length:50},(_,j)=>({id:'sub'+(i*50+j),snippet:{resourceId:{channelId:'UC'+(i*50+j)}}})),...(i<2?{nextPageToken:'p'+(i+2)}:{})})});
 const results=await Promise.all([all.c.refreshSubscriptions(),all.c.refreshSubscriptions()]);assert.equal(calls.length,3);assert.equal(all.cache.userSubscriptions.length,150);assert.equal(all.cache.subscriptionLoadStatus.count,150);assert.equal(calls[1].searchParams.get('pageToken'),'p2');assert.equal(calls[2].searchParams.get('maxResults'),'50');assert.equal(results[0].count,150);
 let count=0;const broken=setup(async()=>++count===1?ok({items:[{snippet:{resourceId:{channelId:'UC_one'}}}],nextPageToken:'p2'}):fail(403));const error=await broken.c.refreshSubscriptions();assert.equal(error.success,false);assert.equal(broken.cache.userSubscriptions[0].id,'old');assert.equal(broken.cache.subscriptionLoadStatus.state,'error');assert.ok(error.error.includes('403'));
 count=0;const renewed=setup(async()=>++count===1?fail(401):ok({items:[{id:'new',snippet:{resourceId:{channelId:'UC_one'}}}]}));await renewed.c.refreshSubscriptions();assert.equal(renewed.tokens,2);assert.equal(renewed.forgot,1);assert.equal(renewed.cache.userSubscriptions[0].id,'new');
 const repeated=setup(async()=>ok({items:[],nextPageToken:'same'}));await repeated.c.refreshSubscriptions();assert.equal(repeated.cache.subscriptionLoadStatus.state,'error');assert.equal(repeated.cache.userSubscriptions[0].id,'old');
 const empty=setup(async()=>ok({items:[]}));await empty.c.refreshSubscriptions();assert.equal(empty.cache.subscriptionLoadStatus.state,'ready');assert.equal(empty.cache.userSubscriptions.length,0);
 let release,started;const waiting=new Promise(r=>started=r);const logout=setup(async()=>{started();await new Promise(r=>release=r);return ok({items:[{id:'late',snippet:{resourceId:{channelId:'UC_late'}}}]})});const running=logout.c.refreshSubscriptions();await waiting;delete logout.cache.accessToken;logout.listeners[0]({accessToken:{newValue:undefined}},'local');release();await running;assert.equal(logout.cache.userSubscriptions.length,0);assert.equal(logout.cache.subscriptionLoadStatus.state,'signedOut');
 // Account ownership, explicit migration and rejected account changes.
 const account=setup(async()=>ok({items:[]}));
 account.cache.folderData={Keep:{color:'#123456',subfolders:{}}};
 const originalFolders=JSON.stringify(account.cache.folderData);
 delete account.cache.folderOwner;
 await account.c.refreshSubscriptions();
 assert.equal(account.cache.accountStatus.state,'needsLink');assert.equal(account.cache.userSubscriptions.length,0);
 assert.equal(JSON.stringify(account.cache.folderData),originalFolders);
 let linked=await account.c.linkFolderAccount({accountId:'WRONG'});assert.equal(linked.success,false);assert.equal(account.cache.folderOwner,undefined);
 linked=await account.c.linkFolderAccount({accountId:'UC_OWNER'});assert.equal(linked.success,true);assert.equal(account.cache.folderOwner.id,'UC_OWNER');
 assert.equal(account.cache.accountStatus.state,'ready');assert.equal(JSON.stringify(account.cache.folderData),originalFolders);
 delete account.cache.accessToken;account.listeners[0]({accessToken:{newValue:undefined}},'local');
 assert.equal(account.cache.folderOwner.id,'UC_OWNER');assert.equal(JSON.stringify(account.cache.folderData),originalFolders);
 account.cache.accessToken='same-account-new-session';await account.c.refreshSubscriptions();assert.equal(account.cache.accountStatus.state,'ready');
 account.c.identifyYouTubeAccount=async()=>({id:'UC_OTHER',title:'Other account'});
 await account.c.refreshSubscriptions();assert.equal(account.cache.accountStatus.state,'blocked');assert.equal(account.cache.userSubscriptions.length,0);
 assert.equal(JSON.stringify(account.cache.folderData),originalFolders);
 linked=await account.c.linkFolderAccount({accountId:'UC_OTHER'});assert.equal(linked.success,false);assert.equal(account.cache.folderOwner.id,'UC_OWNER');
 const unknown=setup(async()=>ok({items:[]}));unknown.c.identifyYouTubeAccount=async()=>{const error=Error('Cannot identify');error.accountVerification=true;throw error;};
 await unknown.c.refreshSubscriptions();assert.equal(unknown.cache.accountStatus.state,'error');assert.equal(unknown.cache.userSubscriptions.length,0);
 const late=setup(async()=>ok({items:[]}));let releaseIdentity,identityStarted;
 const identityWaiting=new Promise(r=>identityStarted=r);
 late.c.identifyYouTubeAccount=async()=>{identityStarted();await new Promise(r=>releaseIdentity=r);return {id:'UC_OWNER',title:'Owner'};};
 const lateRun=late.c.refreshSubscriptions();await identityWaiting;delete late.cache.accessToken;
 late.listeners[0]({accessToken:{newValue:undefined}},'local');releaseIdentity();await lateRun;
 assert.equal(late.cache.accountStatus.state,'signedOut');assert.equal(late.cache.userSubscriptions.length,0);
 await require('./popup-auth.cjs')();
 console.log('PASS: local sign-out without revocation/cache clearing, storage failure reporting, popup timers and preserved owner/folders;  explicit account linking, same-account return, mismatched-account blocking, verification failure and late identity cancellation; 150 subscriptions over 3 pages; concurrent refresh coalescing; partial-page failure preserves cache; visible API error; one 401 token renewal; repeated-token guard; empty account; logout rejects late results.');
})().catch(e=>{console.error(e);process.exit(1)});
