/** @format */

// Fetch private subscription data in the extension worker, not YouTube's page context.
let refreshGeneration = 0;
let subscriptionRefresh = null;
let refreshSession = null;
let activeRefreshGeneration = null;

function identityToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, result => {
      if (chrome.runtime.lastError) { reject(new Error('Sign in again through the extension popup.')); return; }
      const token = typeof result === 'string' ? result : result?.token;
      if (!token) { reject(new Error('Sign in again through the extension popup.')); return; }
      resolve(token);
    });
  });
}
function forgetToken(token) {
  return new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
}

async function fetchSubscriptionPages(token) {
  const subscriptions = new Map();
  const pageTokens = new Set();
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions');
    url.search = new URLSearchParams({ part: 'snippet', mine: 'true', maxResults: '50', ...(pageToken ? { pageToken } : {}) });
    const response = await fetch(url.href, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      const reason = details.error?.errors?.[0]?.reason || '';
      const error = new Error(response.status === 401 ? 'Sign in again through the extension popup.' :
        `YouTube could not load subscriptions (${response.status}${reason ? ': ' + reason : ''}).`);
      error.status = response.status;
      throw error;
    }
    const page = await response.json();
    if (!Array.isArray(page.items)) throw new Error('YouTube returned an unexpected subscription response.');
    page.items.forEach(sub => {
      const id = sub.snippet?.resourceId?.channelId;
      if (id) subscriptions.set(id, sub);
    });
    pageToken = page.nextPageToken || '';
    if (pageToken) {
      if (pageTokens.has(pageToken)) throw new Error('YouTube returned a repeated page token. Please retry.');
      pageTokens.add(pageToken);
    }
  } while (pageToken);
  return Array.from(subscriptions.values());
}

async function refreshSubscriptions() {
  const { accessToken: session } = await chrome.storage.local.get('accessToken');
  if (!session) return { success: false, error: 'Sign in through the extension popup.' };
  if (subscriptionRefresh && refreshSession === session && activeRefreshGeneration === refreshGeneration) return subscriptionRefresh;
  const generation = refreshGeneration;
  refreshSession = session;
  activeRefreshGeneration = generation;
  const currentSession = async () => generation === refreshGeneration &&
    (await chrome.storage.local.get('accessToken')).accessToken === session;
  const run = (async () => {
    await chrome.storage.local.set({ subscriptionLoadStatus: { state: 'loading' } });
    try {
      let token = await identityToken();
      let subscriptions;
      try { subscriptions = await fetchSubscriptionPages(token); }
      catch (error) {
        if (error.status !== 401) throw error;
        await forgetToken(token);
        token = await identityToken();
        subscriptions = await fetchSubscriptionPages(token);
      }
      if (!await currentSession()) return { success: false, cancelled: true };
      // Commit only the complete list; partial-page failures never replace the cache.
      await chrome.storage.local.set({ userSubscriptions: subscriptions,
        subscriptionLoadStatus: { state: 'ready', count: subscriptions.length, updatedAt: Date.now() } });
      return { success: true, count: subscriptions.length };
    } catch (error) {
      if (!await currentSession()) return { success: false, cancelled: true };
      const message = error.message || 'Could not load subscriptions. Please retry.';
      await chrome.storage.local.set({ subscriptionLoadStatus: { state: 'error', message } });
      return { success: false, error: message };
    }
  })();
  subscriptionRefresh = run;
  try { return await run; }
  finally { if (subscriptionRefresh === run) { subscriptionRefresh = null; refreshSession = null; activeRefreshGeneration = null; } }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup().then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false, error: 'Open the extension toolbar popup to sign in.' }));
    return true;
  }
  if (request.action === 'refreshSubscriptions') {
    refreshSubscriptions().then(sendResponse).catch(() => sendResponse({success:false,error:'Could not refresh subscriptions.'}));
    return true;
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.accessToken) return;
  refreshGeneration++;
  if (changes.accessToken.newValue) refreshSubscriptions().catch(() => {});
  else chrome.storage.local.set({ userSubscriptions: [], subscriptionLoadStatus: { state: 'signedOut' } });
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^https:\/\/www\.youtube\.com\//.test(tab.url || ''))
    refreshSubscriptions().catch(() => {});
});
