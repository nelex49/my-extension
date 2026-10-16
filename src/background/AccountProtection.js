// One verified YouTube channel owns this installation's folder setup.
async function identifyYouTubeAccount(token) {
  const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { const error = new Error('Could not verify the YouTube account. Sign in again.'); error.status = response.status; error.accountVerification = true; throw error; }
  const page = await response.json();
  if (!Array.isArray(page.items) || page.items.length !== 1 || !page.items[0].id)
    { const error = new Error('A single YouTube channel could not be identified. Your folders have not been changed.'); error.accountVerification = true; throw error; }
  return { id: page.items[0].id, title: page.items[0].snippet?.title || page.items[0].id };
}
async function checkAccount(token, session, currentSession) {
  let account;
  try { account = await identifyYouTubeAccount(token); }
  catch (error) { error.accountVerification = true; throw error; }
  if (!await currentSession()) return false;
  const { folderOwner } = await chrome.storage.local.get('folderOwner');
  const state = !folderOwner ? 'needsLink' : folderOwner.id === account.id ? 'ready' : 'blocked';
  if (state === 'ready') {
    try { await AccountSetupMigration.ensure(); }
    catch (error) { error.accountVerification = true; throw error; }
    if (!await currentSession()) return false;
  }
  await chrome.storage.local.set({ accountStatus: { state, account, owner: folderOwner || null, session },
    ...(state === 'ready' ? {} : { userSubscriptions: [], subscriptionLoadStatus: { state: 'accountRequired' } }) });
  return state === 'ready';
}
let accountLinkPending = false;
async function linkFolderAccount(request) {
  if (accountLinkPending) return { success: false, error: 'Account linking is already in progress.' };
  accountLinkPending = true;
  try {
    const { accessToken: session, accountStatus, folderOwner } = await chrome.storage.local.get(['accessToken','accountStatus','folderOwner']);
    if (!session || folderOwner || accountStatus?.state !== 'needsLink' || accountStatus.session !== session || accountStatus.account.id !== request.accountId)
      return { success: false, error: 'Account state changed. Reopen the popup and try again.' };
    const token = await identityToken(), account = await identifyYouTubeAccount(token);
    const latest = await chrome.storage.local.get(['accessToken','folderOwner','folderData',AccountSetupStore.key]);
    if (latest.accessToken !== session || latest.folderOwner || account.id !== request.accountId)
      return { success: false, error: 'The authorised account changed. Nothing was linked.' };
    await chrome.storage.local.set({ ...AccountSetupStore.withFolders({ ...latest, folderOwner: account }, latest.folderData || {}), folderOwner: account, accountStatus: { state: 'ready', account, owner: account, session }, userSubscriptions: [] });
    await refreshSubscriptions();
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
  finally { accountLinkPending = false; }
}
