/**
 * Empty-state placeholder. Replaces the half-dozen near-duplicate
 * empty-state divs that lived inline across every list (📭 + "No Data"
 * + sometimes a button). One place to set typography, one place to
 * pin the call-to-action, one place to add an illustration later.
 *
 * Two common flavours are produced by the parent:
 *   - "no data yet"   — icon 📭/🏛️/etc., a CTA button via slot or
 *                       the action-label prop
 *   - "no search hit" — icon 🔍, no CTA (clearing the search is the
 *                       implicit action)
 *
 * The default slot lets callers drop in any custom action markup
 * (multiple buttons, secondary links). When omitted and action-label
 * is set, a single primary button is rendered instead.
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'EmptyState',
    props: {
        icon:        { type: String, default: '📭' },
        title:       { type: String, default: '' },
        description: { type: String, default: '' },
        actionLabel: { type: String, default: '' },
    },
    emits: ['action'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="empty-state" role="status">
            <div class="empty-state-icon" aria-hidden="true">{{ icon }}</div>
            <div class="empty-state-text">{{ title || t('common.noData') }}</div>
            <p v-if="description" class="empty-state-description">{{ description }}</p>
            <slot>
                <button v-if="actionLabel" type="button" class="btn btn-primary"
                        @click="$emit('action')">
                    {{ actionLabel }}
                </button>
            </slot>
        </div>
    `
};
