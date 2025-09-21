/** @format */

// UI Elements
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const statusBox = document.getElementById("status");

// Store token in memory
let accessToken = null;

// Check if already logged in on popup open
chrome.storage.local.get("accessToken", ({ accessToken: storedToken }) => {
  if (storedToken) {
    accessToken = storedToken;
    statusBox.textContent = "✅ Already logged in";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  }
});

// Login functionality
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    statusBox.textContent = "Opening login window...";

    // Clear any existing token to force fresh login
    chrome.identity.clearAllCachedAuthTokens(() => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          statusBox.textContent = `Login failed: ${chrome.runtime.lastError.message}`;
          return;
        }

        if (!token) {
          statusBox.textContent = "Login failed: No token received";
          return;
        }

        accessToken = token;
        statusBox.textContent = "✅ Logged in successfully!";
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";

        // Store token in Chrome storage
        chrome.storage.local.set({ accessToken });
      });
    });
  });
}

// Logout functionality
logoutBtn.addEventListener("click", () => {
  if (accessToken) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: "POST",
      headers: { "Content-type": "application/x-www-form-urlencoded" },
    });
  }

  // Clear all cached auth tokens
  chrome.identity.clearAllCachedAuthTokens(() => {
    accessToken = null;
    statusBox.textContent = "🔒 Logged out.";
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";

    // Clear token from storage to notify content script
    chrome.storage.local.remove("accessToken");
  });
});
