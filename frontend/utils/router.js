// Hash-based router. Pure JS, no dependency: the frontend is served as
// static files and the SPA mounts under #/<view>[/<gid>][?k=v&...], so
// back/forward, refresh and shareable links work without server-side
// rewrite.
//
// Format:
//   #/dashboard               -> { view: 'dashboard', gid: null, params: {} }
//   #/caves                   -> { view: 'caves',     gid: null, params: {} }
//   #/caves/cave-001          -> { view: 'caves',     gid: 'cave-001', params: {} }
//   #/caves?q=cave-001        -> { view: 'caves',     gid: null, params: { q: 'cave-001' } }
//   (empty / unknown view)    -> { view: fallback,    gid: null, params: {} }

export const ROUTABLE_VIEWS = [
    'dashboard',
    'caves', 'statues', 'murals', 'paintings', 'inscriptions',
    'sensors', 'maintenance', 'settings'
];

const DEFAULT_VIEW = 'dashboard';
const EMPTY = Object.freeze({ view: DEFAULT_VIEW, gid: null, params: {} });

function parseQuery(qs) {
    const out = {};
    if (!qs) return out;
    for (const part of qs.split('&')) {
        if (!part) continue;
        const eq = part.indexOf('=');
        const key = eq === -1 ? part : part.slice(0, eq);
        const val = eq === -1 ? '' : part.slice(eq + 1);
        out[decodeURIComponent(key)] = decodeURIComponent(val);
    }
    return out;
}

function buildQuery(params) {
    const entries = Object.entries(params || {})
        .filter(([, v]) => v !== null && v !== undefined && v !== '');
    if (!entries.length) return '';
    return '?' + entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
}

export function parseHash(hash = window.location.hash) {
    const stripped = String(hash || '').replace(/^#\/?/, '');
    if (!stripped) return { ...EMPTY };
    const qIdx = stripped.indexOf('?');
    const path  = qIdx === -1 ? stripped : stripped.slice(0, qIdx);
    const query = qIdx === -1 ? ''       : stripped.slice(qIdx + 1);
    const [view, gid = null] = path.split('/');
    if (!ROUTABLE_VIEWS.includes(view)) return { ...EMPTY };
    return { view, gid: gid || null, params: parseQuery(query) };
}

export function buildHash(view, gid = null, params = {}) {
    if (!ROUTABLE_VIEWS.includes(view)) view = DEFAULT_VIEW;
    const path = gid ? `#/${view}/${gid}` : `#/${view}`;
    return path + buildQuery(params);
}

// Push a new hash. Returns true when the URL actually changed.
export function setHash(view, gid = null, params = {}) {
    const next = buildHash(view, gid, params);
    if (window.location.hash === next) return false;
    window.location.hash = next;
    return true;
}

// Update query params on the *current* view without producing a history
// entry — pass null/undefined/'' to remove a key. Use this for live-typed
// inputs (e.g. search) where every keystroke shouldn't add a back-button
// step. replaceState does NOT fire hashchange, so subscribers don't see
// these updates (intended — the writer already knows the new state).
export function replaceHashParams(updates) {
    const cur = parseHash();
    const merged = { ...cur.params, ...updates };
    for (const k of Object.keys(merged)) {
        if (merged[k] === null || merged[k] === undefined || merged[k] === '') {
            delete merged[k];
        }
    }
    const next = buildHash(cur.view, cur.gid, merged);
    if (window.location.hash === next) return;
    // Preserve scroll/title when only the search filter changes.
    history.replaceState(history.state, '', next);
}

// Subscribe to hash changes. Handler receives parseHash() of the new URL.
// Returns an unsubscribe function. Note: replaceHashParams does NOT fire
// hashchange, so live-typing in a search box doesn't notify subscribers.
export function subscribeRoute(handler) {
    const wrapped = () => handler(parseHash());
    window.addEventListener('hashchange', wrapped);
    return () => window.removeEventListener('hashchange', wrapped);
}
