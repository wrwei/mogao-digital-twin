/**
 * Toast stack — replaces the single inline ErrorMessage banner. Multiple
 * toasts stack instead of overwriting each other; each has its own
 * dismiss timer driven by the parent. Severity tokens drive the colour.
 */
import { useI18n } from '../i18n.js';

const TYPE_TO_LEVEL = {
    success: 'ok',
    warning: 'medium',
    error:   'critical',
    info:    'info',
};

const TYPE_TO_ICON = {
    success: '✅',
    warning: '⚠️',
    error:   '❌',
    info:    'ℹ️',
};

export default {
    name: 'ToastStack',
    props: {
        toasts: { type: Array, required: true },
    },
    emits: ['dismiss'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    methods: {
        levelFor(type) { return TYPE_TO_LEVEL[type] || 'info'; },
        iconFor(type)  { return TYPE_TO_ICON[type]  || 'ℹ️'; },
    },
    template: `
        <div class="toast-stack" role="region" aria-live="polite" aria-label="Notifications">
            <transition-group name="toast-slide" tag="div" class="toast-stack-inner">
                <div v-for="toast in toasts" :key="toast.id"
                     class="toast"
                     :data-level="levelFor(toast.type)"
                     role="status">
                    <span class="toast-icon" aria-hidden="true">{{ iconFor(toast.type) }}</span>
                    <span class="toast-message">{{ toast.message }}</span>
                    <button class="toast-dismiss" type="button"
                            @click="$emit('dismiss', toast.id)"
                            :aria-label="t('common.close') || 'Close'">&times;</button>
                </div>
            </transition-group>
        </div>
    `
};
