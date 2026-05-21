/**
 * PaintingView — entity view for Painting. Form drawer, detail drawer,
 * bulk-delete support, URL-driven drill-in, CRUD wiring.
 */
import { useI18n } from '../i18n.js';
import { useEntity } from '../composables/useEntity.js';
import { setHash } from '../utils/router.js';
import PaintingList from './PaintingList.js';
import PaintingForm from './PaintingForm.js';
import PaintingCard from './PaintingCard.js';
import PaintingDetailView from './PaintingDetailView.js';
import ModalDialog from './ModalDialog.js';
import DrawerPanel from './DrawerPanel.js';

export default {
    name: 'PaintingView',
    components: {
        PaintingList,
        PaintingForm,
        PaintingCard,
        PaintingDetailView,
        ModalDialog,
        DrawerPanel,
    },
    props: {
        initialGid: { type: String, default: null }
    },
    inject: ['$confirm'],
    setup() {
        const composable = useEntity('Painting', 'paintings', 'paintings');
        const { t } = useI18n();
        return { ...composable, t };
    },
    data() {
        return {
            showForm: false,
            editMode: false,
            editingItem: null,
            showDetail: false,
            detailItem: null,
            selectedGid: null,
            selectedItem: null,
        };
    },
    methods: {
        handleCreate() {
            this.editMode = false;
            this.editingItem = null;
            this.showDetail = false;
            this.showForm = true;
        },
        handleEdit(item) {
            this.editMode = true;
            this.editingItem = item;
            this.showDetail = false;
            this.showForm = true;
        },
        async handleDelete(item) {
            const ok = await this.$confirm({
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.painting') }),
                danger: true
            });
            if (!ok) return;
            try {
                await this.deletePainting(item.gid);
                this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.painting') }), 'success');
            } catch (err) {
                this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.painting') }) + ': ' + err.message, 'error');
            }
        },
        async handleBulkDelete(items) {
            if (!items || items.length === 0) return;
            const ok = await this.$confirm({
                message: this.t('actions.bulkDeleteConfirm', { count: items.length, entity: this.t('entities.painting') }),
                danger: true
            });
            if (!ok) return;
            let okCount = 0, failCount = 0;
            for (const item of items) {
                try { await this.deletePainting(item.gid); okCount++; }
                catch (e) { failCount++; }
            }
            if (failCount === 0) {
                this.$emit('show-message',
                    this.t('actions.deleteSuccess', { entity: this.t('entities.painting') }) + ` (${okCount})`, 'success');
            } else {
                this.$emit('show-message',
                    this.t('actions.bulkDeletePartialError', { ok: okCount, fail: failCount }), 'error');
            }
            await this.fetchPaintings();
        },
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.painting') }), 'success');
            this.showForm = false;
            await this.fetchPaintings();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectPainting(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.detailItem = item;
            this.showDetail = true;
            setHash('paintings', item.gid);
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
            setHash('paintings');
        },
        _syncFromUrl() {
            const gid = this.initialGid;
            if (!gid) {
                if (this.showDetail) this.handleCloseDetail();
                return;
            }
            if (this.showDetail && this.selectedGid === gid) return;
            const list = this.paintings || [];
            const item = list.find(p => p.gid === gid);
            if (item) this.handleViewDetail(item);
        }
    },
    watch: {
        initialGid: { immediate: true, handler() { this._syncFromUrl(); } },
        paintings:  { handler() { this._syncFromUrl(); } }
    },
    mounted() {
        this.fetchPaintings();
    },
    template: `
        <div class="entity-view">
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.painting') : t('actions.createNew', { entity: t('entities.painting') })" @close="handleFormCancel">
                <painting-form
                    :painting="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></painting-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <painting-detail-view
                    v-if="detailItem"
                    :painting="detailItem"
                ></painting-detail-view>            </drawer-panel>

            <painting-list
                :paintings="paintings"
                :loading="loading"
                :selected-gid="selectedGid"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
                @bulk-delete="handleBulkDelete"
            ></painting-list>        </div>
    `
};
