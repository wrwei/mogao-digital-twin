// Global keyboard shortcuts. Two flavours:
//   single-key      e.g. "/"  → focus search,  "?" → cheatsheet
//   leader pair     e.g. "g c" → go to caves,  "g d" → dashboard
//
// Skips when the user is typing (INPUT/TEXTAREA/SELECT/contenteditable)
// so shortcuts don't hijack text entry. Skips when a modal/drawer/confirm
// is open so the focus-trap directive can keep focus inside the dialog.

const SINGLE_KEYS  = new Map(); // key -> handler
const LEADER_PAIRS = new Map(); // leaderKey -> Map<followupKey, handler>

const LEADER_TIMEOUT_MS = 1200;
let leaderState = null; // { key, timer }

function isTextInputTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
}

function isOverlayOpen() {
    return !!document.querySelector(
        '.modal-overlay, .modal-backdrop, .confirm-overlay, .cheatsheet-overlay'
    );
}

export function registerSingleKey(key, handler) {
    SINGLE_KEYS.set(key, handler);
}

export function registerLeaderPair(leader, followup, handler) {
    if (!LEADER_PAIRS.has(leader)) LEADER_PAIRS.set(leader, new Map());
    LEADER_PAIRS.get(leader).set(followup, handler);
}

function clearLeader() {
    if (leaderState) {
        clearTimeout(leaderState.timer);
        leaderState = null;
    }
}

function onKeyDown(e) {
    // Modifier chords belong to the browser/IDE; never consume them.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTextInputTarget(e.target)) return;

    // The cheatsheet itself counts as an overlay, but we want '?' / Esc
    // to still work while it's open. The cheatsheet listens for Esc via
    // its own focus-trap directive; '?' single-key is shadowed while
    // open, which is fine — pressing it again does nothing.
    if (isOverlayOpen() && !e.key.match(/^(Escape|\?)$/)) return;

    if (leaderState) {
        const followups = LEADER_PAIRS.get(leaderState.key);
        const handler = followups && followups.get(e.key);
        clearLeader();
        if (handler) {
            e.preventDefault();
            handler();
        }
        return;
    }

    const single = SINGLE_KEYS.get(e.key);
    if (single) {
        e.preventDefault();
        single();
        return;
    }

    if (LEADER_PAIRS.has(e.key)) {
        e.preventDefault();
        leaderState = {
            key: e.key,
            timer: setTimeout(clearLeader, LEADER_TIMEOUT_MS),
        };
    }
}

let installed = false;

export function installShortcuts() {
    if (installed) return () => {};
    document.addEventListener('keydown', onKeyDown);
    installed = true;
    return () => {
        document.removeEventListener('keydown', onKeyDown);
        clearLeader();
        installed = false;
    };
}
