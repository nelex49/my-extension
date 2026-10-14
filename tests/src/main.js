/** @format */

// The manifest loads dependencies; this is the single startup entry point.
function startSubscriptionManager() {
  initialize().catch((error) => handleError(error, "App Initialization"));
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startSubscriptionManager, { once: true });
} else {
  startSubscriptionManager();
}
