// The popup identifies the authorised channel and explicitly links legacy folders.
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const statusBox = document.getElementById('status');
const linkBtn = document.getElementById('link-account');
let candidate = null;
let signInPending = false;
let popupCloseTimer = null;
function cancelPopupClose() {
  clearTimeout(popupCloseTimer); popupCloseTimer = null;
  document.body.classList.remove('is-closing');
}
function schedulePopupClose(mode = 'signedIn') {
  if (popupCloseTimer !== null) return;
  popupCloseTimer = setTimeout(async () => {
    const {accessToken, accountStatus} = await chrome.storage.local.get(['accessToken','accountStatus']);
    const valid = mode === 'signedOut' ? !accessToken && accountStatus?.state === 'signedOut' :
      !!accessToken && accountStatus?.state === 'ready' && accountStatus.session === accessToken;
    if (!valid) { cancelPopupClose(); return; }
    document.body.classList.add('is-closing');
    popupCloseTimer = setTimeout(() => window.close(), 300);
  }, mode === 'signedOut' ? 7000 : 3000);
}
async function renderAccount() {
  const data = await chrome.storage.local.get(['accessToken','accountStatus','folderOwner','folderData']);
  const status = data.accountStatus || {};
  candidate = null; linkBtn.hidden = true;
  if (!data.accessToken || status.session !== data.accessToken || status.state !== 'ready') cancelPopupClose();
  loginBtn.style.display = data.accessToken ? 'none' : 'block';
  logoutBtn.style.display = data.accessToken ? 'block' : 'none';
  if (!data.accessToken) { statusBox.textContent = 'Signed out. Sign in with Google to continue.'; return; }
  if (status.session !== data.accessToken || status.state === 'verifying') { statusBox.textContent = 'Verifying the authorised YouTube account...'; return; }
  if (status.state === 'ready') {
    statusBox.textContent = signInPending ? 'Signed in successfully' : 'Signed in';
    if (signInPending) schedulePopupClose();
  }
  else if (status.state === 'needsLink') {
    candidate = status.account;
    const hasExistingFolders = Object.keys(data.folderData || {}).length > 0;
    statusBox.textContent = hasExistingFolders
      ? `Link existing folders to this YouTube account?\n\n${candidate.title}\n\nOnly continue if your existing folders belong to this account. They will be preserved and linked to it.`
      : `Use this YouTube account?\n\n${candidate.title}\n\nYour folders will be linked to this account.`;
    linkBtn.textContent = hasExistingFolders ? 'Link existing folders' : 'Use this account';
    linkBtn.hidden = false;
  } else if (status.state === 'blocked') statusBox.textContent = `Authorised account: ${status.account.title}\nThis setup belongs to ${status.owner.title}. Sign out and sign in with the linked account. Your folders have not been changed.`;
  else statusBox.textContent = status.message || 'Account verification failed. Sign out and sign in again.';
}
loginBtn.addEventListener('click', () => {
  cancelPopupClose(); signInPending = true;
  loginBtn.disabled = true; statusBox.textContent = 'Opening Google sign-in...';
  chrome.identity.getAuthToken({interactive:true}, async result => {
      const error = chrome.runtime.lastError;
      const token = typeof result === 'string' ? result : result?.token;
      if (error || !token) { statusBox.textContent = error?.message || 'No authorisation received.'; loginBtn.disabled = false; return; }
      try {
        await chrome.storage.local.set({accountStatus:{state:'verifying',session:token},userSubscriptions:[],accessToken:token});
        await chrome.runtime.sendMessage({action:'refreshSubscriptions'}); await renderAccount();
      } catch (_) { statusBox.textContent = 'Could not complete sign-in. Try again.'; }
      loginBtn.disabled = false;
    });
});
logoutBtn.addEventListener('click', async () => {
  cancelPopupClose(); signInPending = false;
  logoutBtn.disabled = true; loginBtn.disabled = true;
  statusBox.textContent = 'Signing out...';
  try {
    // End only the extension session; retain Google's consent and token cache.
    await chrome.storage.local.remove('accessToken');
    await chrome.storage.local.set({accountStatus:{state:'signedOut'},userSubscriptions:[],subscriptionLoadStatus:{state:'signedOut'}});
    await renderAccount();
    schedulePopupClose('signedOut');
  } catch (_) { statusBox.textContent = 'Sign-out could not finish. Reopen the popup and check your account status.'; }
  finally { logoutBtn.disabled = false; loginBtn.disabled = false; }
});
linkBtn.addEventListener('click', async () => {
  if (!candidate || linkBtn.disabled) return;
  linkBtn.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({action:'linkFolderAccount',accountId:candidate.id});
    if (!result?.success) statusBox.textContent = result?.error || 'Could not link the account.';
    else await renderAccount();
  } catch (_) { statusBox.textContent = 'Could not link the account. Try again.'; }
  linkBtn.disabled = false;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.accountStatus || changes.accessToken || changes.folderOwner)) renderAccount().catch(() => {});
});
renderAccount().then(async () => {
  const {accessToken} = await chrome.storage.local.get('accessToken');
  if (accessToken) { await chrome.runtime.sendMessage({action:'refreshSubscriptions'}); await renderAccount(); }
}).catch(() => { statusBox.textContent = 'Could not read account status. Reload the extension.'; });
