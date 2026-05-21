/**
 * ModalDialog — focus-trapped modal overlay with a title, close button,
 * and a default slot for the body content.
 */
import { useI18n } from '../i18n.js';
import { vFocusTrap } from '../utils/a11y.js';

export default {
    name: 'ModalDialog',
    props: ['title', 'show', 'wide'],
    emits: ['close'],
    directives: { focusTrap: vFocusTrap },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div v-if="show" class="modal-overlay" @click.self="$emit('close')"
             v-focus-trap="{ onEscape: () => $emit('close') }"
             role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal" :style="wide ? 'min-width: 500px; max-width: 95vw; width: auto;' : 'min-width: 500px;'">
                <div class="modal-header">
                    <h3 id="modal-title" class="modal-title">{{ title }}</h3>
                    <button class="modal-close" @click="$emit('close')"
                            :aria-label="t('common.close') || 'Close'">&times;</button>
                </div>
                <div class="modal-body">
                    <slot></slot>
                </div>
            </div>
        </div>
    `
};
