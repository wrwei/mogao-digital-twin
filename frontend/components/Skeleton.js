/**
 * Skeleton placeholder. Replaces the spinner that used to appear while
 * lists fetched: a row of shimmering placeholder cards conveys both
 * "loading" and the upcoming layout, so the page doesn't reflow when
 * data lands.
 *
 * variant: 'row'       — vertical stack (Statue / Mural / Painting /
 *                        Inscription lists)
 *          'grid-card' — responsive grid (CaveList project cards)
 * count:   how many placeholder items to render (default 4)
 */
export default {
    name: 'Skeleton',
    props: {
        variant: {
            type: String,
            default: 'row',
            validator: v => ['row', 'grid-card'].includes(v),
        },
        count: { type: Number, default: 4 },
    },
    template: `
        <div :class="['skeleton-stack', 'skeleton-stack--' + variant]"
             role="status" aria-busy="true" aria-live="polite">
            <div v-for="i in count" :key="i" class="skeleton-item">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-text"></div>
                <div class="skeleton-line skeleton-text-short"></div>
            </div>
        </div>
    `
};
