/**
 * DrawerPanel — focus-trapped right-side drawer with title, close button,
 * a `header-actions` named slot, and a default slot for the body.
 */
import { useI18n } from '../i18n.js';
import { vFocusTrap } from '../utils/a11y.js';

export default {
    name: 'DrawerPanel',
    props: ['show', 'title'],
    emits: ['close'],
    directives: { focusTrap: vFocusTrap },
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div v-if="show" class="drawer-overlay" @click.self="$emit('close')"
             v-focus-trap="{ onEscape: () => $emit('close') }"
             role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <div class="drawer drawer-right">
                <div class="drawer-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 id="drawer-title" style="margin: 0; flex: 1;">{{ title }}</h3>
                    <div class="drawer-header-actions" style="display: flex; align-items: center; gap: 8px;">
                        <slot name="header-actions"></slot>
                        <button class="drawer-close" @click="$emit('close')"
                                :aria-label="t('common.close') || 'Close'">&times;</button>
                    </div>
                </div>
                <div class="drawer-body">
                    <slot></slot>
                </div>
            </div>
        </div>
    `
};
