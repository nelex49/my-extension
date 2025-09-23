/** @format */

// Main orchestrator for YouTube Subscription Manager
// This file loads all modules in the correct order

console.log("=== YOUTUBE SUBSCRIPTION MANAGER LOADING ===");

// Wait for DOM and modules to be ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing app...");
  if (window.initialize) {
    window.initialize();
  }
});

// Fallback for SPA navigation
setTimeout(() => {
  console.log("Fallback initialization...");
  if (window.initialize && !window.appInitialized) {
    window.initialize();
    window.appInitialized = true;
  }
}, 2000);
