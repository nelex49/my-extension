const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const cache={accessToken:'session',folderOwner:{id:'UC_OWNER',title:'Owner'},accountStatus:{state:'ready',session:'session',account:{id:'UC_OWNER'}},folderData:{}};
let writes=0,denials=[];const downloads=[];
const c={console,TextEncoder,Date,setTimeout,CONFIG:{DEVELOPMENT_PLAN_TESTING:true},folderData:{},
 showUserNotification(){},showFolderLimitDialog:decision=>denials.push(decision),accountIsReady:()=>true,
 chrome:{runtime:{lastError:null},storage:{local:{get:async()=>structuredClone(cache),set(data,callback){writes++;Object.assign(cache,structuredClone(data));callback?.();return Promise.resolve()}}},downloads:{async download(options){downloads.push(JSON.parse(decodeURIComponent(options.url.split(',').slice(1).join(','))));return 1},async search(){return [{state:'complete'}]}}}};
c.window=c;vm.createContext(c);
for(const p of ['src/accounts/AccountSetupStore.js','src/plans/FolderPlan.js','src/plans/FolderCreationGate.js','src/services/FolderService.js','src/components/SubscriptionManager.js','src/shared/BackupFormat.js','src/background/BackupService.js'])vm.runInContext(read(p),c,{filename:p});
function plan(state){c.FolderPlan.applyStorage({developmentFolderPlan:state})}
function parent(name,expected=true){let result;c.createParentFolderRecord(name,'#123456','#ffffff',ok=>result=ok);assert.equal(result,expected)}
function child(p,name,expected=true){let result;c.createSubfolderRecord(p,name,'#123456','#ffffff',ok=>result=ok);assert.equal(result,expected)}
function load(data){c.folderData=structuredClone(data);cache.folderData=structuredClone(data)}
(async()=>{
 assert.equal(c.FolderPlan.state,'free');assert.equal(c.FolderPlan.limits.parents,4);assert.equal(c.FolderPlan.limits.subfolders,3);
 for(let i=1;i<=4;i++)parent('P'+i);
 const atLimit=JSON.stringify(c.folderData),beforeLimit=writes;parent('Fifth',false);assert.equal(writes,beforeLimit);assert.equal(JSON.stringify(c.folderData),atLimit);
 for(const p of Object.keys(c.folderData))for(let i=1;i<=3;i++)child(p,'S'+i);
 child('P1','Fourth',false);assert.equal(denials.at(-1).kind,'subfolder');
 // Unlimited subscriptions and moves between existing folders stay available on Free.
 const subscriptions=Array.from({length:500},(_,i)=>({snippet:{title:'Channel '+i,resourceId:{channelId:'UC_'+i}}}));
 c.userSubscriptions=subscriptions;c.folderData.P1.subfolders.S1.subscriptions=structuredClone(subscriptions);
 let outcome;c.addToSubfolder('UC_0','P2','S1',ok=>outcome=ok);assert.equal(outcome,true);assert.equal(c.folderData.P1.subfolders.S1.subscriptions.length,499);
 assert.equal(c.userSubscriptions.length,500);
 // Pro ignores both count limits; expiry preserves the complete setup.
 plan('pro');for(let i=5;i<=10;i++)parent('P'+i);for(let i=4;i<=8;i++)child('P1','S'+i);
 const oversized=JSON.stringify(c.folderData);plan('expired');assert.equal(JSON.stringify(c.folderData),oversized);
 parent('After expiry',false);child('P10','First',false);assert.equal(denials.at(-1).oversized,true);assert.equal(denials.at(-1).expired,true);
 c.updateParentFolderRecord('P10','Renamed','#654321','#ffffff',ok=>assert.ok(ok));
 c.updateSubfolderRecord('P1','S8','Renamed child','#654321','#ffffff',ok=>assert.ok(ok));
 c.removeFromSubfolder('UC_0','P2','S1',ok=>assert.ok(ok));
 // Removing excess parents alone is insufficient if a parent still has excess children.
 for(const p of ['P4','P5','P6','P7','P8','P9','Renamed'])c.deleteParentFolderRecord(p,ok=>assert.ok(ok));
 parent('Still oversized',false);
 for(const name of ['S4','S5','S6','S7','Renamed child'])c.deleteSubfolderRecord('P1',name,ok=>assert.ok(ok));
 parent('Fourth again');parent('Fifth again',false);
 c.deleteSubfolderRecord('P2','S3',ok=>assert.ok(ok));child('P2','Replacement');child('P2','One more',false);
 // Invalid test states fail closed; release mode ignores persisted development Pro.
 plan('pro');c.CONFIG.DEVELOPMENT_PLAN_TESTING=false;plan('pro');assert.equal(c.FolderPlan.state,'free');
 c.CONFIG.DEVELOPMENT_PLAN_TESTING=true;for(const value of [null,'PRO',{},'invalid']){plan(value);assert.equal(c.FolderPlan.state,'free')}
 // Full restore is permitted on Free/expired even when all ten parents exceed limits.
 const restored=Object.fromEntries(Array.from({length:10},(_,i)=>['Restored '+i,{color:'#123456',subscriptions:[],subfolders:{One:{subscriptions:[subscriptions[1]]},Two:{subscriptions:[]},Three:{subscriptions:[]},Four:{subscriptions:[]}}}]));
 const backup=c.BackupFormat.create(restored,cache.folderOwner);
 for(const state of ['free','expired']){
   load({Before:{color:'#123456',subfolders:{},subscriptions:[]}});plan(state);cache.developmentFolderPlan=state;
   const result=await c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.equal(result.success,true);
   assert.ok(downloads.at(-1).folderData.Before);assert.equal(Object.keys(cache.folderData).length,10);assert.equal(cache.developmentFolderPlan,state);
   load(cache.folderData);assert.equal(c.folderData['Restored 0'].subfolders.One.subscriptions.length,1);
   const before=writes;parent('No extra',false);child('Restored 0','No extra',false);assert.equal(writes,before);
   c.updateParentFolderRecord('Restored 0','Renamed restore','#123456','#ffffff',ok=>assert.ok(ok));
 }
 const exportResult=await c.runFolderBackup({action:'exportFolderBackup'});assert.equal(exportResult.success,true);
 assert.ok(!JSON.stringify(downloads.at(-1)).includes('developmentFolderPlan'));
 console.log('PASS: 4 parents / 3 subfolders boundaries, unlimited channels and moves, Pro unlimited creation, expiry preservation, rename/delete/remove above limits, creation resumes after reduction, disabled/invalid development states fail closed, full oversized Free/expired restores with safety copy, and backups exclude plan state.');
})().catch(error=>{console.error(error);process.exitCode=1});
