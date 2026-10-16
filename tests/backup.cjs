const fs = require('fs'), vm = require('vm'), assert = require('assert');
const root = require('path').resolve(__dirname, '..');
const source = ['src/accounts/AccountSetupStore.js','src/shared/BackupFormat.js','src/background/BackupService.js'].map(p=>fs.readFileSync(root+'/'+p,'utf8')).join('\n');
function setup() {
 const data = {accessToken:'session',folderOwner:{id:'UC_OWNER',title:'Owner'},accountStatus:{state:'ready',session:'session',account:{id:'UC_OWNER'}},folderData:{Music:{color:'#123456',textColor:'#ffffff',subscriptions:[],subfolders:{Blues:{subscriptions:[{snippet:{title:'Test',resourceId:{channelId:'UC_TEST'}}}]}}}}};
 const files=[]; let state='complete', writes=0, failWrite=false, duringDownload=()=>{};
 const c = {console,TextEncoder,setTimeout,Date,chrome:{storage:{local:{async get(){return structuredClone(data)},async set(value){if(failWrite)throw Error('Storage failed');writes++;Object.assign(data,structuredClone(value));}}},downloads:{async download(options){files.push(JSON.parse(decodeURIComponent(options.url.split(',').slice(1).join(','))));duringDownload();return 1},async search(){return [{state}]}}}};
 vm.createContext(c);vm.runInContext(source,c);
 return {c,data,files,get writes(){return writes},set state(v){state=v},set failWrite(v){failWrite=v},set duringDownload(v){duringDownload=v}};
}
(async()=>{
 let t=setup(); const original=JSON.stringify(t.data.folderData);
 let r=await t.c.runFolderBackup({action:'exportFolderBackup'});assert.ok(r.success);assert.equal(t.writes,0);assert.ok(!('accessToken' in t.files[0]));assert.equal(t.files[0].owner.id,'UC_OWNER');
 const backup=structuredClone(t.files[0]);backup.folderData={Recovered:{subscriptions:[],subfolders:{}}};
 r=await t.c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.ok(r.success);assert.equal(t.files[1].folderData.Music.color,'#123456');assert.ok(t.data.folderData.Recovered);assert.equal(t.data.accessToken,'session');assert.equal(t.writes,1);
 for(const text of ['bad','{}',JSON.stringify({...backup,formatVersion:99}),JSON.stringify({...backup,owner:{id:'OTHER'}}),JSON.stringify({...backup,folderData:JSON.parse('{"__proto__":{}}')})]){
  t=setup();r=await t.c.runFolderBackup({action:'restoreFolderBackup',text});assert.equal(r.success,false);assert.equal(t.writes,0);assert.equal(t.files.length,0);assert.equal(JSON.stringify(t.data.folderData),original);
 }
 t=setup();t.state='interrupted';r=await t.c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.equal(r.success,false);assert.equal(t.writes,0);
 t=setup();t.failWrite=true;r=await t.c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.equal(r.success,false);assert.equal(JSON.stringify(t.data.folderData),original);assert.equal(t.files.length,1);
 t=setup();t.duringDownload=()=>{t.data.folderData.New={subfolders:{}}};r=await t.c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.equal(r.success,false);assert.equal(t.writes,0);assert.ok(t.data.folderData.New);
 t=setup();t.duringDownload=()=>{delete t.data.accessToken};r=await t.c.runFolderBackup({action:'restoreFolderBackup',text:JSON.stringify(backup)});assert.equal(r.success,false);assert.equal(t.writes,0);
 t=setup();const first=t.c.runFolderBackup({action:'exportFolderBackup'});const second=await t.c.runFolderBackup({action:'exportFolderBackup'});assert.equal(second.success,false);assert.ok((await first).success);
 t=setup();const roundtrip=t.c.BackupFormat.parse(JSON.stringify(t.c.BackupFormat.create(t.data.folderData,t.data.folderOwner)));assert.equal(roundtrip.folderData.Music.subfolders.Blues.subscriptions[0].snippet.resourceId.channelId,'UC_TEST');
 console.log('PASS: backup round trip, credential exclusion, complete safety download before replacement, invalid/version/account/prototype rejection, cancelled download, failed storage preservation, changed folders/account abort and duplicate operation guard.');
})().catch(e=>{console.error(e);process.exitCode=1});
