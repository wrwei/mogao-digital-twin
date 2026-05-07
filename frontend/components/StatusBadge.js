/**
 * StatusBadge — single source of truth for tier/severity-coloured pills.
 *
 * Replaces the five hand-rolled red→green palettes that were previously
 * defined inline in MaintenanceQueue.js, SensorDashboard.js,
 * PredictionPanel.js, DefectsPanel.js, and CaveList.js. All visuals are
 * driven by the design tokens in css/severity.css; consumers select a
 * level from the seven-tier scale and pick a variant.
 *
 * Levels (high → low):
 *   critical / high / medium / low / ok / neutral / info
 *
 * Variants:
 *   solid    Filled badge, typically for "Critical / Online / Active".
 *   soft     Tinted background with dark text — quieter than solid (default).
 *   dot      Coloured dot + plain text — for inline status indicators.
 *
 * Usage:
 *   <status-badge level="critical" label="Critical"></status-badge>
 *   <status-badge level="ok" variant="solid" label="Online"></status-badge>
 *   <status-badge level="medium" variant="dot" label="Warning"></status-badge>
 */
export default {
    name: 'StatusBadge',
    props: {
        level:   { type: String, default: 'neutral',
                   validator: v => ['critical','high','medium','low','ok','neutral','info'].includes(v) },
        variant: { type: String, default: 'soft',
                   validator: v => ['solid','soft','dot'].includes(v) },
        label:   { type: String, required: true },
        icon:    { type: String, default: '' }
    },
    template: `
        <span class="status-badge" :data-level="level" :data-variant="variant" role="status">
            <span v-if="variant === 'dot'" class="status-badge-dot" aria-hidden="true"></span>
            <span v-if="icon" class="status-badge-icon" aria-hidden="true">{{ icon }}</span>
            <span class="status-badge-label">{{ label }}</span>
        </span>
    `
};
