/**
 * i18n Language Resources
 * Auto-generated from mogao_dt.ecore metamodel
 * Multilingual support for the Mogao Digital Twin application
 */

// Import Vue Composition API functions from global Vue
const { ref } = Vue;

export const messages = {
    // ============================================
    // CHINESE (中文)
    // ============================================
    zh: {
        // Common UI
        common: {
            create: '创建',
            edit: '编辑',
            delete: '删除',
            save: '保存',
            cancel: '取消',
            close: '关闭',
            back: '返回',
            search: '搜索',
            filter: '筛选',
            filtered: '已筛选',
            refresh: '刷新',
            loading: '加载中...',
            noData: '暂无数据',
            noDescription: '无描述',
            confirm: '确认',
            yes: '是',
            no: '否',
            ok: '确定',
            error: '错误',
            success: '成功',
            warning: '警告',
            info: '信息',
            detail: '详情',
            selected: '已选择'
        },

        // Entity Names
        entities: {
            cave: '洞窟',
            caves: '洞窟列表',
            defect: '缺陷',
            defects: '缺陷列表',
            statue: '雕像',
            statues: '雕像列表',
            mural: '壁画',
            murals: '壁画列表',
            painting: '绘画',
            paintings: '绘画列表',
            inscription: '铭文',
            inscriptions: '铭文列表'
        },

        // Field Labels
        fields: {
            affectedArea: 'affectedArea',
            conservationStatus: '保护状态',
            content: 'content',
            coordinates: 'coordinates',
            creationPeriod: 'creationPeriod',
            defectType: '缺陷类型',
            depth: '深度',
            description: '描述',
            detectionDate: 'detectionDate',
            expression: 'expression',
            gid: '全局ID',
            height: '高度',
            inspectionNotes: 'inspectionNotes',
            label: 'label',
            language: '语言',
            lastInspectionDate: 'lastInspectionDate',
            material: '材质',
            name: '名称',
            period: 'period',
            pitch: 'pitch',
            reading: 'reading',
            reference: '资产引用',
            requiresImmediateAction: 'requiresImmediateAction',
            roll: 'roll',
            severity: '严重程度',
            style: 'style',
            subject: 'subject',
            technique: '技法',
            timestamp: '时间戳',
            treatmentHistory: 'treatmentHistory',
            unit: '单位',
            value: '数值',
            width: '宽度',
            x: 'X坐标',
            y: 'Y坐标',
            yaw: 'yaw',
            z: 'Z坐标'
        },

        // Actions
        actions: {
            createNew: '创建新{entity}',
            edit: '编辑{entity}',
            delete: '删除{entity}',
            viewDetail: '查看详情',
            deleteConfirm: '确认删除此{entity}吗？',
            saveSuccess: '{entity}保存成功',
            deleteSuccess: '{entity}删除成功',
            loadError: '加载{entity}失败',
            saveError: '保存{entity}失败',
            deleteError: '删除{entity}失败'
        },

        // Conservation Status
        conservationStatus: {
            excellent: '优秀',
            good: '良好',
            fair: '一般',
            poor: '较差',
            critical: '危急',
            unknown: '未知'
        },

        // Defect Types
        defectTypes: {
            cracking: '开裂',
            flaking: '剥落',
            blistering: '起泡',
            detachment: '脱离',
            materialLoss: '材料损失',
            disruption: '破坏',
            alveolization: '蜂窝状',
            saltEfflorescence: '盐析',
            colorAlteration: '变色',
            acidAttack: '酸侵蚀',
            paintLoss: '颜料损失',
            microbialGrowth: '微生物生长',
            blackSpots: '黑斑',
            lichenGrowth: '地衣生长',
            insectDamage: '虫害',
            waterSeepage: '渗水',
            sootDeposition: '烟尘沉积',
            erosion: '侵蚀',
            structuralCollapse: '结构坍塌',
            graffiti: '涂鸦'
        },

        // Severity Levels
        severity: {
            minor: '轻微',
            moderate: '中等',
            severe: '严重',
            critical: '危急'
        },

        // 3D Viewer
        viewer: {
            title: '三维模型',
            loading: '加载3D模型中...',
            error: '加载3D模型失败',
            noModel: '该展品无3D模型',
            selectItem: '请选择一个展品',
            autoRotate: '启用自动旋转',
            resetCamera: '重置视角',
            controls: '左键旋转 | 右键平移 | 滚轮缩放'
        },

        // Simulation
        simulation: {
            title: '环境模拟',
            start: '开始模拟',
            stop: '停止模拟',
            reset: '重置',
            advanced: '高级设置',
            temperature: '温度',
            humidity: '相对湿度',
            speed: '模拟速度',
            clickToConvert: '点击切换单位',
            status: {
                optimal: '最佳',
                tooCold: '过冷',
                cold: '偏冷',
                warm: '偏热',
                tooHot: '过热',
                tooDry: '过干',
                dry: '偏干',
                humid: '偏湿',
                tooHumid: '过湿'
            },
            info: {
                title: '信息',
                optimal: '最佳条件',
                warning: '警告',
                warningText: '极端条件可能损害文物',
                kelvin: '开尔文温度'
            }
        },

        // Detail View
        detail: {
            basicInfo: '基本信息',
            assetReference: '资产引用信息',
            environmentData: '环境数据',
            defects: '缺陷记录',
            modelPath: '3D模型路径',
            metadataPath: '元数据路径',
            texturePath: '纹理路径',
            type: '类型',
            affectedArea: '影响面积',
            urgent: '需要立即处理'
        },

        // Form Validation
        validation: {
            required: '{field}是必填项',
            invalid: '{field}格式不正确',
            tooShort: '{field}太短',
            tooLong: '{field}太长'
        }
    },

    // ============================================
    // ENGLISH
    // ============================================
    en: {
        // Common UI
        common: {
            create: 'Create',
            edit: 'Edit',
            delete: 'Delete',
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            back: 'Back',
            search: 'Search',
            filter: 'Filter',
            filtered: 'Filtered',
            refresh: 'Refresh',
            loading: 'Loading...',
            noData: 'No Data',
            noDescription: 'No description',
            confirm: 'Confirm',
            yes: 'Yes',
            no: 'No',
            ok: 'OK',
            error: 'Error',
            success: 'Success',
            warning: 'Warning',
            info: 'Information',
            detail: 'Details',
            selected: 'Selected'
        },

        // Entity Names
        entities: {
            cave: 'Cave',
            caves: 'Cave List',
            defect: 'Defect',
            defects: 'Defect List',
            statue: 'Statue',
            statues: 'Statue List',
            mural: 'Mural',
            murals: 'Mural List',
            painting: 'Painting',
            paintings: 'Painting List',
            inscription: 'Inscription',
            inscriptions: 'Inscription List'
        },

        // Field Labels
        fields: {
            affectedArea: 'Affected Area',
            conservationStatus: 'Conservation Status',
            content: 'Content',
            coordinates: 'coordinates',
            creationPeriod: 'Creation Period',
            defectType: 'Defect Type',
            depth: 'Depth',
            description: 'Description',
            detectionDate: 'Detection Date',
            expression: 'Expression',
            gid: 'Global ID',
            height: 'Height',
            inspectionNotes: 'Inspection Notes',
            label: 'Label',
            language: 'Language',
            lastInspectionDate: 'Last Inspection Date',
            material: 'Material',
            name: 'Name',
            period: 'Period',
            pitch: 'pitch',
            reading: 'Reading',
            reference: 'Asset Reference',
            requiresImmediateAction: 'Requires Immediate Action',
            roll: 'roll',
            severity: 'Severity',
            style: 'Style',
            subject: 'Subject',
            technique: 'Technique',
            timestamp: 'Timestamp',
            treatmentHistory: 'Treatment History',
            unit: 'Unit',
            value: 'Value',
            width: 'Width',
            x: 'X Coordinate',
            y: 'Y Coordinate',
            yaw: 'yaw',
            z: 'Z Coordinate'
        },

        // Actions
        actions: {
            createNew: 'Create New {entity}',
            edit: 'Edit {entity}',
            delete: 'Delete {entity}',
            viewDetail: 'View Details',
            deleteConfirm: 'Are you sure you want to delete this {entity}?',
            saveSuccess: '{entity} saved successfully',
            deleteSuccess: '{entity} deleted successfully',
            loadError: 'Failed to load {entity}',
            saveError: 'Failed to save {entity}',
            deleteError: 'Failed to delete {entity}'
        },

        // Conservation Status
        conservationStatus: {
            excellent: 'Excellent',
            good: 'Good',
            fair: 'Fair',
            poor: 'Poor',
            critical: 'Critical',
            unknown: 'Unknown'
        },

        // Defect Types
        defectTypes: {
            cracking: 'Cracking',
            flaking: 'Flaking',
            blistering: 'Blistering',
            detachment: 'Detachment',
            materialLoss: 'Material Loss',
            disruption: 'Disruption',
            alveolization: 'Alveolization',
            saltEfflorescence: 'Salt Efflorescence',
            colorAlteration: 'Color Alteration',
            acidAttack: 'Acid Attack',
            paintLoss: 'Paint Loss',
            microbialGrowth: 'Microbial Growth',
            blackSpots: 'Black Spots',
            lichenGrowth: 'Lichen Growth',
            insectDamage: 'Insect Damage',
            waterSeepage: 'Water Seepage',
            sootDeposition: 'Soot Deposition',
            erosion: 'Erosion',
            structuralCollapse: 'Structural Collapse',
            graffiti: 'Graffiti'
        },

        // Severity Levels
        severity: {
            minor: 'Minor',
            moderate: 'Moderate',
            severe: 'Severe',
            critical: 'Critical'
        },

        // 3D Viewer
        viewer: {
            title: '3D Model',
            loading: 'Loading 3D model...',
            error: 'Failed to load 3D model',
            noModel: 'No 3D model available for this item',
            selectItem: 'Select an item to view',
            autoRotate: 'Enable Auto-rotate',
            resetCamera: 'Reset Camera',
            controls: 'Left-click: Rotate | Right-click: Pan | Scroll: Zoom'
        },

        // Simulation
        simulation: {
            title: 'Environmental Simulation',
            start: 'Start Simulation',
            stop: 'Stop Simulation',
            reset: 'Reset',
            advanced: 'Advanced Settings',
            temperature: 'Temperature',
            humidity: 'Relative Humidity',
            speed: 'Simulation Speed',
            clickToConvert: 'Click to toggle unit',
            status: {
                optimal: 'Optimal',
                tooCold: 'Too Cold',
                cold: 'Cold',
                warm: 'Warm',
                tooHot: 'Too Hot',
                tooDry: 'Too Dry',
                dry: 'Dry',
                humid: 'Humid',
                tooHumid: 'Too Humid'
            },
            info: {
                title: 'Information',
                optimal: 'Optimal Conditions',
                warning: 'Warning',
                warningText: 'Extreme conditions may damage artifacts',
                kelvin: 'Kelvin Temperature'
            }
        },

        // Detail View
        detail: {
            basicInfo: 'Basic Information',
            assetReference: 'Asset Reference Information',
            environmentData: 'Environmental Data',
            defects: 'Defect Records',
            modelPath: '3D Model Path',
            metadataPath: 'Metadata Path',
            texturePath: 'Texture Path',
            type: 'Type',
            affectedArea: 'Affected Area',
            urgent: 'Requires Immediate Action'
        },

        // Form Validation
        validation: {
            required: '{field} is required',
            invalid: '{field} is invalid',
            tooShort: '{field} is too short',
            tooLong: '{field} is too long'
        }
    }
};

// Default language
export const defaultLocale = 'zh';

// Helper function to get translated text
export function t(key, locale = defaultLocale, params = {}) {
    const keys = key.split('.');
    let value = messages[locale];

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // Return key if translation not found
        }
    }

    // Replace parameters in the string
    if (typeof value === 'string' && params) {
        Object.keys(params).forEach(param => {
            value = value.replace(`{${param}}`, params[param]);
        });
    }

    return value || key;
}

// Composable for Vue components
export function useI18n() {
    const locale = ref(defaultLocale);

    const translate = (key, params) => t(key, locale.value, params);

    const setLocale = (newLocale) => {
        if (messages[newLocale]) {
            locale.value = newLocale;
            localStorage.setItem('locale', newLocale);
        }
    };

    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && messages[savedLocale]) {
        locale.value = savedLocale;
    }

    return {
        locale,
        t: translate,
        setLocale
    };
}
