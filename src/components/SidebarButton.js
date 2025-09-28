/** @format */

// SidebarButton component for YouTube Subscription Manager

function createSidebarButton() {
  // Check if button already exists to prevent duplicates
  const existingButton = document.querySelector("#yt-manage-guide-entry");
  if (existingButton) {
    return existingButton;
  }

  // Set flag immediately to prevent duplicate calls
  if (window.sidebarButtonCreated) {
    return null;
  }

  // Mark as creating to prevent duplicate calls
  window.sidebarButtonCreated = true;

  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    // Find the Subscriptions button specifically - this is the key!
    const subscriptionsLink = document.querySelector('a[href*="/feed/subscriptions"]');
    
    if (subscriptionsLink) {
      // Find the subscriptions guide entry
      const subscriptionsEntry = subscriptionsLink.closest("ytd-guide-entry-renderer");
      
      if (subscriptionsEntry) {
        // Find the parent container
        let container = subscriptionsEntry.parentElement;

        // Create our button as a proper guide entry
        const newGuideEntry = document.createElement(
          "ytd-guide-entry-renderer"
        );
        newGuideEntry.id = "yt-manage-guide-entry";

        // Create blue background button with white text and star icon
        newGuideEntry.innerHTML = `
          <a id="yt-manage-link" href="#" class="yt-simple-endpoint style-scope ytd-guide-entry-renderer" aria-label="Manage YT">
            <div style="margin-right: 12px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 20px; height: 20px; fill: white;">
                <g>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </g>
              </svg>
            </div>
            <span class="title style-scope ytd-guide-entry-renderer">MANAGE YT SUBS</span>
          </a>
        `;

        // Apply aggressive styling after creation
        const link = newGuideEntry.querySelector("#yt-manage-link");
        if (link) {
          // Force all the styles
          link.style.cssText = `
            background-color: #1976d2 !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            padding: 10px 16px !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin: 2px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          `;

          // Force text color and ensure it fits
          const title = link.querySelector(".title");
          if (title) {
            title.style.cssText = `
              color: white !important;
              font-weight: 500 !important;
              font-size: 14px !important;
              white-space: nowrap !important;
            `;
          }
        }

        // Add hover effect
        if (link) {
          link.addEventListener("mouseenter", () => {
            link.style.backgroundColor = "#1565c0";
          });
          link.addEventListener("mouseleave", () => {
            link.style.backgroundColor = "#1976d2";
          });
        }

        // Add click handler
        const manageLink = newGuideEntry.querySelector("#yt-manage-link");
        if (manageLink) {
          manageLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Temporary visual feedback
            manageLink.style.backgroundColor = "#ff9800";
            setTimeout(() => {
              manageLink.style.backgroundColor = "#1976d2";
            }, 200);

            // Call the dropdown function
            if (typeof window.toggleFolderDropdown === "function") {
              window.toggleFolderDropdown();
            }
          });
        }

        // Add fade-in animation
        newGuideEntry.style.opacity = "0";
        newGuideEntry.style.transition = "opacity 0.3s ease-in";

        // Actually insert the button into the DOM - right after subscriptions
        container.insertBefore(newGuideEntry, subscriptionsEntry.nextSibling);

        // Trigger fade-in after insertion
        setTimeout(() => {
          newGuideEntry.style.opacity = "1";
        }, 10);

        return newGuideEntry;
      }
    }

    return null;
  }, 1000);
}

