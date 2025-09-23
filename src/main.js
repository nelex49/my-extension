/** @format */

// Main orchestrator for YouTube Subscription Manager
// This file loads all modules in the correct order

// Wait for DOM and modules to be ready
document.addEventListener("DOMContentLoaded", () => {
  if (window.initialize) {
    window.initialize();
  }
});

// Fallback for SPA navigation
setTimeout(() => {
  if (window.initialize && !window.appInitialized) {
    window.initialize();
    window.appInitialized = true;
  }
}, 2000);
