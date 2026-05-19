/**
 * ConfirmDialog — themed, keyboardable replacement for window.confirm().
 *
 * The dialog is mounted once at the application root. Components anywhere
 * in the tree call `inject('$confirm')` to obtain a function that returns
 * a Promise<boolean>:
 *
 *   const $confirm = inject('$confirm');
 *   const ok = await $confirm({
 *       message: 'Delete this defect?',
 *       danger:  true,                    // styles the OK button red
 *       confirmLabel: 'Delete',           // optional override
 *       cancelLabel:  'Cancel'            // optional override
 *   });
 *   if (!ok) return;
 *
 * Why not native confirm():
 *   - native confirm cannot be styled or themed
 *   - it cannot trap focus or be Esc-dismissed in a way the rest of the
 *     app can detect
 *   - on some Windows locales the wrapping is awkward, especially for
 *     longer Chinese strings
 *
 * Implementation:
 *   - Single state object stored on the root app instance.
 *   - The function exposed via provide() resolves the queued Promise on
 *     either Confirm or Cancel.
 *   - Accessibility: role="dialog" + aria-modal + focus-trap directive
 *     + Esc handler (cancel path) + aria-labelledby on the message.
 */
import { useI18n } from '../i18n.js';
import { vFocusTrap } from '../utils/a11y.js';

export default {
    name: 'ConfirmDialog',
    directives: { focusTrap: vFocusTrap },
    props: {
        // Reactive state object passed in from the root app.
        // Shape: { open, message, confirmLabel, cancelLabel, danger, _resolve }
        state: { type: Object, required: true }
    },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    methods: {
        confirm() {
            if (this.state._resolve) this.state._resolve(true);
            this.state.open = false;
        },
        cancel() {
            if (this.state._resolve) this.state._resolve(false);
            this.state.open = false;
        }
    },
    template: `
        <transition name="confirm-fade">
            <div v-if="state.open"
                 class="confirm-overlay"
                 @click.self="cancel"
                 v-focus-trap="{ onEscape: cancel }"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="confirm-message">
                <div class="confirm-dialog" :class="{ 'confirm-dialog--danger': state.danger }">
                    <p id="confirm-message" class="confirm-message">{{ state.message }}</p>
                    <div class="confirm-actions">
                        <button class="btn btn-sm" @click="cancel">
                            {{ state.cancelLabel || t('common.cancel') }}
                        </button>
                        <button class="btn btn-sm"
                                :class="state.danger ? 'btn-danger' : 'btn-primary'"
                                @click="confirm">
                            {{ state.confirmLabel || t('common.confirm') || 'OK' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    `
};
