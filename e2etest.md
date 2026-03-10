# E2E Test Errors

## Host Tests

### ERROR 1: HTML nesting violation — `<div>` inside `<p>` in Poker StoryList sidebar

**Console Error:**
```
In HTML, <div> cannot be a descendant of <p>.
This will cause a hydration error.

<p> cannot contain a nested <div>.
See this log for the ancestor stack trace.
```

**Error Stack (React component tree):**
```
<ListItemButton> -> <ListItemText secondary={<Chip>}> ->
  <Typography variant="body2" (renders as <p>)> ->
    <Chip (renders as <div>)>
```

The `secondary` prop of MUI `ListItemText` renders inside a `<p>` tag by default (via `Typography variant="body2"`). The `Chip` component renders as a `<div>`, which is invalid HTML nesting (`<div>` inside `<p>`).

**File:** `src/components/poker/StoryList.jsx`, lines 61-69

**Steps to reproduce:**
1. Navigate to http://localhost:5173/poker
2. Create a poker session with any name
3. Add a story (click "Add Story", enter a name)
4. Select the story, cast a vote, reveal, and confirm estimate
5. The story now shows a `finalEstimate` Chip in the sidebar
6. Open browser console — two React warnings appear about invalid HTML nesting

---

### ERROR 2: Poker — Confirming estimate deselects the current story

**Observed behavior:**
After the host clicks "Confirm Estimate" on a revealed story, the main content area reverts to "Select a story from the sidebar to begin" instead of staying on the current story. The user must re-click the story in the sidebar to continue.

**Expected behavior:**
After confirming an estimate, the story should remain selected so the host can see the confirmed result or move to the next story intentionally.

**Steps to reproduce:**
1. Navigate to http://localhost:5173/poker
2. Create a poker session
3. Add a story via "Add Story"
4. Select the story from the sidebar
5. Cast a vote (click any voting card, e.g., "5")
6. Click "Reveal Votes"
7. Click "Confirm Estimate"
8. The main area now shows "Select a story from the sidebar to begin" — the story is deselected

**File:** `src/hooks/poker/usePokerVoting.js`, line 58 — `setFinalEstimate` explicitly writes `{ currentStoryId: null, revealed: false }` to Firebase meta after saving the estimate. This intentionally deselects the story. However, it forces the host to re-click the story to verify the estimate was saved, and provides no visual confirmation that the estimate was successfully recorded before the story disappears from view.

---

## Attendant-1: Retro Tests

**Test Date:** 2026-03-10
**Module:** Retro (`/retro` and `/retro/session/{sessionId}`)
**Browser:** Chromium (headless, Playwright 1.58.2)

### Tests Executed and Results

#### 1. Retro Join Flow
- **Join button disabled when fields empty:** PASS -- button has `disabled={!joinName.trim() || !joinCode.trim()}` and correctly stays disabled with empty or whitespace-only input.
- **Join button disabled with only name filled:** PASS -- still disabled until both fields have non-whitespace content.
- **Join with non-existent session code:** PASS -- navigates to `/retro/session/{code}` which shows "Session not found / This session does not exist or has expired." with a "GO HOME" button.
- **Join with valid full session ID:** PASS -- participant enters session, sees member list, cards, and phase stepper.

#### 2. Direct URL Entry
- **Non-existent session (`/retro/session/test-session-id-12345`):** PASS -- prompt() appears for name, then shows "Session not found" page.
- **Dismiss prompt (cancel):** PASS -- redirects to `/retro` landing page.
- **Accept prompt with empty string:** PASS -- redirects to `/retro` landing page.

#### 3. Retro Participant Experience
- **Participant cannot see host controls:** PASS -- participant does NOT see "ASSIGN HOST", "END SESSION", "BACK", or "NEXT: VOTE" buttons. Host sees all of these.
- **Phase steps disabled for participant:** PASS -- Discuss/Export steps are disabled (not clickable) for participants when in Write/Vote phase.
- **Participant can add cards in write phase:** PASS -- textarea accepts input, card appears after pressing Enter.
- **Participant can vote in vote phase:** PASS -- clicking vote button on a card decrements remaining votes (3 -> 2) and increments card vote count (0 -> 1).

