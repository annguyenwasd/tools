# Plan: Comprehensive Test Suite for Retro & Poker

## Context

The app has grown to include multiple real-time collaborative features (Retro + Poker) with complex business logic (host management, voting, presence, CSV import/export) but **zero tests**. Several known bugs exist including race conditions in host election, non-atomic vote toggling, and joinedAt resets breaking auto-election. This test suite will catch regressions, document known edge cases, and enable confident refactoring.

---

## Phase 1: Test Infrastructure Setup

### Install dependencies
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Modify `vite.config.js`
Add Vitest config block:
```js
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.js',
}
```

### Modify `package.json`
Add scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

### New file: `src/test/setup.js`
Import `@testing-library/jest-dom`

### New file: `src/test/firebase-mock.js`
Shared Firebase mock with:
- `ref`, `onValue` (stores callbacks in Map, returns unsubscribe), `set`, `update`, `remove`, `push`, `get`, `onDisconnect`, `connectDatabaseEmulator` — all `vi.fn()`
- `simulateSnapshot(path, data)` helper to trigger `onValue` callbacks in tests
- `db` sentinel export

---

## Phase 2: Unit Tests — Pure Utilities (~44 tests)

### `src/utils/__tests__/csvParser.test.js` (15 tests)
File under test: `src/utils/csvParser.js`

