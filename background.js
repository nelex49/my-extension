/** @format */

// Background script for YouTube Subscription Manager

// Listen for storage changes to re-inject when token changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.accessToken) {
    // Get all YouTube tabs and re-inject into them
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        injectScriptWithToken(changes.accessToken.newValue, tabs[0].id);
      }
    });
  }

  // Notify content script when subscriptions are updated
  if (namespace === "local" && changes.userSubscriptions) {
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs
          .sendMessage(tab.id, {
            type: "subscriptionsUpdated",
            subscriptions: changes.userSubscriptions.newValue,
          })
          .catch((error) => {
            // Silently handle errors - tab might not be ready
          });
      });
    });
  }
});

// Listen for tab updates to inject content
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    (tab.url.includes("youtube.com") ||
      tab.url.includes("youtube.com/feed/subscriptions"))
  ) {
    // Get access token first, then inject
    chrome.storage.local.get("accessToken", ({ accessToken }) => {
      if (!accessToken) {
        // Wait and retry if no token found initially
        setTimeout(() => {
          chrome.storage.local.get(
            "accessToken",
            ({ accessToken: retryToken }) => {
              injectScriptWithToken(retryToken, tabId);
            }
          );
        }, 2000);
        return;
      }

      // If we have a token, inject immediately
      injectScriptWithToken(accessToken, tabId);
    });
  }
});

// Function to inject script with token
function injectScriptWithToken(accessToken, tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      func: (accessToken) => {
        // Script injected successfully
        // Global variables
        window.userSubscriptions = [];
        window.accessToken = accessToken;

        // Function to load subscriptions
        async function loadSubscriptions() {
          const token = window.accessToken || accessToken;
          if (!token) {
            // No access token - using mock data
            window.userSubscriptions = [
              {
                snippet: {
                  title: "Test Channel 1",
                  resourceId: { channelId: "UC123" },
                  thumbnails: {
                    default: { url: "https://via.placeholder.com/40" },
                  },
                },
              },
              {
                snippet: {
                  title: "Test Channel 2",
                  resourceId: { channelId: "UC456" },
                  thumbnails: {
                    default: { url: "https://via.placeholder.com/40" },
                  },
                },
              },
              {
                snippet: {
                  title: "Test Channel 3",
                  resourceId: { channelId: "UC789" },
                  thumbnails: {
                    default: { url: "https://via.placeholder.com/40" },
                  },
                },
              },
            ];
            return;
          }

          try {
            const response = await fetch(
              "https://www.googleapis.com/youtube/v3/subscriptions?mine=true&maxResults=50&part=snippet,contentDetails",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            window.userSubscriptions = data.items || [];

            // Save to storage (this needs to be done from background script)
            // We'll handle this in the background script after injection
          } catch (error) {
            // Silently handle errors - keep empty array
            window.userSubscriptions = [];
          }
        }

        // Load subscriptions
        return loadSubscriptions().then(() => {
          return window.userSubscriptions;
        });
      },
      args: [accessToken],
      world: "MAIN",
    })
    .then((results) => {
      if (results && results[0] && results[0].result) {
        const subscriptions = results[0].result;

        // Save subscriptions to storage from background script
        chrome.storage.local.set(
          {
            userSubscriptions: subscriptions,
          },
          () => {
            // Send message to content script after saving
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
              if (tabs.length > 0) {
                chrome.tabs
                  .sendMessage(tabs[0].id, {
                    type: "subscriptionsUpdated",
                    subscriptions: subscriptions,
                  })
                  .catch((error) => {
                    // Silently handle errors - tab might not be ready
                  });
              }
            });
          }
        );
      }
    })
    .catch((error) => {
      // Silently handle injection errors
    });
}
