# Current cleanup checkpoint

The user confirmed Free/Pro/expired manual testing works in Chrome. The tests directory is now cleaned: old copied application files, tests/src and tests/tests were removed. It contains the eight current suite entry points, popup-auth.cjs (used by retrieval), and a test-specific README. Application files are unchanged from premium-folders-stage1.zip.

Apply this complete replacement on premium-folders. Delete the existing local tests directory before copying the replacement tests directory; an ordinary overwrite does not remove files omitted from a ZIP. Preserve the project's actual src and Git metadata. No branch operation, commit or push performed.

All eight suites must pass after cleanup. See tests/README.md for commands. Folder-plan testing instructions remain in development/README.md. The earlier "manual testing required" statements below are superseded by the user's acceptance of Free/Pro/expired checks; existing tests remain simulations of Chrome/DOM APIs.

---

# Folder plans handover - premium-folders

Current implementation builds on the accepted and user-tested Refresh fix, preserving the move-notice placement, four-item tools menu, account protection, original development OAuth configuration, backup/restore and safety-copy rules.

## Current section

- Free: provisionally four parents and three children per parent; no subscription-count limit.
- Pro: unlimited folder counts.
- Expired: Free creation rules. All existing content remains usable, editable, movable and deletable. Block all new creation while any count exceeds Free; resume where there is room once counts fit Free.
- Full oversized restore is allowed and does not restore an entitlement or test plan. Current owner checks and confirmed safety download stay in place.
- Shared creation forms and creation services both use the central policy, including a recheck before saving an already-open form.
- A themed upgrade/renew prompt explains the limit and offers Pro details. It explicitly says purchases are not available yet. No billing/licensing has been implemented.

## Organisation

`src/plans/FolderPlan.js`: limits, policy and explicitly development-only test-state resolution.
`src/plans/FolderCreationGate.js`: bridges policy results to UI.
`src/components/PlanDialogs/FolderLimitDialog.js`: limit dialog and read-only Pro details.
`development/plan-testing.*`: standalone Extension options page for Free/Pro/expired simulation.

Existing FolderService, form controls and App receive small integration changes. Payment, other premium features and cross-tab save protection remain outside scope.

## Testing and next action

See `development/README.md` for the manual test checklist and commands. Reload the existing development extension, then YouTube. In Chrome extension Details -> Extension options, choose Test Free, Test Pro or Test expired Pro. The state persists and open YouTube tabs update immediately. It does not alter folders and is excluded from backups.

All eight automated suites must pass before delivery: dialogs, manage, retrieval, startup, backup, backup-notice, folder-plans and plan-testing. They simulate DOM and Chrome APIs; live Chrome visual/installation testing is still required.

This is a development build. `CONFIG.DEVELOPMENT_PLAN_TESTING` is true so the user can simulate plan states; default is Free. It is not a production entitlement system. Before release, replace simulated resolution with the agreed licensing flow, disable the flag, and remove the development options entry/page. With the flag off, stored test Pro is ignored.

Target branch: `premium-folders`, created by the user from their pushed/tested `ui-redesign` checkpoint `6c35020`. This workspace contains source archives, not the user's Git repository; no branch switch, commit, push or merge has been performed here. No changes to main or ui-redesign are authorised. Deliver a complete replacement archive for local testing, then wait for acceptance before commit/push or multi-account work.

`PROJECT-BACKLOG.md` is the authoritative current decision record, including provisional allowance/price and deferred features.
