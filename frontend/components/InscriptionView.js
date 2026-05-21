/**
 * InscriptionView — entity view for Inscription. Form drawer, detail
 * drawer, bulk-delete support, URL-driven drill-in, CRUD wiring.
 */
import { useI18n } from '../i18n.js';
import { useEntity } from '../composables/useEntity.js';
import { setHash } from '../utils/router.js';
import InscriptionList from './InscriptionList.js';
import InscriptionForm from './InscriptionForm.js';
import InscriptionCard from './InscriptionCard.js';
import InscriptionDetailView from './InscriptionDetailView.js';
import ModalDialog from './ModalDialog.js';
import DrawerPanel from './DrawerPanel.js';

export default {
    name: 'InscriptionView',
    components: {
        InscriptionList,
        InscriptionForm,
        InscriptionCard,
        InscriptionDetailView,
        ModalDialog,
        DrawerPanel,
    },
    props: {
        initialGid: { type: String, default: null }
    },
    inject: ['$confirm'],
    setup() {
        const composable = useEntity('Inscription', 'inscriptions', 'inscriptions');
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
                message: this.t('actions.deleteConfirm', { entity: this.t('entities.inscription') }),
                danger: true
            });
            if (!ok) return;
            try {
                await this.deleteInscription(item.gid);
                this.$emit('show-message', this.t('actions.deleteSuccess', { entity: this.t('entities.inscription') }), 'success');
            } catch (err) {
                this.$emit('show-message', this.t('actions.deleteError', { entity: this.t('entities.inscription') }) + ': ' + err.message, 'error');
            }
        },
        async handleBulkDelete(items) {
            if (!items || items.length === 0) return;
            const ok = await this.$confirm({
                message: this.t('actions.bulkDeleteConfirm', { count: items.length, entity: this.t('entities.inscription') }),
                danger: true
            });
            if (!ok) return;
            let okCount = 0, failCount = 0;
            for (const item of items) {
                try { await this.deleteInscription(item.gid); okCount++; }
                catch (e) { failCount++; }
            }
            if (failCount === 0) {
                this.$emit('show-message',
                    this.t('actions.deleteSuccess', { entity: this.t('entities.inscription') }) + ` (${okCount})`, 'success');
            } else {
                this.$emit('show-message',
                    this.t('actions.bulkDeletePartialError', { ok: okCount, fail: failCount }), 'error');
            }
            await this.fetchInscriptions();
        },
        async handleFormSubmit() {
            this.$emit('show-message', this.t('actions.saveSuccess', { entity: this.t('entities.inscription') }), 'success');
            this.showForm = false;
            await this.fetchInscriptions();
        },
        handleFormCancel() {
            this.showForm = false;
            this.editingItem = null;
        },
        handleSelect(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.selectInscription(item);
            this.$emit('item-selected', item);
        },
        handleViewDetail(item) {
            this.selectedGid = item.gid;
            this.selectedItem = item;
            this.detailItem = item;
            this.showDetail = true;
            setHash('inscriptions', item.gid);
        },
        handleCloseDetail() {
            this.showDetail = false;
            this.detailItem = null;
            setHash('inscriptions');
        },
        _syncFromUrl() {
            const gid = this.initialGid;
            if (!gid) {
                if (this.showDetail) this.handleCloseDetail();
                return;
            }
            if (this.showDetail && this.selectedGid === gid) return;
            const list = this.inscriptions || [];
            const item = list.find(i => i.gid === gid);
            if (item) this.handleViewDetail(item);
        }
    },
    watch: {
        initialGid:   { immediate: true, handler() { this._syncFromUrl(); } },
        inscriptions: { handler() { this._syncFromUrl(); } }
    },
    mounted() {
        this.fetchInscriptions();
    },
    template: `
        <div class="entity-view">
            <drawer-panel :show="showForm" :title="editMode ? t('common.edit') + ' ' + t('entities.inscription') : t('actions.createNew', { entity: t('entities.inscription') })" @close="handleFormCancel">
                <inscription-form
                    :inscription="editingItem"
                    :mode="editMode ? 'edit' : 'create'"
                    @created="handleFormSubmit"
                    @updated="handleFormSubmit"
                    @cancel="handleFormCancel"
                    @error="(msg) => $emit('show-message', msg, 'error')"
                ></inscription-form>            </drawer-panel>

            <drawer-panel :show="showDetail" :title="t('common.detail') + ' - ' + (detailItem ? detailItem.name || detailItem.title || detailItem.gid : '')" @close="handleCloseDetail">
                <template #header-actions>
                    <button class="btn btn-sm btn-primary" @click="handleEdit(detailItem)" style="margin-right: 8px;">
                        {{ t('common.edit') }}
                    </button>
                </template>
                <inscription-detail-view
                    v-if="detailItem"
                    :inscription="detailItem"
                ></inscription-detail-view>            </drawer-panel>

            <inscription-list
                :inscriptions="inscriptions"
                :loading="loading"
                :selected-gid="selectedGid"
                @select="handleSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @create="handleCreate"
                @view-detail="handleViewDetail"
                @bulk-delete="handleBulkDelete"
            ></inscription-list>        </div>
    `
};
