/**
 * Snapshots Panel — periodic camera frames for the current artefact.
 *
 * Displays a reverse-chronological strip of thumbnails. Click to enlarge
 * in a lightbox. Admins can delete. No ingestion controls — cameras push
 * via /snapshots/ingest (sensor-key authenticated).
 */
import { useI18n } from '../i18n.js';

export default {
    name: 'SnapshotsPanel',
    props: {
        entity:  { type: Object, default: null },
        isAdmin: { type: Boolean, default: false }
    },
    emits: ['busy-changed'],
    inject: ['$confirm'],
    setup() {
        const { t } = useI18n();
        return { t };
    },
    data() {
        return {
            snapshots: [],
            loading: false,
            error: null,
            lightbox: null         // currently-enlarged snapshot, or null
        };
    },
    computed: {
        artifactGid() { return this.entity && this.entity.gid; }
    },
    watch: {
        artifactGid(newVal) {
            this.snapshots = [];
            this.lightbox = null;
            if (newVal) this.refresh();
        }
    },
    mounted() {
        if (this.artifactGid) this.refresh();
    },
    methods: {
        async refresh() {
            if (!this.artifactGid) return;
            this.loading = true;
            this.error = null;
            this.$emit('busy-changed', true);
            try {
                const { data } = await window.api.snapshots.listForArtefact(this.artifactGid);
                this.snapshots = data;
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            } finally {
                this.loading = false;
                this.$emit('busy-changed', false);
            }
        },
        imageUrl(gid) { return window.api.snapshots.imageUrl(gid); },
        openLightbox(snap) { this.lightbox = snap; },
        closeLightbox() { this.lightbox = null; },
        formatDate(iso) {
            try { return new Date(iso).toLocaleString(); } catch (_) { return iso; }
        },
        async confirmDelete(snap) {
            const ok = await this.$confirm({
                message: this.t('snapshots.deleteConfirm') || 'Delete this snapshot?',
                danger: true
            });
            if (!ok) return;
            try {
                await window.api.snapshots.remove(snap.gid);
                this.snapshots = this.snapshots.filter(s => s.gid !== snap.gid);
                if (this.lightbox && this.lightbox.gid === snap.gid) this.lightbox = null;
            } catch (err) {
                this.error = err.response?.data?.error || err.message;
            }
        }
    },
    template: `
        <div class="snapshots-panel" style="padding: 16px 20px; background: white; border-radius: 12px; border: 2px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                <h3 style="margin: 0; font-size: 15px; font-weight: 600;">
                    📷 {{ t('snapshots.title') || 'Snapshots' }}
                </h3>
                <button class="btn-icon" @click="refresh" :disabled="loading"
                        :title="t('snapshots.refresh') || 'Refresh'"
                        style="background: transparent; border: 1px solid #d0d0d0; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer;">
                    ↻
                </button>
            </div>

            <div v-if="loading" style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 12px;">
                {{ t('snapshots.loading') || 'Loading…' }}
            </div>

            <div v-else-if="error" style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #b91c1c; font-size: 12px;">
                {{ error }}
            </div>

            <div v-else-if="snapshots.length === 0" style="padding: 16px; text-align: center; color: var(--text-secondary); font-size: 12px; font-style: italic;">
                {{ t('snapshots.empty') || 'No snapshots have been ingested for this artefact yet. Cameras push frames to /snapshots/ingest with their sensor key.' }}
            </div>

            <div v-else style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
                <div v-for="snap in snapshots" :key="snap.gid"
                     style="position: relative; cursor: pointer; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; background: #f5f3f0;"
                     @click="openLightbox(snap)">
                    <img :src="imageUrl(snap.gid)" :alt="snap.gid" loading="lazy"
                         style="width: 100%; height: 100px; object-fit: cover; display: block;" />
                    <div style="padding: 4px 6px; font-size: 10px; color: var(--text-secondary); background: white;">
                        {{ formatDate(snap.capturedAt) }}
                    </div>
                    <button v-if="isAdmin" @click.stop="confirmDelete(snap)"
                            :title="t('snapshots.delete') || 'Delete'"
                            style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 4px; width: 22px; height: 22px; cursor: pointer; font-size: 12px;">
                        ×
                    </button>
                </div>
            </div>

            <!-- Lightbox -->
            <div v-if="lightbox"
                 @click="closeLightbox"
                 style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 40px;">
                <div style="max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;">
                    <img :src="imageUrl(lightbox.gid)" :alt="lightbox.gid"
                         style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 6px;" />
                    <div style="margin-top: 12px; color: white; font-size: 13px;">
                        {{ formatDate(lightbox.capturedAt) }}
                        <span v-if="lightbox.width && lightbox.height" style="opacity: 0.7;">
                            · {{ lightbox.width }}×{{ lightbox.height }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `
};