#### 4. Member List
- **Member appears with correct name:** PASS -- both host and participant names visible in member list for all users.
- **Online indicator:** PASS -- green dot shown next to online members.
- **Host badge:** PASS -- "host" chip/badge displayed next to host name.

#### 5. Card Operations (as participant)
- **Add a card:** PASS -- card appears in correct category column.
- **Cards from other users hidden in write phase:** PASS -- shows "N hidden cards" instead of card content (write phase anonymity).
- **Vote on a card:** PASS -- vote count increments, remaining votes decrements.
- **Delete own card:** PASS -- delete icon visible only on participant's own cards; clicking it removes the card.
- **Cannot delete other user's card:** PASS -- no delete icon shown on cards authored by other users; during write phase, other users' cards are hidden entirely.

#### 6. Edge Cases
- **Page refresh:** PASS -- session restores correctly, URL preserved, user identity maintained from localStorage, no prompt on refresh.
- **Session ended by host while participant active:** PASS -- participant sees "Session ended / The host has ended this session." with "GO HOME" button. Host redirected to landing page. End session requires MUI confirmation dialog ("End session? ... CANCEL / END SESSION").
- **Unicode name (`测试用户🎉`):** PASS -- name displayed correctly in member list with proper avatar initial.
- **Very long name (500 chars):** PASS -- truncated with ellipsis in member list sidebar, no horizontal overflow.
- **Leave button for participant:** PASS -- clicking "LEAVE" returns participant to landing page.
- **Assign Host dialog:** PASS -- shows "Transfer Host Role" dialog listing other members with CANCEL/CONFIRM buttons.
- **Copy full ID:** PASS -- clipboard receives the full UUID session ID (verified match).
- **Join with uppercase session ID:** PASS -- `handleJoin` calls `.toLowerCase()` on session code, which correctly normalizes UUIDs.

### No Errors Found

All tested Retro join/participant flows completed without JavaScript errors (`pageerror` events), console errors, or unexpected behavior. Zero bugs were identified during this test run.

---

## Attendant-2: Poker Tests

**Test Date:** 2026-03-10
**Module:** Poker (`/poker` and `/poker/session/{sessionId}`)
**Browser:** Chromium (headless, Playwright 1.58.2)

### Tests Executed and Results

#### 1. Poker Join Flow
- **Join button disabled when both fields empty:** PASS -- `Join Session` button is disabled with empty name and session code.
- **Join button disabled with only name filled:** PASS -- still disabled until session code is also provided.
- **Join button disabled with only code filled:** PASS -- still disabled until name is also provided.
- **Join button enabled with both fields filled:** PASS -- button becomes clickable.
- **Join with non-existent session code:** PASS -- navigates to `/poker/session/{code}` which shows "Session not found / This session does not exist or has expired." with a "Go Home" button. Session code is lowercased in the URL.

#### 2. Direct URL Entry
- **Non-existent session (`/poker/session/fake-session-12345`):** PASS -- `prompt()` appears asking "Enter your name to join this session:", then shows "Session not found" page. No JavaScript errors.
- **With pre-set localStorage user joining non-existent session:** PASS -- "Session not found" page displayed, no crashes.

#### 3. Poker Participant Experience
- **Participant cannot see "Add Story" button:** PASS -- button is conditionally rendered only for `isHost` (code: `{isHost && (<Button>Add Story</Button>)}`).
- **Participant cannot see "Import CSV" button:** PASS -- hidden for non-host.
- **Participant cannot see "End Session" button:** PASS -- hidden for non-host.
- **Participant cannot see "Assign Host" button:** PASS -- hidden for non-host.
- **Participant cannot see delete (trash) icons on stories:** PASS -- delete `IconButton` is conditionally rendered only for `isHost`.
- **Participant cannot see "Reveal Votes" button:** PASS -- hidden for non-host.
- **Participant CAN see stories in sidebar:** PASS -- all stories visible with correct names.
- **Participant CAN see voting cards when story is selected:** PASS -- all 12 modified fibonacci cards displayed (0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?).
- **Participant sees "Waiting for the host to select a story..." when no story is active:** PASS.
- **Participant CAN vote on a selected story:** PASS -- clicking a card selects it (blue border highlight).
- **Participant CAN change vote:** PASS -- clicking a different card updates selection.
- **Participant sees results after host reveals:** PASS -- individual votes, Average, and Most Common are displayed.
- **Participant does NOT see "Confirm Estimate" or "Re-vote" buttons after reveal:** PASS -- only host sees these controls.
- **Participant sees estimate chip on completed stories:** PASS -- green "5" chip appears below Story One after estimate is confirmed.

