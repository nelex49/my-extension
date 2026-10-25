# Pro multi-channel moves

Use the development plan page to select Pro. Open Manage and choose Select channels. Check individual channels or Select all. With a channel search active, Select all results adds the matching channels to the selection. Previously checked channels remain selected when the search changes; the selected count includes them. Clear selection removes all checks.

Move selected opens the existing destination picker. Moves save all selected assignments in one operation. A failed save keeps the original assignments and selection for retry. Success clears selection and keeps the source view open. Cancel exits selection mode. Escape closes the picker first, then exits selection mode. Changing the parent/subfolder clears selection. Selection is never persisted.

Free and Expired plans keep individual moves; Free and Expired show Select channels with a Pro badge and a themed upgrade/renew explanation; Pro shows Select channels without the badge and enters selection directly. Purchases remain unavailable; the upgrade/renew action explains this without changing the plan. Existing channel menus and disabled Unsubscribe are retained.

## Manual Chrome check

- Test Pro in both themes, including narrow windows and long channel names.
- Select two channels, filter the list, select all results and check the total.
- Move to another subfolder; confirm one success message and source view retained.
- Reopen Manage and refresh YouTube to verify saved assignments.
- Navigate while selected and confirm selection clears.
- Use Tab/Space for checkboxes, Escape/Cancel and the destination picker.
- Switch to Free/Expired while Manage is open; selection must disappear.

Automated Manage tests cover filtering, scope reset, atomic save, failure/retry, stale selections, duplicate selections, overlapping-save rejection and Pro enforcement.

Selection mode disables individual Move and Remove for every row. Cancel restores them. Move selected is disabled until at least one channel is checked and then becomes the primary blue action. Select channels has a subtle tinted background, border, hover and keyboard focus state in both themes.
