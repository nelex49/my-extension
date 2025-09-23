/** @format */

// Storage service for YouTube Subscription Manager

function safeSaveFolderData(data) {
  try {
    validateFolderData(data);
    chrome.storage.local.set(
      { [CONFIG.STORAGE_KEYS.FOLDER_DATA]: data },
      () => {
        if (CONFIG.DEBUG) {
          console.log("Folder data saved successfully");
        }
      }
    );
  } catch (error) {
    handleError(error, "Save Folder Data");
  }
}

function safeLoadFolderData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([CONFIG.STORAGE_KEYS.FOLDER_DATA], (result) => {
      try {
        if (result[CONFIG.STORAGE_KEYS.FOLDER_DATA]) {
          validateFolderData(result[CONFIG.STORAGE_KEYS.FOLDER_DATA]);
          resolve(result[CONFIG.STORAGE_KEYS.FOLDER_DATA]);
        } else {
          resolve({});
        }
      } catch (error) {
        handleError(error, "Load Folder Data");
        reject(error);
      }
    });
  });
}

function saveUserSubscriptions(subscriptions) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ userSubscriptions: subscriptions }, () => {
      if (CONFIG.DEBUG) {
        console.log("User subscriptions saved successfully");
      }
      resolve();
    });
  });
}

function loadUserSubscriptions() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions) {
        resolve(result.userSubscriptions);
      } else {
        resolve([]);
      }
    });
  });
}

function saveAccessToken(token) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ accessToken: token }, () => {
      if (CONFIG.DEBUG) {
        console.log("Access token saved successfully");
      }
      resolve();
    });
  });
}

function loadAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["accessToken"], (result) => {
      resolve(result.accessToken || null);
    });
  });
}

// Make them globally available
window.safeSaveFolderData = safeSaveFolderData;
window.safeLoadFolderData = safeLoadFolderData;
window.saveUserSubscriptions = saveUserSubscriptions;
window.loadUserSubscriptions = loadUserSubscriptions;
window.saveAccessToken = saveAccessToken;
window.loadAccessToken = loadAccessToken;

