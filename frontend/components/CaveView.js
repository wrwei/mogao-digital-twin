/**
 * CaveView — entity view for Cave. Manages the create/edit form drawer,
 * detail drawer, selected GID, URL-driven drill-in, and CRUD wiring.
 */
import { useI18n } from '../i18n.js';
import { useEntity } from '../composables/useEntity.js';
import { setHash } from '../utils/router.js';
import CaveList from './CaveList.js';
import CaveForm from './CaveForm.js';
import CaveCard from './CaveCard.js';
import CaveDetailView from './CaveDetailView.js';
import ModalDialog from './ModalDialog.js';
import DrawerPanel from './DrawerPanel.js';

export default {
    name: 'CaveView',
    components: {
        CaveList,
        CaveForm,
        CaveCard,
        CaveDetailView,
        ModalDialog,
        DrawerPanel,
    },
    props: {
        pendingDrillIn: { type: Object, default: null },
        initialGid:     { type: String, default: null }
    },
    emits: ['show-message', 'item-selected', 'drill-in-consumed'],
    inject: ['$confirm'],
    setup() {
        const composable = useEntity('Cave', 'caves', 'caves');
        const { t } = useI18n();
        return {
            ...composable,
            t,
        };
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
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.cave') }),
                danger: true
            });
            if (!ok) return;
            try {
                await this.deleteCave(item.gid);
                this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.cave') }), 'success');
            } catch (err) {
                this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.cave') }) + ': ' + err.message, 'error');
            }
        },
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.cave') }), 'success');
            this.showForm = false;
            await this.fetchCaves();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectCave(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.detailItem = item;
            this.showDetail = true;
            setHash('caves', item.gid);
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
            setHash('caves');
        },
        _syncFromUrl() {
            const gid = this.initialGid;
            if (!gid) {
                if (this.showDetail) this.handleCloseDetail();
                return;
            }
            if (this.showDetail && this.selectedGid === gid) return;
            const list = this.caves || [];
            const item = list.find(c => c.gid === gid);
            if (item) this.handleViewDetail(item);
        }
    },
    watch: {
        initialGid: { immediate: true, handler() { this._syncFromUrl(); } },
        caves:      { handler() { this._syncFromUrl(); } }
    },
    mounted() {
        this.fetchCaves();
    },
    template: `
        <div class="entity-view">
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.cave') : t('actions.createNew', { entity: t('entities.cave') })" @close="handleFormCancel">
                <cave-form
                    :cave="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></cave-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <cave-detail-view
                    v-if="detailItem"
                    :cave="detailItem"
                ></cave-detail-view>            </drawer-panel>

            <cave-list
                :caves="caves"
                :loading="loading"
                :selected-gid="selectedGid"
                :pending-drill-in="pendingDrillIn"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
                @drill-in-consumed="$emit('drill-in-consumed')"
            ></cave-list>        </div>
    `
};
