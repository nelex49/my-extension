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
    console.log("Subscriptions updated in storage, notifying content script");
    console.log(
      "New subscriptions count:",
      changes.userSubscriptions.newValue?.length || 0
    );
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
      console.log("Found YouTube tabs:", tabs.length);
      tabs.forEach((tab) => {
        console.log("Sending message to tab:", tab.id);
        chrome.tabs
          .sendMessage(tab.id, {
            type: "subscriptionsUpdated",
            subscriptions: changes.userSubscriptions.newValue,
          })
          .then(() => {
            console.log("Message sent successfully to tab:", tab.id);
          })
          .catch((error) => {
            console.log("Failed to send message to tab:", tab.id, error);
          });
      });
    });
  }
});

// Listen for tab updates to inject content
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("TAB UPDATE:", tabId, changeInfo.status, tab.url);
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    (tab.url.includes("youtube.com") ||
      tab.url.includes("youtube.com/feed/subscriptions"))
  ) {
    console.log("YouTube page detected, injecting script...");
    // Get access token first, then inject
    chrome.storage.local.get("accessToken", ({ accessToken }) => {
      console.log(
        "Access token from storage:",
        accessToken ? "Found" : "Not found"
      );
      if (!accessToken) {
        // Wait and retry if no token found initially
        console.log("No token found, waiting 2 seconds and retrying...");
        setTimeout(() => {
          chrome.storage.local.get(
            "accessToken",
            ({ accessToken: retryToken }) => {
              console.log("Token found on retry, injecting...");
              injectScriptWithToken(retryToken, tabId);
            }
          );
        }, 2000);
        return;
      }

      // If we have a token, inject immediately
      console.log("Injecting with token...");
      injectScriptWithToken(accessToken, tabId);
    });
  }
});

// Function to inject script with token
function injectScriptWithToken(accessToken, tabId) {
  console.log("INJECTING SUBSCRIPTION MANAGER");
  console.log("Access token:", accessToken ? "Found" : "Not found");
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
            console.error("Error loading subscriptions:", error);
            // Fallback to mock data
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
      console.log("Background script received results:", results);
      if (results && results[0] && results[0].result) {
        const subscriptions = results[0].result;
        console.log(
          "Retrieved subscriptions from injected script:",
          subscriptions.length
        );

        // Save subscriptions to storage from background script
        chrome.storage.local.set(
          {
            userSubscriptions: subscriptions,
          },
          () => {
            console.log(
              "Subscriptions saved to storage from background script"
            );

            // Send a test message immediately after saving
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
              if (tabs.length > 0) {
                console.log(
                  "Sending immediate test message to tab:",
                  tabs[0].id
                );
                chrome.tabs
                  .sendMessage(tabs[0].id, {
                    type: "subscriptionsUpdated",
                    subscriptions: subscriptions,
                  })
                  .then(() => {
                    console.log("Immediate test message sent successfully");
                  })
                  .catch((error) => {
                    console.log("Immediate test message failed:", error);
                  });
              }
            });
          }
        );
      }
    })
    .catch((error) => {
      console.error("Script injection failed:", error);
      console.error("Error details:", error.message, error.stack);
    });
}
