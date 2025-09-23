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

function createSafeHTML(tag, innerHTML, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.innerHTML = innerHTML; // Only use when you trust the content
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

// Safe API call wrapper
async function safeApiCall(apiFunction, errorMessage, context = "API Call") {
  try {
    return await apiFunction();
  } catch (error) {
    handleError(error, context);
    throw error;
  }
}

function logStatus(message, type = "info") {
  if (type === "error") {
    console.error(`[YT Extension] ${message}`);
  } else if (type === "warn") {
    console.warn(`[YT Extension] ${message}`);
  } else {
    console.log(`[YT Extension] ${message}`);
  }
}

// Utility function to apply CSS styles from constants
function applyStyles(element, styleObject) {
  Object.assign(element.style, styleObject);
}

// Make panels draggable
function makePanelDraggable(panel, headerSelector = "#panel-header") {
  const header = panel.querySelector(headerSelector);
  if (!header) return;

  let isDragging = false;
  let startX;
  let startY;

  // Initialize panel position
  const rect = panel.getBoundingClientRect();
  let initialX = rect.left;
  let initialY = rect.top;

  // Set initial cursor
  header.style.cursor = "move";

  // Mouse down event
  header.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return; // Don't drag when clicking buttons

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    header.style.cursor = "grabbing";

    // Prevent text selection while dragging
    e.preventDefault();
  });

  // Mouse move event
  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newX = initialX + deltaX;
      const newY = initialY + deltaY;

      // Update panel position
      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      panel.style.transform = "none";
    }
  };

  // Mouse up event
  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = "move";

      // Update initial position for next drag
      const rect = panel.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
    }
  };

  // Add event listeners
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // Clean up function
  return () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };
}

// Make them globally available
window.createSafeElement = createSafeElement;
window.createSafeHTML = createSafeHTML;
window.handleError = handleError;
window.showUserNotification = showUserNotification;
window.safeApiCall = safeApiCall;
window.makePanelDraggable = makePanelDraggable;
window.logStatus = logStatus;
window.applyStyles = applyStyles;
