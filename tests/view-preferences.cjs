const fs = require('fs'), vm = require('vm'), assert = require('assert');
const source = fs.readFileSync(require('path').join(__dirname, '../src/services/ViewPreferences.js'), 'utf8');
(async () => {
  const key = 'subscriptionViewPreferences';
  let store = {}, allowed = true, fail = false, writes = 0;
  const context = { console: {warn() {}}, chrome: {storage: {local: {
    async get() {return structuredClone(store)},
    async set(patch) { if (fail) throw Error('quota'); writes++; Object.assign(store, structuredClone(patch)); }
  }}}, accountIsReady: () => allowed };
  context.window = context; vm.createContext(context); vm.runInContext(source, context);
  const prefs = context.ViewPreferences;
  await prefs.initialize('A');
  prefs.update({sidebarOpen:true, parents:['Art'], children:['["Art","Sketches"]'],manageOpen:true,parent:'Art',child:'Sketches'});
  await prefs.flush();
  assert.equal(store[key].view.child,'Sketches');
  assert.deepEqual(Object.keys(store),[key]); // No folder, owner, plan or backup writes.
  await prefs.initialize('A'); assert.equal(prefs.read().sidebarOpen,true); assert.equal(prefs.read().manageOpen,undefined);
  prefs.update({sidebarOpen:false}); prefs.update({sidebarOpen:true}); prefs.update({sidebarOpen:false}); await prefs.flush();
  assert.equal(store[key].view.sidebarOpen,false);
  const count = writes; allowed = false; prefs.update({parent:'Blocked'}); await prefs.flush();assert.equal(writes,count);assert.equal(prefs.read().parent,'Art');
  allowed = true; await prefs.initialize('B');assert.equal(prefs.read().parent,null);assert.equal(prefs.read().manageOpen,undefined);
  store[key]={version:99,owner:'B',view:{manageOpen:true}};await prefs.initialize('B');assert.equal(prefs.read().manageOpen,undefined);
  store[key]={version:1,owner:'B',view:{parents:['Art',5,'Art'],children:['bad','["Art",3]','["Art","Ink"]'],manageOpen:'yes',parent:3,child:'Ink'}};
  await prefs.initialize('B');assert.equal(prefs.read().parents.length,1);assert.equal(prefs.read().children.length,1);assert.equal(prefs.read().manageOpen,undefined);assert.equal(prefs.read().child,null);
  fail=true;prefs.update({sidebarOpen:true});await prefs.flush();fail=false;prefs.update({sidebarOpen:false});await prefs.flush();assert.equal(store[key].view.sidebarOpen,false);
  console.log('PASS: preference reload, rapid-write order, owner isolation, protected writes, schema validation, separate storage and failed-write recovery.');
})().catch(error=>{console.error(error);process.exitCode=1});
