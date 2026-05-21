/**
 * LoadingSpinner — full-overlay spinner with localised "Loading…" label.
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'LoadingSpinner',
    setup() {
        const { t } = useI18n();
        return { t };
    },
    template: `
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p style="margin-top: var(--spacing-md); color: var(--text-secondary);">{{ t('common.loading') }}</p>
        </div>
    `
};
