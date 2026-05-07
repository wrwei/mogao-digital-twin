/**
 * Accessibility utilities — focus trap + a Vue directive that wires it up.
 *
 * Used by the overlay primitives (DrawerPanel, ModalDialog, edit-modal,
 * ConfirmDialog) to keep keyboard navigation inside the overlay while it
 * is visible, restore focus to the previously-focused element when it
 * closes, and let Esc dismiss the overlay.
 *
 * Usage:
 *
 *   import { vFocusTrap } from '../utils/a11y.js';
 *
 *   // In a component definition:
 *   directives: { focusTrap: vFocusTrap },
 *
 *   // In its template:
 *   <div v-focus-trap="{ onEscape: () => $emit('close') }" ...>
 */

export const FOCUSABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]'
].join(', ');

/** Return all focusable descendants of `root`, in document order. */
export function focusables(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(el => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Trap focus inside `rootEl`. Returns a teardown function that, when
 * invoked, removes the listeners and restores focus to wherever it was
 * before the trap was installed.
 *
 * @param {HTMLElement} rootEl
 * @param {{ onEscape?: (e: KeyboardEvent) => void, autoFocus?: boolean }} opts
 */
export function trapFocus(rootEl, opts = {}) {
    if (!rootEl) return () => {};
    const previouslyFocused = document.activeElement;

    function handleKey(ev) {
        if (ev.key === 'Escape' && typeof opts.onEscape === 'function') {
            ev.stopPropagation();
            opts.onEscape(ev);
            return;
        }
        if (ev.key !== 'Tab') return;
        const f = focusables(rootEl);
        if (f.length === 0) { ev.preventDefault(); return; }
        const first = f[0];
        const last  = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
            last.focus(); ev.preventDefault();
        } else if (!ev.shiftKey && document.activeElement === last) {
            first.focus(); ev.preventDefault();
        }
    }

    rootEl.addEventListener('keydown', handleKey);

    if (opts.autoFocus !== false) {
        // Defer one tick so dynamically-created content (e.g. transitioned
        // overlays) is mounted before we look for focusable children.
        setTimeout(() => {
            const f = focusables(rootEl);
            if (f.length > 0) {
                f[0].focus();
            } else {
                // Fallback: focus the container itself so keyboard input is captured.
                rootEl.setAttribute('tabindex', '-1');
                rootEl.focus();
            }
        }, 0);
    }

    return function teardown() {
        rootEl.removeEventListener('keydown', handleKey);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            try { previouslyFocused.focus(); } catch (_) { /* element may have been removed */ }
        }
    };
}

/**
 * Vue 3 directive — `v-focus-trap` (or `v-focus-trap="{ onEscape }"`).
 *
 * Mount: installs the trap. Unmount: tears down + restores focus.
 * Pass an object with `onEscape` to handle Esc; otherwise Esc is ignored.
 */
export const vFocusTrap = {
    mounted(el, binding) {
        const opts = (binding && binding.value) || {};
        el.__a11yTrapTeardown__ = trapFocus(el, opts);
    },
    unmounted(el) {
        const teardown = el.__a11yTrapTeardown__;
        if (typeof teardown === 'function') teardown();
        delete el.__a11yTrapTeardown__;
    }
};
