/**
 * Modal that lists every keyboard shortcut. Opened with '?'.
 * Closed with Esc, the × button, or by clicking the overlay.
 */
import { useI18n } from '../i18n.js';
import { vFocusTrap } from '../utils/a11y.js';

export default {
    name: 'ShortcutsCheatsheet',
    directives: { focusTrap: vFocusTrap },
    props: {
        open:    { type: Boolean, default: false },
        isAdmin: { type: Boolean, default: false },
    },
    emits: ['close'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    computed: {
        groups() {
            const navRows = [
                { keys: ['g', 'd'], labelKey: 'shortcuts.goDashboard' },
                { keys: ['g', 'c'], labelKey: 'shortcuts.goCaves' },
                { keys: ['g', 's'], labelKey: 'shortcuts.goStatues' },
                { keys: ['g', 'm'], labelKey: 'shortcuts.goMurals' },
                { keys: ['g', 'p'], labelKey: 'shortcuts.goPaintings' },
                { keys: ['g', 'i'], labelKey: 'shortcuts.goInscriptions' },
            ];
            if (this.isAdmin) {
                navRows.push(
                    { keys: ['g', 'e'], labelKey: 'shortcuts.goSensors' },
                    { keys: ['g', 'q'], labelKey: 'shortcuts.goMaintenance' }
                );
            }
            return [
                { titleKey: 'shortcuts.navigation', rows: navRows },
                {
                    titleKey: 'shortcuts.actions',
                    rows: [
                        { keys: ['/'],   labelKey: 'shortcuts.focusSearch' },
                        { keys: ['?'],   labelKey: 'shortcuts.openCheatsheet' },
                        { keys: ['Esc'], labelKey: 'shortcuts.closeDialog' },
                    ],
                },
            ];
        },
    },
    template: `
        <transition name="cheatsheet-fade">
            <div v-if="open" class="cheatsheet-overlay" @click.self="$emit('close')"
                 v-focus-trap="{ onEscape: () => $emit('close') }"
                 role="dialog" aria-modal="true" aria-labelledby="cheatsheet-title">
                <div class="cheatsheet">
                    <div class="cheatsheet-header">
                        <h3 id="cheatsheet-title">{{ t('shortcuts.title') }}</h3>
                        <button class="cheatsheet-close" type="button"
                                @click="$emit('close')"
                                :aria-label="t('common.close')">&times;</button>
                    </div>
                    <div class="cheatsheet-body">
                        <div v-for="group in groups" :key="group.titleKey" class="cheatsheet-group">
                            <h4>{{ t(group.titleKey) }}</h4>
                            <dl>
                                <div v-for="row in group.rows" :key="row.keys.join(' ')" class="cheatsheet-row">
                                    <dt>
                                        <template v-for="(k, i) in row.keys" :key="i">
                                            <kbd>{{ k }}</kbd><span v-if="i < row.keys.length - 1" class="cheatsheet-sep">{{ t('shortcuts.then') }}</span>
                                        </template>
                                    </dt>
                                    <dd>{{ t(row.labelKey) }}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    `
};