- Standard Rally CSV with all 4 columns
- CSV with only Name column (minimum viable)
- Throws when Name column missing
- Empty file / headers-only → `[]`
- Quoted fields with commas, escaped quotes
- **BUG DOC**: Quoted fields with newlines break parser (splits on `\n` first)
- Case-insensitive headers
- Aggressive whitespace stripping (known issue #9)
- Skips rows with empty name
- CRLF and CR line endings
- Extra columns ignored
- Field value trimming

### `src/utils/__tests__/pokerExport.test.js` (11 tests)
File under test: `src/utils/pokerExport.js`

- CSV: Rally-compatible header, CRLF endings, comma/quote escaping, sorted by order
- Markdown: valid table, em-dash for missing values
- JSON: correct shape (formattedId, name, description, finalEstimate), sorted
- All formats: handle empty stories without crash
- Uses `finalEstimate` not raw votes

### `src/utils/__tests__/export.test.js` (9 tests)
File under test: `src/utils/export.js`

- JSON: includes meta + cards
- Markdown: groups by category, sorts by votes desc, defaults to 0
- Confluence: wiki markup syntax (`h1.`, `||`)
- Empty cards / empty categories handled

### `src/utils/__tests__/pokerStats.test.js` (9 tests)
Extract `computeStats` from `src/components/poker/ResultPanel.jsx` into `src/utils/pokerStats.js`

- Average of numeric votes, ignores `?` and non-numeric
- All non-numeric → average is `null`
- Most common vote (frequency analysis)
- Consensus detection (all identical)
- Empty votes object
- T-shirt sizes (non-numeric)
- Unknown member fallback to "Unknown"

---

## Phase 3: Hook Tests — Business Logic (~50 tests)

All hooks mocked via `vi.mock('firebase/database')` and `vi.mock('../firebase')`.

### `src/hooks/__tests__/useSession.test.js` (15 tests)
File under test: `src/hooks/useSession.js`

- Initial state: loading=true, meta=null
- Firebase data → loading=false, meta populated
- `ended` detection: meta.ended=true, or data→null after load
- `isHost` computed correctly
- `onlineMembers` filtering
- Phase: `advancePhase` (write→vote, noop on export), `goToPhase`
- `transferHost`: updates hostId + clears localStorage
- `endSession`: sets ended + schedules remove after 5s
- **EDGE #1**: Host reclaim + auto-elect fire simultaneously (documents race)
- **EDGE #3**: joinedAt reset causes wrong auto-election winner
- Auto-elect deduplication: only earliest-joinedAt member writes

### `src/hooks/__tests__/useCards.test.js` (10 tests)
File under test: `src/hooks/useCards.js`

- Subscribes to cards + votes refs
- `addCard`: pushes trimmed content, rejects empty
- `deleteCard`: removes card + votes (cascade)
- **EDGE #2**: `toggleVote` non-atomic race (get→set not transactional)
- `getVoteCount`, `hasVoted`, `getUserVoteCount`

### `src/hooks/__tests__/usePresence.test.js` (6 tests)
File under test: `src/hooks/usePresence.js`

- Sets online=true on mount
- Registers onDisconnect handler
- Sets online=false on unmount
- **EDGE #3**: joinedAt resets on every mount (documents bug)
- Guards: no Firebase calls when params missing
- Custom collection ('poker') changes ref path

### `src/hooks/poker/__tests__/usePokerSession.test.js` (8 tests)
File under test: `src/hooks/poker/usePokerSession.js`

- Uses `poker/` database path
- `selectStory`, `revealVotes`, `restartVote`
- `transferHost` clears poker localStorage key
- `endSession` same pattern as retro
- `createPokerSession` sets meta + member

### `src/hooks/poker/__tests__/usePokerVoting.test.js` (11 tests)
File under test: `src/hooks/poker/usePokerVoting.js`

- Stories + votes subscriptions
- `addStory` with order based on existing count
- **EDGE #6**: Concurrent addStory → duplicate order values (stale closure)
- **EDGE #8**: importStories key collision with same Date.now()
- `importStories` order continuation
- `setFinalEstimate` updates story + resets currentStoryId
- `castVote`, `clearVotes`, `deleteStory` (cascade)

---

## Phase 4: Component Tests (~46 tests)

### `src/components/poker/__tests__/VotingCards.test.jsx` (7 tests)
- Renders correct cards for each set (modified_fibonacci, fibonacci, tshirt)
- Falls back to modified_fibonacci for unknown set
- Highlights selected card
- Calls onSelect on click, not when disabled

### `src/components/poker/__tests__/ResultPanel.test.jsx` (10 tests)
- Shows average, most common, consensus badge
- Host sees estimate input + confirm/re-vote buttons
- Non-host sees no controls
- Confirm disabled when empty
- **EDGE #14**: Estimate accepts any string (no card-set validation)

### `src/components/__tests__/HostTransferDialog.test.jsx` (5 tests)
- Filters: online only, excludes current user
- Empty state warning
- Confirm disabled until selection
- Calls onTransfer with selected uid
- Resets selection on close

### `src/components/poker/__tests__/StoryList.test.jsx` (9 tests)
- Sorted by order
- Selected story highlighted
- Host can select/delete, non-host cannot
- **EDGE #10**: Delete has no confirmation
- Shows estimate chip on completed stories

### `src/components/poker/__tests__/CSVImportDialog.test.jsx` (5 tests)
- Error display on invalid CSV
- Preview table after parse
- Import button disabled with no stories
- Calls onImport correctly
- Resets on close

### `src/components/__tests__/PhaseNav.test.jsx` (5 tests)
- Host: clickable steps + back/next
- Non-host: disabled steps, no nav buttons
- Back disabled on first, next disabled on last

### `src/components/__tests__/MemberList.test.jsx` (5 tests)
- Sorted by joinedAt
- Shows "(you)", "host" chip, online count
- **EDGE #12**: Offline members shown with reduced opacity

---

## Phase 5: Edge Case Regression Suite (~16 tests)

Dedicated test files in `src/__tests__/edge-cases/`:

| File | Tests | Known Issue |
|------|-------|-------------|
| `host-race.test.js` | 2 | #1: Two browsers both claim host |
| `vote-race.test.js` | 2 | #2: Non-atomic toggleVote |
| `presence-joinedAt.test.js` | 2 | #3: joinedAt resets break election |
| `session-validation.test.js` | 2 | #4: Join non-existent session creates orphan data |
| `discussed-state.test.js` | 1 | #5: Discussed state lost on refresh |
| `story-order.test.js` | 1 | #6: Concurrent adds → duplicate order |
| `import-key-collision.test.js` | 1 | #8: Same-ms imports collide |
| `csv-header-normalization.test.js` | 1 | #9: Aggressive whitespace strip |
| `prompt-cancel.test.js` | 2 | #11: Silent redirect on cancel |

---

## Implementation Order (priority)

1. **Infrastructure** — vitest config, firebase mock, setup.js
2. **Utility unit tests** — csvParser, exports (highest ROI, pure functions)
3. **Hook tests** — useCards, usePresence, useSession (core business logic)
4. **Poker hook tests** — usePokerSession, usePokerVoting
5. **Component tests** — ResultPanel, VotingCards, StoryList, HostTransferDialog
6. **Edge case regression suite** — documents and locks down known bugs

**Total: ~156 tests across 24 test files**

---

## Verification

```bash
npm run test:run        # all tests pass
npm run test -- --coverage  # check coverage report
npm run build           # ensure no build regression
```

Target: 80%+ coverage on hooks and utilities, 60%+ on components.
