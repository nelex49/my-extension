/** @format */

// Helper functions for YouTube Subscription Manager

function createSafeElement(tag, content, className = "", attributes = {}) {
  const element = document.createElement(tag);
  element.textContent = content; // Prevents XSS
  if (className) element.className = className;

  // Add attributes safely
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  return element;
}

// Error handling utilities
function handleError(error, context = "Unknown") {
  const errorMessage = `Error in ${context}: ${error.message}`;

  if (CONFIG.DEBUG) {
    console.error(errorMessage, error);
  }

  // Error occurred - no notification needed

  return error;
}

function showUserNotification(message, type = "info") {
  // Create a simple notification system
  const notification = createSafeElement("div", message, "user-notification", {
    style: {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "99999",
      maxWidth: "300px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      background:
        type === "error"
          ? "#dc3545"
          : type === "success"
          ? "#28a745"
          : "#007bff",
    },
  });

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function logStatus(message, type = "info") {
  // Production logging - only log errors in production
  if (type === "error") {
    console.error(`[YT Extension] ${message}`);
  }
  // Debug logging can be enabled by setting CONFIG.DEBUG = true
  if (CONFIG.DEBUG) {
    if (type === "warn") {
      console.warn(`[YT Extension] ${message}`);
    } else {
      console.log(`[YT Extension] ${message}`);
    }
  }
}

// Public helpers used by active components.
Object.assign(window, { createSafeElement, handleError, showUserNotification, logStatus });
