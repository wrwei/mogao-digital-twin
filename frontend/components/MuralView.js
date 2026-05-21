/**
 * MuralView — entity view for Mural. Form drawer, detail drawer,
 * bulk-delete support, URL-driven drill-in, CRUD wiring.
 */
import { useI18n } from '../i18n.js';
import { useEntity } from '../composables/useEntity.js';
import { setHash } from '../utils/router.js';
import MuralList from './MuralList.js';
import MuralForm from './MuralForm.js';
import MuralCard from './MuralCard.js';
import MuralDetailView from './MuralDetailView.js';
import ModalDialog from './ModalDialog.js';
import DrawerPanel from './DrawerPanel.js';

export default {
    name: 'MuralView',
    components: {
        MuralList,
        MuralForm,
        MuralCard,
        MuralDetailView,
        ModalDialog,
        DrawerPanel,
    },
    props: {
        initialGid: { type: String, default: null }
    },
    inject: ['$confirm'],
    setup() {
        const composable = useEntity('Mural', 'murals', 'murals');
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
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.mural') }),
                danger: true
            });
            if (!ok) return;
            try {
                await this.deleteMural(item.gid);
                this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.mural') }), 'success');
            } catch (err) {
                this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.mural') }) + ': ' + err.message, 'error');
            }
        },
        async handleBulkDelete(items) {
            if (!items || items.length === 0) return;
            const ok = await this.$confirm({
                message: this.t('actions.bulkDeleteConfirm', { count: items.length, entity: this.t('entities.mural') }),
                danger: true
            });
            if (!ok) return;
            let okCount = 0, failCount = 0;
            for (const item of items) {
                try { await this.deleteMural(item.gid); okCount++; }
                catch (e) { failCount++; }
            }
            if (failCount === 0) {
                this.$emit('show-message',
                    this.t('actions.deleteSuccess', { entity: this.t('entities.mural') }) + ` (${okCount})`, 'success');
            } else {
                this.$emit('show-message',
                    this.t('actions.bulkDeletePartialError', { ok: okCount, fail: failCount }), 'error');
            }
            await this.fetchMurals();
        },
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.mural') }), 'success');
            this.showForm = false;
            await this.fetchMurals();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectMural(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.detailItem = item;
            this.showDetail = true;
            setHash('murals', item.gid);
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
            setHash('murals');
        },
        _syncFromUrl() {
            const gid = this.initialGid;
            if (!gid) {
                if (this.showDetail) this.handleCloseDetail();
                return;
            }
            if (this.showDetail && this.selectedGid === gid) return;
            const list = this.murals || [];
            const item = list.find(m => m.gid === gid);
            if (item) this.handleViewDetail(item);
        }
    },
    watch: {
        initialGid: { immediate: true, handler() { this._syncFromUrl(); } },
        murals:     { handler() { this._syncFromUrl(); } }
    },
    mounted() {
        this.fetchMurals();
    },
    template: `
        <div class="entity-view">
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.mural') : t('actions.createNew', { entity: t('entities.mural') })" @close="handleFormCancel">
                <mural-form
                    :mural="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></mural-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <mural-detail-view
                    v-if="detailItem"
                    :mural="detailItem"
                ></mural-detail-view>            </drawer-panel>

            <mural-list
                :murals="murals"
                :loading="loading"
                :selected-gid="selectedGid"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
                @bulk-delete="handleBulkDelete"
            ></mural-list>        </div>
    `
};
