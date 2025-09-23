/** @format */

// YouTube API service for YouTube Subscription Manager

async function unsubscribeFromChannel(channelId, subscriptionItem, modal) {
  try {
    // Get the subscription ID from the subscription data
    const subscription = userSubscriptions.find(
      (sub) => sub.snippet?.resourceId?.channelId === channelId
    );

    if (!subscription || !subscription.id) {
      showUserNotification("Error: Could not find subscription ID", "error");
      return;
    }

    // Get access token
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(["accessToken"], resolve);
    });

    if (!result.accessToken) {
      showUserNotification("Error: Not logged in to YouTube", "error");
      return;
    }

    // Call YouTube API to unsubscribe
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?id=${subscription.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${result.accessToken}`,
        },
      }
    );

    if (response.ok) {
      // Remove from all folders
      removeSubscriptionFromAllFolders(channelId);

      // Remove from userSubscriptions array
      const index = userSubscriptions.findIndex(
        (sub) => sub.snippet?.resourceId?.channelId === channelId
      );
      if (index !== -1) {
        userSubscriptions.splice(index, 1);
      }

      // Update storage
      chrome.storage.local.set({ userSubscriptions: userSubscriptions });

      // Remove the subscription item from the UI
      subscriptionItem.remove();

      // Success - no notification needed

      // Close modal if it's open
      if (modal) {
        modal.remove();
      }
    } else {
      const errorText = await response.text();
      showUserNotification(
        `Failed to unsubscribe: ${response.status}`,
        "error"
      );
    }
  } catch (error) {
    showUserNotification("Error unsubscribing from channel", "error");
  }
}

async function loadUserData(token) {
  try {
    // Get subscriptions from storage (set by background.js)
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions && result.userSubscriptions.length > 0) {
        userSubscriptions = result.userSubscriptions;
        // Subscriptions loaded successfully
      }
    });
  } catch (error) {
    showUserNotification("Error loading subscription data", "error");
  }
}

// Make them globally available
window.unsubscribeFromChannel = unsubscribeFromChannel;
window.loadUserData = loadUserData;
