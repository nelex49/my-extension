// Configuration object for environment settings
const CONFIG = {
  OAUTH_CLIENT_ID:
    "763119874945-ad7le2f2eldhslfppaflmuspedj1o4hi.apps.googleusercontent.com",
  API_BASE_URL: "https://www.googleapis.com/youtube/v3",
  DEBUG: false, // Set to false for production
  VERSION: "1.0.0",
  STORAGE_KEYS: {
    FOLDER_DATA: "folderData",
    ACCESS_TOKEN: "accessToken",
    USER_SUBSCRIPTIONS: "userSubscriptions",
  },
};

// Make them globally available
window.CONFIG = CONFIG;
