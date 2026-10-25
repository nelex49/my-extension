const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const sub={snippet:{title:'Keep me',resourceId:{channelId:'UC_SUB'}}};
const originalFolders={Music:{color:'#123456',textColor:'#ffffff',expanded:true,subscriptions:[],subfolders:{Blues:{color:'#654321',subscriptions:[sub]}}}};
function setup(extra={}) {
 const data={folderOwner:{id:'UC_A',title:'Account A'},folderData:structuredClone(originalFolders),accessToken:'secret-token',accountStatus:{state:'ready',session:'secret-token',account:{id:'UC_A'}},userSubscriptions:[sub],developmentFolderPlan:'pro',...structuredClone(extra)};
 let writes=0,fail=false;const notices=[];
 const c={console,Date,TextEncoder,setTimeout,showUserNotification:(...args)=>notices.push(args),showFolderLimitDialog(){},accountIsReady:()=>true,CONFIG:{DEVELOPMENT_PLAN_TESTING:true},chrome:{runtime:{lastError:null},storage:{local:{get:async()=>structuredClone(data),set(value,callback){writes++;if(fail){if(callback){c.chrome.runtime.lastError={message:'Failed'};callback();c.chrome.runtime.lastError=null;return}return Promise.reject(Error('Storage failed'))}Object.assign(data,structuredClone(value));if(callback)callback();else return Promise.resolve()}}},downloads:{async download(){return 1},async search(){return [{state:'complete'}]}}}};
 c.window=c;vm.createContext(c);
 for(const file of ['src/shared/FolderIcons.js','src/accounts/AccountSetupStore.js','src/accounts/AccountSetupMigration.js','src/plans/FolderPlan.js','src/plans/FolderCreationGate.js','src/services/FolderService.js','src/components/SubscriptionManager.js','src/shared/BackupFormat.js','src/background/BackupService.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});
 function sync(){c.folderData=structuredClone(data.folderData||{});c.folderOwner=structuredClone(data.folderOwner);c.accountSetupData=data.accountSetupData&&structuredClone(data.accountSetupData);c.userSubscriptions=structuredClone(data.userSubscriptions)}
 sync();return {c,data,sync,notices,get writes(){return writes},set fail(value){fail=value}};
}
(async()=>{
 // Linked legacy installation migrates once, preserving the full original working copy.
 let t=setup();const before=JSON.stringify(t.data.folderData);await t.c.AccountSetupMigration.ensure();assert.equal(t.writes,1);
 let registry=t.data.accountSetupData;assert.equal(registry.schemaVersion,1);assert.equal(registry.activeAccountId,'UC_A');assert.equal(registry.preferredFreeAccountId,null);assert.equal(registry.lastActiveAccountId,'UC_A');
 assert.equal(JSON.stringify(registry.setups.UC_A.folderData),before);assert.equal(JSON.stringify(t.data.folderData),before);
 assert.ok(!JSON.stringify(registry).includes('secret-token'));assert.ok(!JSON.stringify(registry).includes('developmentFolderPlan'));assert.ok(!('userSubscriptions' in registry.setups.UC_A));
 await t.c.AccountSetupMigration.ensure();assert.equal(t.writes,1);
 // Unlinked folders must never be assigned to an inferred account.
 const unlinked=setup({folderOwner:null});await unlinked.c.AccountSetupMigration.ensure();assert.equal(unlinked.writes,0);assert.equal(unlinked.data.accountSetupData,undefined);assert.deepEqual(unlinked.data.folderData,originalFolders);
 const empty=setup({folderData:{}});await empty.c.AccountSetupMigration.ensure();assert.deepEqual(empty.data.accountSetupData.setups.UC_A.folderData,{});
 // Migration save failure leaves every original key intact and can be retried.
 t=setup();const untouched=JSON.stringify(t.data);t.fail=true;await assert.rejects(()=>t.c.AccountSetupMigration.ensure());assert.equal(JSON.stringify(t.data),untouched);
 t.fail=false;await t.c.AccountSetupMigration.ensure();assert.equal(Object.keys(t.data.accountSetupData.setups).length,1);
 // Unknown/mismatched/inconsistent records are rejected rather than overwritten.
 const good=structuredClone(t.data.accountSetupData);
 for(const corrupt of [{...good,schemaVersion:99},{...good,activeAccountId:'UC_UNKNOWN'},{...good,preferredFreeAccountId:'UC_UNKNOWN'}, {...good,setups:{UC_A:{owner:{id:'UC_OTHER'},folderData:{}}}}]){
  const x=setup({accountSetupData:corrupt});const saved=JSON.stringify(x.data);await assert.rejects(()=>x.c.AccountSetupMigration.ensure());assert.equal(x.writes,0);assert.equal(JSON.stringify(x.data),saved);
 }
 const conflict=structuredClone(good);conflict.setups.UC_A.folderData={Other:{subfolders:{}}};
 const conflicting=setup({accountSetupData:conflict});await assert.rejects(()=>conflicting.c.AccountSetupMigration.ensure());assert.equal(conflicting.writes,0);
 // An inactive setup is retained byte-for-byte by active saves, moves and restore.
 const two=structuredClone(good);two.setups.UC_B={owner:{id:'UC_B',title:'Account B'},folderData:{PrivateB:{color:'#abcdef',subscriptions:[],subfolders:{}}}};
 t=setup({accountSetupData:two});t.sync();const inactive=JSON.stringify(two.setups.UC_B);const activeBefore=JSON.stringify(t.data.folderData);
 let result;t.c.createParentFolderRecord('New','#123456','#ffffff',ok=>result=ok);assert.equal(result,true);
 assert.equal(JSON.stringify(t.data.folderData),JSON.stringify(t.data.accountSetupData.setups.UC_A.folderData));assert.equal(JSON.stringify(t.data.accountSetupData.setups.UC_B),inactive);
 t.c.createSubfolderRecord('New','Target','#123456','#ffffff',ok=>assert.ok(ok));
 t.c.addToSubfolder('UC_SUB','New','Target',ok=>assert.ok(ok));assert.equal(t.data.accountSetupData.setups.UC_A.folderData.New.subfolders.Target.subscriptions.length,1);
 // Failed atomic save rolls back both the view and persisted account record.
 const saveBefore=JSON.stringify(t.data),viewBefore=JSON.stringify(t.c.folderData);t.fail=true;
 t.c.createParentFolderRecord('Failed','#123456','#ffffff',ok=>assert.equal(ok,false));
 assert.equal(JSON.stringify(t.data),saveBefore);assert.equal(JSON.stringify(t.c.folderData),viewBefore);t.fail=false;
 // Restore updates only A and exports no saved B setup or licence/test state.
 const backup=t.c.BackupFormat.create({Recovered:{subscriptions:[],subfolders:{}}},t.data.folderOwner);
 const restore=await t.c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.ok(restore.success);
 assert.ok(t.data.folderData.Recovered);assert.ok(t.data.accountSetupData.setups.UC_A.folderData.Recovered);assert.equal(JSON.stringify(t.data.accountSetupData.setups.UC_B),inactive);
 assert.equal(t.data.accessToken,'secret-token');assert.equal(t.data.developmentFolderPlan,'pro');
 const exported=t.c.BackupFormat.create(t.data.folderData,t.data.folderOwner);assert.ok(!JSON.stringify(exported).includes('UC_B'));assert.ok(!('accountSetupData' in exported));
 // Re-running migration after writes/restore is a no-op, including after restart.
 const restart=setup(t.data);const count=restart.writes;await restart.c.AccountSetupMigration.ensure();assert.equal(restart.writes,count);
 // A stale owner cannot save into a different active registry.
 restart.c.folderOwner={id:'UC_B',title:'Account B'};const storeBefore=JSON.stringify(restart.data);
 restart.c.createParentFolderRecord('Wrong account','#123456','#ffffff',ok=>assert.equal(ok,false));assert.equal(JSON.stringify(restart.data),storeBefore);
 console.log('PASS: idempotent linked/empty migration, unlinked preservation, failed migration/retry, invalid/version/conflict rejection, credential-free account records, atomic active saves/moves/restores, inactive-account isolation, rollback, restart and stale-owner rejection.');
})().catch(error=>{console.error(error);process.exitCode=1});