function createLoginPrompt() {
  logStatus("createLoginPrompt called", "info");

  // Check if button already exists to prevent duplicates
  const existingButton = document.querySelector("#yt-manage-guide-entry");
  if (existingButton) {
    logStatus("Login prompt already exists, returning existing", "info");
    return existingButton;
  }

  // Set flag immediately to prevent duplicate calls
  if (window.sidebarButtonCreated) {
    logStatus("Button creation flag is true, skipping login prompt", "warn");
    return null;
  }

  // Mark as creating to prevent duplicate calls
  window.sidebarButtonCreated = true;

  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    // Find the Subscriptions button specifically - this is the key!
    const subscriptionsLink = document.querySelector('a[href*="/feed/subscriptions"]');
    
    if (subscriptionsLink) {
      // Find the subscriptions guide entry
      const subscriptionsEntry = subscriptionsLink.closest("ytd-guide-entry-renderer");
      
      if (subscriptionsEntry) {
        // Find the parent container
        let container = subscriptionsEntry.parentElement;

        // Create our login prompt as a proper guide entry
        const newGuideEntry = document.createElement(
          "ytd-guide-entry-renderer"
        );
        newGuideEntry.id = "yt-manage-guide-entry";

        // Create orange background button with white text and lock icon
        newGuideEntry.innerHTML = `
          <a id="yt-manage-link" href="#" class="yt-simple-endpoint style-scope ytd-guide-entry-renderer" aria-label="Login Required">
            <div style="margin-right: 12px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 20px; height: 20px; fill: white;">
                <g>
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>
                </g>
              </svg>
            </div>
            <span class="title style-scope ytd-guide-entry-renderer">LOGIN REQUIRED</span>
          </a>
        `;

        // Apply aggressive styling after creation
        const link = newGuideEntry.querySelector("#yt-manage-link");
        if (link) {
          // Force all the styles
          link.style.cssText = `
            background-color: #ff9800 !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            padding: 10px 16px !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin: 2px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          `;

          // Force text color and ensure it fits
          const title = link.querySelector(".title");
          if (title) {
            title.style.cssText = `
              color: white !important;
              font-weight: 500 !important;
              font-size: 14px !important;
              white-space: nowrap !important;
            `;
          }
        }

        // Add hover effect
        if (link) {
          link.addEventListener("mouseenter", () => {
            link.style.backgroundColor = "#f57c00";
          });
          link.addEventListener("mouseleave", () => {
            link.style.backgroundColor = "#ff9800";
          });
        }

        // Add click handler
        const manageLink = newGuideEntry.querySelector("#yt-manage-link");
        if (manageLink) {
          manageLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Just open extension popup for login - don't fade out yet
            chrome.runtime.sendMessage({ action: "openPopup" });
          });
        }

        // Add fade-in animation
        newGuideEntry.style.opacity = "0";
        newGuideEntry.style.transition = "opacity 0.3s ease-in";

        // Actually insert the button into the DOM - right after subscriptions
        container.insertBefore(newGuideEntry, subscriptionsEntry.nextSibling);

        // Trigger fade-in after insertion
        setTimeout(() => {
          newGuideEntry.style.opacity = "1";
        }, 10);

        logStatus("Login prompt created successfully", "info");
        return newGuideEntry;
      }
    }

    // If subscriptions button not found, retry with a shorter delay
    logStatus("Subscriptions button not found, retrying...", "warn");
    setTimeout(() => {
      const retrySubscriptionsLink = document.querySelector('a[href*="/feed/subscriptions"]');
      if (retrySubscriptionsLink) {
        const retrySubscriptionsEntry = retrySubscriptionsLink.closest("ytd-guide-entry-renderer");
        if (retrySubscriptionsEntry) {
          let container = retrySubscriptionsEntry.parentElement;
          
          // Create the same login prompt as above
          const newGuideEntry = document.createElement("ytd-guide-entry-renderer");
          newGuideEntry.id = "yt-manage-guide-entry";
          newGuideEntry.innerHTML = `
            <a id="yt-manage-link" href="#" class="yt-simple-endpoint style-scope ytd-guide-entry-renderer" aria-label="Login Required">
              <div style="margin-right: 12px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 20px; height: 20px; fill: white;">
                  <g>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path>
                  </g>
                </svg>
              </div>
              <span class="title style-scope ytd-guide-entry-renderer">LOGIN REQUIRED</span>
            </a>
          `;
          
          const link = newGuideEntry.querySelector("#yt-manage-link");
          if (link) {
            link.style.cssText = `
              background-color: #ff9800 !important;
              color: white !important;
              display: flex !important;
              align-items: center !important;
              padding: 10px 16px !important;
              text-decoration: none !important;
              border-radius: 10px !important;
              margin: 2px 0 !important;
              width: 100% !important;
              box-sizing: border-box !important;
            `;
            
            const title = link.querySelector(".title");
            if (title) {
              title.style.cssText = `
                color: white !important;
                font-weight: 500 !important;
                font-size: 14px !important;
                white-space: nowrap !important;
              `;
            }
            
            link.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              chrome.runtime.sendMessage({ action: "openPopup" });
            });
          }
          
          container.insertBefore(newGuideEntry, retrySubscriptionsEntry.nextSibling);
          logStatus("Login prompt created on retry", "info");
        }
      } else {
        logStatus("Failed to find Subscriptions button even on retry", "error");
      }
    }, 1000); // Retry after 1 second

    return null;
  }, 500);
}

// Make it globally available
window.createSidebarButton = createSidebarButton;
window.createLoginPrompt = createLoginPrompt;
