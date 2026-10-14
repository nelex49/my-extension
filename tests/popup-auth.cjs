const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
module.exports=async function testPopupSignOut(){
 for(const mode of ['success','storage-error']){
  const elements=Object.fromEntries(['login','logout','status','link-account'].map(id=>[id,{style:{},hidden:false,disabled:false,textContent:'',events:{},addEventListener(name,fn){this.events[name]=fn}}]));
  const owner={id:'UC_OWNER',title:'Original account'},folders={Music:{subfolders:{Jazz:{subscriptions:[{id:'kept'}]}}}};
  const cache={accessToken:'mock-token',folderOwner:owner,folderData:folders,accountStatus:{state:'ready',session:'mock-token',account:owner}};
  const actions=[];const timers=new Map();let timerId=0;
  const fakeSet=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId};
  const fakeClear=id=>timers.delete(id);
  const c={console,setTimeout:fakeSet,clearTimeout:fakeClear,window:{close(){}},URLSearchParams,confirm:()=>true,document:{body:{classList:{remove(){},add(){}}},getElementById:id=>elements[id]},chrome:{runtime:{lastError:null,sendMessage:async()=>({success:true})},identity:{clearAllCachedAuthTokens(callback){actions.push('clear');callback()}},storage:{local:{get:async()=>structuredClone(cache),remove:async key=>{actions.push('remove');if(mode==='storage-error')throw Error('storage failed');delete cache[key]},set:async data=>Object.assign(cache,data)},onChanged:{addListener(){}}}},fetch:async(url,options)=>{
    throw Error('Ordinary sign-out must not revoke Google permission');
  }};
  vm.createContext(c);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..','popup.js'),'utf8'),c);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(timers.size,0); // Opening the signed-in popup does not auto-close.
  await elements.logout.events.click();
  assert.deepEqual(actions,['remove']);
  assert.deepEqual(cache.folderOwner,owner);assert.deepEqual(cache.folderData,folders);
  assert.equal(elements.login.disabled,false);assert.equal(elements.logout.disabled,false);
  if(mode==='success') {
    assert.equal(cache.accessToken,undefined);assert.equal(cache.userSubscriptions.length,0);
    assert.equal(elements.status.textContent,'Signed out. Sign in with Google to continue.');
    assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,7000);
  } else {
    assert.equal(cache.accessToken,'mock-token');assert.equal(timers.size,0);
    assert.ok(elements.status.textContent.includes('could not finish'));
  }
  // Deterministic timers verify delay/fade/close only after successful login.
  if (mode==='success') {
    let closed=0,fading=false;
    c.setTimeout=(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId};
    c.clearTimeout=id=>timers.delete(id);
    c.document.body.classList={add(){fading=true},remove(){fading=false}};
    c.window.close=()=>closed++;
    c.chrome.identity.getAuthToken=(options,callback)=>callback('new-token');
    c.chrome.runtime.sendMessage=async()=>{cache.accountStatus={state:'ready',session:'new-token',account:owner};return {success:true}};
    elements.login.events.click();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(elements.status.textContent,'Signed in successfully');
    assert.deepEqual(actions,['remove']); // Login must not clear Google's cached authorisation.
    assert.equal(timers.size,1);const wait=[...timers.values()][0];assert.equal(wait.ms,3000);
    timers.clear();await wait.fn();assert.equal(fading,true);assert.equal(closed,0);
    const fade=[...timers.values()][0];assert.equal(fade.ms,300);fade.fn();assert.equal(closed,1);
    timers.clear();cache.accountStatus={state:'blocked',session:'new-token',account:{id:'OTHER',title:'Other'},owner};
    await c.renderAccount();assert.equal(timers.size,0);assert.equal(fading,false);
    assert.ok(elements.status.textContent.includes('This setup belongs'));
    delete cache.accessToken;cache.accountStatus={state:'signedOut'};await c.renderAccount();
    assert.equal(timers.size,0); // Deliberately opening signed-out UI has no timer.
    await elements.logout.events.click();assert.equal([...timers.values()][0].ms,7000);
    const signedOutWait=[...timers.values()][0];timers.clear();await signedOutWait.fn();
    assert.equal(fading,true);assert.equal([...timers.values()][0].ms,300);
    [...timers.values()][0].fn();assert.equal(closed,2);
  }

 }
};
