// Hash-based router. Pure JS, no dependency: the frontend is served as
// static files and the SPA mounts under #/<view>[/<gid>], so back/forward
// and refresh roundtrip without server-side rewrite.
//
// Format:
//   #/dashboard            -> { view: 'dashboard', gid: null }
//   #/caves                -> { view: 'caves',     gid: null }
//   #/caves/cave-001       -> { view: 'caves',     gid: 'cave-001' }
//   (empty / unknown view) -> { view: fallback,    gid: null }

export const ROUTABLE_VIEWS = [
    'dashboard',
    'caves', 'statues', 'murals', 'paintings', 'inscriptions',
    'sensors', 'maintenance', 'settings'
];

const DEFAULT_VIEW = 'dashboard';

export function parseHash(hash = window.location.hash) {
    const stripped = String(hash || '').replace(/^#\/?/, '');
    if (!stripped) return { view: DEFAULT_VIEW, gid: null };
    const [view, gid = null] = stripped.split('/');
    if (!ROUTABLE_VIEWS.includes(view)) return { view: DEFAULT_VIEW, gid: null };
    return { view, gid: gid || null };
}

export function buildHash(view, gid = null) {
    if (!ROUTABLE_VIEWS.includes(view)) view = DEFAULT_VIEW;
    return gid ? `#/${view}/${gid}` : `#/${view}`;
}

// Set the hash without producing a duplicate history entry when the target
// matches the current location. Returns true when the URL actually changed.
export function setHash(view, gid = null) {
    const next = buildHash(view, gid);
    if (window.location.hash === next) return false;
    window.location.hash = next;
    return true;
}

// Subscribe to hash changes. Handler receives parseHash() of the new URL.
// Returns an unsubscribe function.
export function subscribeRoute(handler) {
    const wrapped = () => handler(parseHash());
    window.addEventListener('hashchange', wrapped);
    return () => window.removeEventListener('hashchange', wrapped);
}