#### 4. Voting Flow
- **As host: add a story via prompt(), select it:** PASS -- story appears in sidebar, clicking selects it.
- **As participant: cast a vote (card "5"):** PASS -- card gets blue border and elevation.
- **As host: reveal votes:** PASS -- "Reveal Votes" button becomes enabled after votes cast; clicking reveals individual votes with avatars, Average, and Most Common stats.
- **As host: confirm estimate:** PASS -- "Final estimate" input pre-filled with Most Common value; "Confirm Estimate" saves it and story gets green estimate chip in sidebar. (Note: story deselects after confirm -- see existing ERROR 2.)
- **As host: re-vote flow:** PASS -- "Re-vote" button clears votes and re-shows voting cards for both host and participant.

#### 5. Story List (as participant)
- **Stories visible and sorted by order:** PASS -- stories appear in add order.
- **Participant cannot select stories:** PASS -- clicking stories is a no-op for non-host (code: `onClick={() => isHost && onSelectStory(storyId)}`).
- **Participant cannot delete stories:** PASS -- no delete icons rendered for non-host.
- **Estimate chips appear on completed stories:** PASS -- green outlined chip with estimate value visible.

#### 6. Edge Cases
- **Card set display (modified_fibonacci):** PASS -- correct 12 values: `["0","0.5","1","2","3","5","8","13","20","40","100","?"]`.
- **Vote change:** PASS -- selecting a different card updates the vote without errors.
- **No story selected state:** PASS -- shows "Select a story from the sidebar to begin" for host, "Waiting for the host to select a story..." for participant.
- **Refresh during voting:** PASS -- session state persists after participant page reload; user identity maintained from localStorage; no re-prompt for name.
- **Export dialog for participant:** PASS -- participant can click the Export (download) icon button; "Export Estimates" dialog opens showing all stories in a table with ID, Name, Estimate columns and CSV/Markdown/JSON download buttons.
- **Very long story names:** PASS -- truncated with ellipsis ("A very long story name th...") in sidebar via `Typography noWrap`; full name visible in export dialog.
- **Unicode characters in story names:** PASS -- "Unicode: cafe\u0301 e\u0301e\u0300e\u0302 u\u0308o\u0308a\u0308" displayed correctly in sidebar and export.
- **Empty story name (empty prompt):** PASS -- correctly rejected; `handleAddStory` checks `if (!name?.trim()) return;` and does not add a story.
- **Multiple rapid votes:** PASS -- no crashes or errors when rapidly clicking different cards.
- **Console warning: MUI Grid deprecated `item` prop:** Observed but non-breaking. Message: "MUI Grid: The `item` prop has been removed and is no longer necessary."

### Errors Already Documented

The following errors were also observed during Attendant-2 testing but are already documented above:

- **ERROR 1 (HTML nesting `<div>` inside `<p>`):** Confirmed -- React warnings appear in console when a story has a `finalEstimate` Chip rendered inside `ListItemText secondary` prop (which renders as `<p>`). The Chip renders as `<div>`, causing invalid HTML nesting.
- **ERROR 2 (Confirm estimate deselects story):** Confirmed -- after clicking "Confirm Estimate", the main area reverts to "Select a story from the sidebar to begin."

### No New Errors Found

All tested Poker join/participant flows completed without JavaScript `pageerror` events or unexpected behavior. The two pre-existing errors (ERROR 1 and ERROR 2) were confirmed but no new bugs were identified during this test run.
