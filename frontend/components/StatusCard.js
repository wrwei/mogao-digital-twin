/**
 * StatusCard — coloured-accent summary tile.
 *
 * Used for tier-count tiles at the top of admin panels (MaintenanceQueue,
 * SensorDashboard) and per-model state tiles in PredictionPanel. Replaces
 * inline-styled `<div class="stat-card" :style="...">` patterns scattered
 * across those components.
 *
 * Props:
 *   level     'critical' | 'high' | 'medium' | 'low' | 'ok' | 'neutral' | 'info'
 *   title     Short uppercase header (e.g. "Critical", "Active")
 *   value     Big numeric or short label
 *   icon      Optional emoji prefix for the value
 *   meta      Optional small sub-label below the value
 *   active    Highlights the card with a coloured outline
 *   clickable Adds hover affordance and emits 'click'
 */
export default {
    name: 'StatusCard',
    props: {
        level:     { type: String, default: 'neutral',
                     validator: v => ['critical','high','medium','low','ok','neutral','info'].includes(v) },
        title:     { type: String, required: true },
        value:     { type: [String, Number], required: true },
        icon:      { type: String, default: '' },
        meta:      { type: String, default: '' },
        active:    { type: Boolean, default: false },
        clickable: { type: Boolean, default: false }
    },
    emits: ['click'],
    methods: {
        onClick(ev) { if (this.clickable) this.$emit('click', ev); },
        onKey(ev) { if (this.clickable && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); this.$emit('click', ev); } }
    },
    template: `
        <div class="status-card"
             :data-level="level"
             :class="{ 'status-card--active': active, 'status-card--clickable': clickable }"
             :tabindex="clickable ? 0 : -1"
             :role="clickable ? 'button' : null"
             @click="onClick"
             @keydown="onKey">
            <div class="status-card-title">{{ title }}</div>
            <div class="status-card-value">
                <span v-if="icon" class="status-card-icon" aria-hidden="true">{{ icon }}</span>
                <span>{{ value }}</span>
            </div>
            <div v-if="meta" class="status-card-meta">{{ meta }}</div>
        </div>
    `
};
