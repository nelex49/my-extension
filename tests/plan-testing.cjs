const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(enabled=true,stored='free'){
 const buttons=['free','pro','expired'].map(plan=>({dataset:{plan},events:{},attrs:{},addEventListener(k,f){this.events[k]=f},setAttribute(k,v){this.attrs[k]=v}}));
 const status={},allowance={},store={developmentFolderPlan:stored,folderData:{Keep:{subfolders:{}}}};let fail=false;
 const c={CONFIG:{DEVELOPMENT_PLAN_TESTING:enabled},document:{querySelector:selector=>selector==='#status'?status:allowance,querySelectorAll:()=>buttons},chrome:{storage:{local:{async get(){return {...store}},async set(value){if(fail)throw Error('Failed');Object.assign(store,value)}}}}};
 c.window=c;vm.createContext(c);for(const f of ['src/plans/FolderPlan.js','development/plan-testing.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 return {buttons,status,store,set fail(value){fail=value}};
}
(async()=>{
 const t=setup(true,'pro');await flush();assert.ok(t.status.textContent.includes('pro'));assert.equal(t.buttons[1].attrs['aria-pressed'],'true');
 const folders=JSON.stringify(t.store.folderData);
 await t.buttons[2].events.click();assert.equal(t.store.developmentFolderPlan,'expired');assert.ok(t.status.textContent.includes('expired'));
 await t.buttons[0].events.click();assert.equal(t.store.developmentFolderPlan,'free');assert.equal(JSON.stringify(t.store.folderData),folders);
 t.fail=true;await t.buttons[1].events.click();assert.equal(t.store.developmentFolderPlan,'free');assert.ok(t.status.textContent.includes('Could not save'));assert.ok(t.buttons.every(b=>!b.disabled));
 const off=setup(false,'pro');await flush();assert.ok(off.buttons.every(b=>b.disabled));assert.ok(off.status.textContent.includes('disabled'));assert.ok(off.buttons.every(b=>!b.events.click));
 console.log('PASS: development test page loads persisted state, switches Free/Pro/expired without modifying folders, reports failed saves and disables all controls when testing is off.');
})().catch(e=>{console.error(e);process.exitCode=1});
