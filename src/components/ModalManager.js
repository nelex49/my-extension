/** @format */

// ModalManager component for YouTube Subscription Manager

function createModal(innerHTML, size = "large") {
  const modal = document.createElement("div");
  const styleKey =
    size === "small"
      ? "MODAL_SMALL_STYLES"
      : size === "compact"
      ? "MODAL_COMPACT_STYLES"
      : "MODAL_STYLES";

  modal.style.cssText = Object.entries(CSS_CONSTANTS[styleKey])
    .map(
      ([key, value]) =>
        `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
    )
    .join("; ");
  modal.innerHTML = innerHTML;
  return modal;
}

// Utility function to create consistent button styles
function createButton(text, className = "", additionalStyles = {}) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  applyStyles(button, { ...CSS_CONSTANTS.BUTTON_STYLES, ...additionalStyles });
  return button;
}

// Utility function to create consistent modal header
function createModalHeader(title, closeButtonId = "close-modal") {
  return `
    <div style="${Object.entries(CSS_CONSTANTS.HEADER_STYLES)
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
      )
      .join("; ")}">
      <button id="${closeButtonId}" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 30px; height: 30px; color: white; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
      <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${title}</h2>
    </div>
  `;
}

// Utility function to get CSS value from constants
function getCSSValue(category, key) {
  return CSS_CONSTANTS[category]?.[key] || "";
}

// Make them globally available
window.createModal = createModal;
window.createButton = createButton;
window.createModalHeader = createModalHeader;
window.getCSSValue = getCSSValue;

