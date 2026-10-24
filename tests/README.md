# Regression tests

These scripts test the real application files in the project root and `src`. There should be no copied application tree or nested tests directory here.

Run these eleven suites from the extension project folder in Bash:

```bash
node tests/dialogs.cjs
node tests/manage.cjs
node tests/retrieval.cjs
node tests/startup.cjs
node tests/backup.cjs
node tests/backup-notice.cjs
node tests/folder-plans.cjs
node tests/plan-testing.cjs
node tests/account-setups.cjs
node tests/view-preferences.cjs
node tests/theme.cjs
```

| File | Coverage |
| --- | --- |
| dialogs.cjs | Shared create/edit dialogs, creation prompts, save failures, assignment mutations and cleanup |
| manage.cjs | Manage rendering, search, navigation, channel moves/removal and notification timing |
| retrieval.cjs | Worker retrieval, pagination, refresh, account ownership and sign-in/out |
| startup.cjs | Manifest-loaded startup, sidebar, Manage, refresh, shared dialogs and live plan changes |
| backup.cjs | Backup validation, safety downloads, restore and failure handling |
| backup-notice.cjs | Notice display durations, fade, dismissal and timer cleanup |
| folder-plans.cjs | Free/Pro/expired limits, oversized recovery, data preservation and creation after reduction |
| plan-testing.cjs | Separate development options controls and storage failures |
| account-setups.cjs | Migration, invalid/conflicting state, account isolation, atomic saves/restores, rollback and restart |
| view-preferences.cjs | Preference validation, owner isolation, reload, serialized writes and failure recovery; startup also covers real view restoration |
| theme.cjs | Dark default/fallback preservation, stored choice, cross-tab updates, failed saves and folder/plan isolation; startup covers Theme dialog |
| popup-auth.cjs | Exported helper suite invoked automatically by retrieval.cjs; not a standalone entry point |

Tests use Node's built-in modules with simulated DOM and Chrome APIs. No package installation is required. They do not replace manual Chrome layout, OAuth, downloads and persistence checks. See `../development/README.md` for the folder-plan manual checklist.

Startup also covers the centred Remove confirmation (Cancel/Escape/focus, failed save/retry, duplicate-save guard, stale target, listener cleanup and unchanged YouTube subscriptions), and the static Move illustration.

Manage/startup regressions also exercise the optional subfolder-search toggle, focus, filtering, clear/close and Escape. Removal reassurance names the channel explicitly.
