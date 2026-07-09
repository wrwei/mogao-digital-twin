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
            select: '请选择...',
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

        // Empty-state messages (shared by all list views)
        empty: {
            noEntityTitle: '暂无记录',
            noEntityHint:  '点击下方按钮，添加第一个{entity}',
            noResultsTitle: '未找到匹配项',
            noResultsHint:  '尝试调整搜索关键词或清除筛选',
        },

        // Keyboard shortcuts cheatsheet
        shortcuts: {
            title: '键盘快捷键',
            navigation: '导航',
            actions: '操作',
            then: '然后',
            goDashboard: '跳转到仪表盘',
            goCaves: '跳转到洞窟',
            goStatues: '跳转到雕像',
            goMurals: '跳转到壁画',
            goPaintings: '跳转到绘画',
            goInscriptions: '跳转到铭文',
            goSensors: '跳转到传感器',
            goMaintenance: '跳转到维护队列',
            focusSearch: '聚焦搜索框',
            openCheatsheet: '打开快捷键说明',
            closeDialog: '关闭对话框',
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

        // Navigation
        nav: {
            dashboard: '仪表盘',
            heritage: '文物资产',
            sensors: '传感器',
            settings: '设置',
            backendOnline: '后端在线',
            backendOffline: '后端离线'
        },

        // Sensor Dashboard
        sensorDashboard: {
            title: '传感器管理',
            total: '总计',
            online: '在线',
            warning: '警告',
            offline: '离线',
            inactive: '已停用',
            new: '新建（无数据）',
            unknown: '未知',
            samples: '样本总数',
            search: '按名称、型号、ID或洞窟搜索传感器…',
            clearFilter: '清除筛选',
            kindAll: '全部',
            kindTemperature: '温度',
            kindHumidity: '湿度',
            kindCamera: '摄像头',
            tabFleet: '设备清单',
            tabEmulator: '数据实验室',
            registerSensor: '+ 注册传感器',
            cancel: '取消',
            refresh: '↻ 刷新',
            colStatus: '状态',
            colName: '名称',
            colModel: '型号',
            colCave: '洞窟',
            colSamples: '样本数',
            colLastSeen: '最近数据',
            colActions: '操作',
            history: '历史',
            historyTitle: '查看该传感器的历史数据',
            key: '🔑 密钥',
            keyTitle: '查看 / 轮换 API 密钥',
            deactivate: '停用',
            deactivateConfirm: '是否停用此传感器？它将停止接受新数据。',
            delete: '删除',
            deleteTitle: '永久删除传感器及其全部历史数据',
            deleteConfirm: '永久删除传感器 "{name}"？将同时删除其全部 {samples} 条历史数据，此操作不可恢复。',
            bulkTitle: '📦 批量CSV导入',
            bulkHint: '同时选择多个CSV文件。文件名包含传感器ID或名称的将自动匹配，否则手动指定目标传感器。',
            bulkColFile: '文件',
            bulkColSize: '大小',
            bulkColSensor: '目标传感器',
            bulkColStatus: '状态',
            bulkImportAll: '全部导入',
            bulkClear: '清空',
            bulkImporting: '导入中…',
            noSensors: '暂无注册的传感器。',
            noMatch: '没有符合筛选条件的传感器。',
            never: '从未'
        },

        settings: {
            userHeader: '用户',
            adminHeader: '管理',
            profile: '个人资料',
            appearance: '外观',
            notifications: '通知',
            userManagement: '用户管理',
            database: '数据库',
            fullName: '全名',
            username: '用户名',
            email: '邮箱',
            gender: '性别',
            genderConfidential: '保密',
            genderMale: '男',
            genderFemale: '女',
            bio: '个人简介',
            bioPlaceholder: '简要介绍自己...',
            charsRemaining: '个字符剩余',
            avatar: '头像',
            uploadAvatar: '上传头像',
            saveProfile: '保存资料',
            theme: '主题',
            fontSize: '字体大小',
            language: '语言',
            sidebarCollapsed: '折叠侧边栏',
            sidebarCollapsedDesc: '将侧边栏最小化为仅图标',
            emailNotifications: '邮件通知',
            emailNotificationsDesc: '通过电子邮件接收通知',
            inAppNotifications: '应用内通知',
            inAppNotificationsDesc: '在应用程序内显示通知',
            digestFrequency: '摘要频率',
            digestFrequencyDesc: '接收通知摘要的频率',
            digestNone: '无',
            digestDaily: '每日',
            digestWeekly: '每周',
            role: '角色',
            status: '状态',
            actions: '操作',
            deleteUserConfirm: '确认删除此用户？',
            refreshStats: '刷新统计',
            documents: '文档数',
            version: '版本',
        },

        // Dashboard
        dashboard: {
            welcome: '欢迎回来！',
            subtitle: 'M-Gemini 模型驱动数字孪生平台',
            quickActions: '快捷操作',
            viewCaves: '查看洞窟',
            viewStatues: '查看雕像',
            viewMurals: '查看壁画',
            viewPaintings: '查看绘画',
            viewInscriptions: '查看铭文'
        },

        // Field Labels
        fields: {
            affectedArea: '受影响面积',
            conservationStatus: '保护状态',
            content: '内容',
            coordinates: '坐标',
            creationPeriod: '创建时期',
            defectType: '缺陷类型',
            defects: '缺陷',
            depth: '深度',
            description: '描述',
            detectionDate: '检测日期',
            environmentConditions: '环境条件',
            exhibits: '展品',
            expression: '表达式',
            gid: '全局ID',
            height: '高度',
            inspectionNotes: '检查备注',
            label: '标签',
            language: '语言',
            lastInspectionDate: '最近检查日期',
            material: '材质',
            modelLocation: '3D模型文件',
            metadataLocation: '元数据文件',
            textureLocation: '纹理文件',
            name: '名称',
            period: '时期',
            pitch: '俯仰角',
            reading: '读数',
            reference: '资产引用',
            requiresImmediateAction: '需要立即处理',
            roll: '翻滚角',
            severity: '严重程度',
            style: '风格',
            subject: '主题',
            technique: '技法',
            timestamp: '时间戳',
            treatmentHistory: '处理历史',
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
            deleteError: '删除{entity}失败',
            bulkSelected: '已选 {count} 项',
            bulkDelete: '删除所选',
            bulkDeleteConfirm: '确认删除选中的 {count} 个{entity}吗？',
            bulkDeletePartialError: '已删除 {ok} 项，{fail} 项失败',
            clearSelection: '清除选择',
            logout: '退出登录'
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
            pigmentRequiredHint: '请先运行颜料识别 — 模拟读取每种颜料的分类映射。',
            start: '开始模拟',
            stop: '停止模拟',
            reset: '重置',
            advanced: '高级设置',
            temperature: '温度',
            humidity: '相对湿度',
            light: '光照强度',
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
                tooHumid: '过湿',
                dark: '暗存储',
                museum: '博物馆级',
                moderate: '中等曝光',
                excessive: '过度曝光'
            },
            info: {
                title: '信息',
                optimal: '最佳条件',
                warning: '警告',
                warningText: '极端条件可能损害文物',
                kelvin: '开尔文温度'
            },
            lifetime: {
                title: '寿命倍数',
                longer: '更长寿命',
                shorter: '更短寿命',
                reference: '相对博物馆参考条件 (20°C / 50% RH)'
            },
            mould: {
                title: '霉菌风险',
                index: '霉菌指数',
                threshold: '霉菌阈值: {rh}% RH',
                exceeded: '已超过阈值',
                safe: '安全',
                warning: '警告',
                active: '活跃生长',
                scale: {
                    0: '无生长',
                    1: '微观可见',
                    2: '显微镜下可见',
                    3: '覆盖 <10%',
                    4: '覆盖 10-50%',
                    5: '覆盖 50-100%',
                    6: '完全覆盖'
                }
            },
            composite: {
                low: '低风险',
                moderate: '中等风险',
                high: '高风险',
                note: '综合风险取五个归一化机制子指数的最大值（保守的最坏情况聚合）。三维叠加按各机制的子指数加权分层，因此主导威胁显示最强。',
                zonesTitle: '分区空间综合风险',
                zonesNote: '毛细上升使基座附近的局部相对湿度升高，可溶盐供应随高度递减，因此下部区域比面部/头顶承受更多盐驱动的风险。'
            },
            toggles: {
                chemical: '化学褪色',
                lifetime: '寿命倍数',
                mould: '霉菌生长'
            },
            modelsCard: {
                title: '劣化模型'
            },
            models: {
                chemical: 'Arrhenius (化学褪色)',
                lifetime: 'Michalski eLM (寿命倍数)',
                mould: 'VTT Hukka-Viitanen (霉菌生长)',
                saltCryst: 'Scherer-Steiger (盐结晶)'
            },
            saltCryst: {
                pressure: '结晶压力',
                damageRatio: '损伤比',
                ofTensile: '抗拉强度',
                threshold: 'DRH阈值: {drh}% RH',
                crystallizing: '正在结晶',
                dissolved: '已溶解'
            },
            params: {
                configure: '⚙ 参数',
                resetDefaults: '恢复默认',
                chemical: {
                    Ea_dark: '暗反应活化能 (J/mol)',
                    Ea_light: '光反应活化能 (J/mol)',
                    k0_dark: '暗反应前因子',
                    k0_light: '光反应前因子',
                    q: '水反应级数',
                    p: '光互易指数'
                },
                lifetime: {
                    Ea: '活化能 (J/mol)',
                    n: '湿度指数',
                    T0: '参考温度 (°C)',
                    RH0: '参考湿度 (%)'
                },
                mould: {
                    growthCoeff: '生长系数',
                    declineRate: '衰减速率 (/天)'
                },
                saltCryst: {
                    Vm: '摩尔体积 (m³/mol)',
                    DRH_ref: '参考DRH (%)',
                    DRH_slope: 'DRH温度系数 (%/°C)',
                    T_ref: '参考温度 (°C)',
                    tensileStrength: '抗拉强度 (MPa)',
                    cyclesPerYear: '年干湿循环次数'
                }
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

        // Live Data Panel
        liveData: {
            title: '环境监测',
            sensors: '传感器',
            samples: '采样数',
            currentTemp: '当前温度',
            currentRh: '当前湿度',
            dailyRhAmplitude: '日均湿度振幅',
            range: '时间范围',
            interval: '采样间隔',
            autoRefresh: '自动刷新',
            refresh: '刷新',
            off: '关闭',
            last24h: '过去24小时',
            last7d: '过去7天',
            last30d: '过去30天',
            last1y: '过去1年',
            allTime: '全部',
            raw: '原始（10分钟）',
            hourly: '每小时',
            daily: '每日',
            periodSummary: '统计概览',
            tMean: '温度均值',
            tRange: '温度范围',
            rhMean: '湿度均值',
            rhRange: '湿度范围',
            tStd: '温度标准差',
            rhAmp: '日均Δ湿度',
            noSensors: '当前文物或其所在洞窟尚未绑定传感器。',
            gapDetected: '检测到{count}处数据间隔（累计{duration}）',
            loading: '加载中…',
            adminControls: '管理员控制',
            registeredSensors: '已注册传感器',
            csvUpload: 'CSV上传',
            selectSensor: '选择传感器…',
            upload: '上传',
            csvHint: 'CSV必须包含字段：timestamp, temperature, humidity （lightKlux可选）。',
            registerNewSensor: '注册新传感器',
            register: '注册',
            link: '绑定',
            unlink: '解绑',
            inactive: '已停用',
            rotateKey: '轮换API密钥',
            rotateConfirm: '此操作将使现有API密钥失效，使用旧密钥的所有现场记录器将停止上传数据，需重新配置。继续？',
            keySaved: '✓ 已生成新密钥，请立即保存（仅显示一次）：',
            apiKeyNote: '密钥秘密部分以bcrypt哈希形式存储，无法恢复。如现场部署遗失密钥，请使用"轮换"重新生成。',
            ingestionEndpoints: '数据上传接口',
            apiKey: 'API密钥',
            exampleUsage: '调用示例',
            sensorGid: '传感器标识',
            keyPrefix: '密钥前缀',
            channels: '通道',
            samplesIngested: '已上传样本',
            lastSeen: '最近上传',
            never: '从未',
            single: '单个',
            batch: '批量',
            csv: 'CSV'
        },

        // Pigment Analysis Panel
        pigmentAnalysis: {
            title: '颜料分析',
            identifyBtn: '识别颜料',
            restoreBtn: '恢复色彩',
            identifying: '正在识别颜料…',
            restoring: '正在恢复色彩…',
            displayCurrent: '当前',
            displayPigmentMap: '颜料分布',
            displayRestored: '已恢复',
            restorationStrength: '恢复强度',
            detectedPigments: '已检测颜料',
            emptyHint: '点击"识别颜料"以分析贴图',
            errorNoPixelData: '未找到贴图数据，请先加载带贴图的模型。',
            errorNoTexture: '无可用贴图数据。',
            analysisFailed: '分析失败：',
            restorationFailed: '恢复失败：'
        },

        // Form Validation
        validation: {
            required: '{field}是必填项',
            invalid: '{field}格式不正确',
            tooShort: '{field}太短',
            tooLong: '{field}太长'
        },

        // Login page
        loginPage: {
            heroTitle: '守护千年文化遗产，',
            heroTitleStrong: '纤毫毕现。',
            heroSubtitle: '莫高窟交互式数字孪生平台。监测微环境、模拟劣化情景、规划保护干预 —— 全部基于经现场校准的物理模型。',
            feature3D: '洞窟与文物的 3D 数字副本',
            featureMonitoring: '实时环境监测与分析',
            featureSimulation: '劣化模拟与保护规划',
            featureCollaboration: '跨机构协同研究',
            formEyebrow: '登录',
            formTitle: '欢迎回来',
            formSubtitle: '请登录以进入平台',
            usernameLabel: '用户名',
            usernamePlaceholder: '请输入用户名',
            passwordLabel: '密码',
            passwordPlaceholder: '请输入密码',
            signIn: '登录',
            signingIn: '请稍候……',
            or: '或',
            visitAsGuest: '访客访问',
            footer: '莫高数字孪生 © 2026',
            connectionFailed: '连接失败。后端是否已启动？'
        },

        // Sidebar/topbar additions
        navExtras: {
            maintenance: '维护'
        },

        // Maintenance queue (admin)
        maintenance: {
            title: '🔧 维护队列',
            exportPdf: '📄 导出 PDF',
            refresh: '↻ 刷新',
            loading: '正在评分所有文物……（每件文物运行完整劣化重放）',
            statTotal: '合计',
            statCritical: '紧急',
            statHigh: '高',
            statMedium: '中',
            statLow: '低',
            statAnomalies: '当前异常',
            search: '按名称、ID 或类型搜索……',
            clearFilter: '清除筛选',
            noMatch: '没有符合筛选条件的文物。',
            colPriority: '优先级',
            colScore: '得分',
            colArtifact: '文物',
            colType: '类型',
            colDamage: '损伤',
            colNearestEta: '最近 ETA',
            colAnomalies: '异常',
            colHistory: '记录',
            colTopAction: '建议',
            openArtifact3D: '▶ 打开 3D + 预测',
            drillUnavailable: '（无法跳转 — 该文物未关联到洞窟）',
            scoreBreakdown: '得分构成',
            recommendations: '建议',
            currentCumulativeState: '当前累积状态',
            activeAnomalies: '当前异常',
            currentDamage: '当前损伤',
            etaUrgency: 'ETA 紧迫度',
            inspectionAge: '巡检年龄',
            conservationStatusLabel: '保护状态',
            chemicalDeltaE: '⚗️ 化学 ΔE*',
            mouldIndex: '🦠 霉菌指数',
            fatigueDamage: '🧱 疲劳累积 D',
            saltCumulative: '🧂 盐累积',
            equivYears: '⏳ 等效参考年',
            mouldThreshold: '/ 6（阈值 3）',
            damageThreshold: '/ 1.0',
            noCumulative: '尚无累积数据。',
            methodology: 'ℹ 评分：得分 = 1.0·损伤 + 1.0·(1/ETA_y) + 0.5·异常计数 + 0.3·巡检年龄 + 0.8·状态严重度。≥ 2.5 紧急、≥ 1.5 高、≥ 0.8 中，否则低。展开任意行查看分项明细、累积状态、异常和全部建议。'
        },

        // Sensor data emulator ("Data Lab")
        emulator: {
            intro: '合成数据发布工具，用于开发和演示。每个传感器都有自己的运行实例 —— 调整参数后点击"开始"即可按指定节奏发射样本。"回填"会一次性填充过去的历史数据。',
            noSensors: '尚未注册任何传感器。请先在"设备清单"标签页中添加。',
            start: '开始',
            stop: '停止',
            targetT: '温度',
            targetRH: '湿度',
            cadence: '节奏',
            paramsToggle: '合成数据参数',
            sampleCount: '样本数',
            startedAt: '开始时间',
            lastSample: '最近样本',
            catchupLabel: '回填',
            catchupUnit: '天，10 分钟节奏',
            catchupRun: '↺ 运行回填',
            catchupRunning: '生成中……',
            catchupConfirm: '为该传感器回填 {days} 天合成样本？同分钟桶中已存在的样本将被保留（去重）。',
            catchupDone: '回填完成：{accepted} 已接受，{duplicates} 重复，{rejected} 已拒绝。'
        },

        // Per-sensor API-key modal
        sensorKey: {
            keyPrefix: 'API 密钥前缀',
            newKey: '新 API 密钥 — 请立即保存',
            newKeyHint: '此密钥将不再显示。请立即复制并保存；任何仍使用旧密钥的设备需要更新。',
            bcryptNote: '密钥的私密部分以 bcrypt 哈希形式存储，无法恢复。如需获取可复制的密钥，请轮换密钥 — 之前的密钥将失效。',
            rotate: '🔄 轮换 API 密钥',
            rotateAgain: '再次轮换',
            rotating: '轮换中……',
            rotateConfirm: '此操作将使当前 API 密钥失效。任何使用旧密钥的设备将无法继续推送数据，直至重新配置。是否继续？',
            endpoints: '数据接入端点',
            copy: '复制'
        },

        // Per-sensor history modal
        sensorHistory: {
            range24h: '24 小时',
            range7d: '7 天',
            range30d: '30 天',
            range90d: '90 天',
            rangeall: '全部',
            refresh: '↻ 刷新',
            loading: '加载中……',
            count: '样本数',
            daysCovered: '覆盖天数',
            light: '光照（klux）',
            timestamp: '时间戳',
            noSamples: '所选时间范围内无样本。',
            noSnapshots: '所选时间范围内无快照。'
        },

        // Snapshots panel (camera frame time-lapse)
        snapshots: {
            title: '快照',
            refresh: '刷新',
            loading: '加载中……',
            empty: '尚无此文物的快照。摄像头通过 /snapshots/ingest 推送图像，需提供传感器密钥。',
            delete: '删除',
            deleteConfirm: '删除此快照？'
        },

        // Prediction panel (per-artifact replay + threshold ETA)
        prediction: {
            title: '🔮 预测',
            historyDuration: '{days} 天（{years} 年）的监测历史',
            noSensors: '此文物未关联任何传感器。请在 "实时数据" 面板中关联一个，以启用预测功能。',
            noSamples: '此文物尚未接收任何传感器样本。',
            forecastForward: '向前预测（重复气候）',
            horizon: '时间跨度',
            years10: '10 年',
            years50: '50 年',
            years200: '200 年',
            refresh: '↻ 刷新',
            exportPdf: '📄 导出 PDF',
            runningReplay: '正在重放……',
            modelChemical: '化学褪色',
            modelMould: '霉菌指数',
            modelFatigue: '疲劳累积',
            modelSalt: '盐累积',
            modelLifetime: '已消耗寿命',
            ofThreshold: '阈值的 {threshold}',
            etaCrossed: '已超过',
            etaPrefix: 'ETA：{eta}',
            chartLegendChemical: '⚗️ 化学',
            chartLegendMould: '🦠 霉菌',
            chartLegendFatigue: '🧱 疲劳',
            chartLegendSalt: '🧂 盐',
            chartYAxis: '阈值占比',
            methodology: 'ℹ 方法：历史重放将五个模型逐日积分到实测的 T/RH/ΔRH 记录上。预测（虚线）通过循环最近一年的气候向前外推 — 在没有外部气候预报时这是合理的基准。阈值：ΔE*=5，霉菌=3/6，D=1，盐累积=1。'
        },

        // Defects panel keys (replaces the t() || 'fallback' pattern)
        defects: {
            logNew: '+ 记录缺陷',
            empty: '尚未记录任何缺陷。',
            errorTypeRequired: '缺陷类型是必填项',
            deleteConfirm: '永久删除缺陷 "{name}"？此操作不可恢复。',
            formCreateTitle: '记录新缺陷',
            formEditTitle: '编辑缺陷',
            fieldName: '名称（可选）',
            fieldType: '缺陷类型',
            fieldSeverity: '严重程度',
            fieldDetectionDate: '发现日期',
            fieldAffectedArea: '受影响区域（m²）',
            fieldUrgent: '需要紧急处理',
            fieldDescription: '描述',
            fieldTreatment: '处置历史'
        },

        // Sensor dashboard form keys
        sensorDashboardForm: {
            createTitle: '注册新传感器',
            editTitle: '编辑传感器',
            placeholderName: '名称 *',
            placeholderModel: '型号（如 HOBO MX2301A）',
            placeholderSerial: '序列号',
            typeTemperature: '温度传感器',
            typeHumidity: '湿度传感器',
            typeCamera: '摄像头（图像）',
            noArtifactLink: '— 未关联文物 —',
            groupCaves: '洞窟（整窟范围）',
            groupStatues: '雕像（按文物）',
            groupMurals: '壁画（按文物）',
            groupPaintings: '绘画（按文物）',
            groupInscriptions: '铭文（按文物）',
            activeCheckbox: '活动中（接收新样本）',
            saveChanges: '保存修改',
            register: '注册',
            cancel: '取消',
            apiKeyShown: '✓ 已注册传感器 — 请保存此 API 密钥（仅显示一次）：',
            edit: '编辑',
            editTitle2: '编辑传感器元数据与文物关联'
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
            select: 'Select...',
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

        // Empty-state messages (shared by all list views)
        empty: {
            noEntityTitle: 'Nothing here yet',
            noEntityHint:  'Add your first {entity} using the button below',
            noResultsTitle: 'No matches',
            noResultsHint:  'Try a different search term or clear the filter',
        },

        // Keyboard shortcuts cheatsheet
        shortcuts: {
            title: 'Keyboard shortcuts',
            navigation: 'Navigation',
            actions: 'Actions',
            then: 'then',
            goDashboard: 'Go to dashboard',
            goCaves: 'Go to caves',
            goStatues: 'Go to statues',
            goMurals: 'Go to murals',
            goPaintings: 'Go to paintings',
            goInscriptions: 'Go to inscriptions',
            goSensors: 'Go to sensors',
            goMaintenance: 'Go to maintenance queue',
            focusSearch: 'Focus search box',
            openCheatsheet: 'Open this cheatsheet',
            closeDialog: 'Close dialog',
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

        // Navigation
        nav: {
            sensors: 'Sensors',
            dashboard: 'Dashboard',
            heritage: 'Heritage Assets',
            settings: 'Settings',
            backendOnline: 'Backend Online',
            backendOffline: 'Backend Offline'
        },

        // Sensor Dashboard
        sensorDashboard: {
            title: 'Sensor Fleet',
            total: 'Total',
            online: 'Online',
            warning: 'Warning',
            offline: 'Offline',
            inactive: 'Inactive',
            new: 'New (no data)',
            unknown: 'Unknown',
            samples: 'Samples',
            search: 'Search sensors by name, model, gid, or cave…',
            clearFilter: 'Clear filter',
            kindAll: 'All',
            kindTemperature: 'Temperature',
            kindHumidity: 'Humidity',
            kindCamera: 'Cameras',
            tabFleet: 'Fleet',
            tabEmulator: 'Data Lab',
            registerSensor: '+ Register sensor',
            cancel: 'Cancel',
            refresh: '↻ Refresh',
            colStatus: 'Status',
            colName: 'Name',
            colModel: 'Model',
            colCave: 'Cave',
            colSamples: 'Samples',
            colLastSeen: 'Last seen',
            colActions: 'Actions',
            history: 'History',
            historyTitle: 'View this sensor\'s recorded history',
            key: '🔑 Key',
            keyTitle: 'View / rotate the API key',
            deactivate: 'Deactivate',
            deactivateConfirm: 'Deactivate this sensor? It will stop accepting new samples.',
            delete: 'Delete',
            deleteTitle: 'Permanently delete the sensor and all its historical samples',
            deleteConfirm: 'Permanently delete sensor "{name}"? All {samples} historical samples will also be removed. This cannot be undone.',
            bulkTitle: '📦 Bulk CSV import',
            bulkHint: 'Select multiple CSV files at once. Files are auto-matched to sensors when the filename contains the sensor\'s gid or name; otherwise pick the target sensor manually.',
            bulkColFile: 'File',
            bulkColSize: 'Size',
            bulkColSensor: 'Target sensor',
            bulkColStatus: 'Status',
            bulkImportAll: 'Import all',
            bulkClear: 'Clear',
            bulkImporting: 'Importing…',
            noSensors: 'No sensors registered yet.',
            noMatch: 'No sensors match the filter.',
            never: 'never'
        },

        settings: {
            userHeader: 'User',
            adminHeader: 'Admin',
            profile: 'Profile',
            appearance: 'Appearance',
            notifications: 'Notifications',
            userManagement: 'User Management',
            database: 'Database',
            fullName: 'Full Name',
            username: 'Username',
            email: 'Email',
            gender: 'Gender',
            genderConfidential: 'Confidential',
            genderMale: 'Male',
            genderFemale: 'Female',
            bio: 'Bio',
            bioPlaceholder: 'Tell us about yourself...',
            charsRemaining: 'characters remaining',
            avatar: 'Avatar',
            uploadAvatar: 'Upload Avatar',
            saveProfile: 'Save Profile',
            theme: 'Theme',
            fontSize: 'Font Size',
            language: 'Language',
            sidebarCollapsed: 'Collapse Sidebar',
            sidebarCollapsedDesc: 'Minimize the sidebar to icons only',
            emailNotifications: 'Email Notifications',
            emailNotificationsDesc: 'Receive notifications via email',
            inAppNotifications: 'In-App Notifications',
            inAppNotificationsDesc: 'Show notifications within the application',
            digestFrequency: 'Digest Frequency',
            digestFrequencyDesc: 'How often to receive notification summaries',
            digestNone: 'None',
            digestDaily: 'Daily',
            digestWeekly: 'Weekly',
            role: 'Role',
            status: 'Status',
            actions: 'Actions',
            deleteUserConfirm: 'Are you sure you want to delete this user?',
            refreshStats: 'Refresh Stats',
            documents: 'documents',
            version: 'Version',
        },

        // Dashboard
        dashboard: {
            welcome: 'Welcome back!',
            subtitle: 'M-Gemini Model-Driven Digital Twin Platform',
            quickActions: 'Quick Actions',
            viewCaves: 'View Caves',
            viewStatues: 'View Statues',
            viewMurals: 'View Murals',
            viewPaintings: 'View Paintings',
            viewInscriptions: 'View Inscriptions'
        },

        // Field Labels
        fields: {
            affectedArea: 'Affected Area',
            conservationStatus: 'Conservation Status',
            content: 'Content',
            coordinates: 'Coordinates',
            creationPeriod: 'Creation Period',
            defectType: 'Defect Type',
            defects: 'Defects',
            depth: 'Depth',
            description: 'Description',
            detectionDate: 'Detection Date',
            environmentConditions: 'Environment Conditions',
            exhibits: 'Exhibits',
            expression: 'Expression',
            gid: 'Global ID',
            height: 'Height',
            inspectionNotes: 'Inspection Notes',
            label: 'Label',
            language: 'Language',
            lastInspectionDate: 'Last Inspection Date',
            material: 'Material',
            modelLocation: '3D Model File',
            metadataLocation: 'Metadata File',
            textureLocation: 'Texture File',
            name: 'Name',
            period: 'Period',
            pitch: 'Pitch',
            reading: 'Reading',
            reference: 'Asset Reference',
            requiresImmediateAction: 'Requires Immediate Action',
            roll: 'Roll',
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
            deleteError: 'Failed to delete {entity}',
            bulkSelected: '{count} selected',
            bulkDelete: 'Delete selected',
            bulkDeleteConfirm: 'Delete {count} selected {entity} items?',
            bulkDeletePartialError: 'Deleted {ok}; {fail} failed',
            clearSelection: 'Clear selection',
            logout: 'Logout'
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
            pigmentRequiredHint: 'Run Pigment Analysis first — the simulation reads its per-pigment class map.',
            start: 'Start Simulation',
            stop: 'Stop Simulation',
            reset: 'Reset',
            advanced: 'Advanced Settings',
            temperature: 'Temperature',
            humidity: 'Relative Humidity',
            light: 'Light Intensity',
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
                tooHumid: 'Too Humid',
                dark: 'Dark storage',
                museum: 'Museum level',
                moderate: 'Moderate exposure',
                excessive: 'Excessive'
            },
            info: {
                title: 'Information',
                optimal: 'Optimal Conditions',
                warning: 'Warning',
                warningText: 'Extreme conditions may damage artifacts',
                kelvin: 'Kelvin Temperature'
            },
            lifetime: {
                title: 'Lifetime Multiplier',
                longer: 'longer lifetime',
                shorter: 'shorter lifetime',
                reference: 'vs. museum reference (20°C / 50% RH)'
            },
            mould: {
                title: 'Mould Risk',
                index: 'Mould Index',
                threshold: 'Mould threshold: {rh}% RH',
                exceeded: 'threshold exceeded',
                safe: 'Safe',
                warning: 'Warning',
                active: 'Active Growth',
                scale: {
                    0: 'No growth',
                    1: 'Microscopic',
                    2: 'Visible under microscope',
                    3: 'Coverage <10%',
                    4: 'Coverage 10-50%',
                    5: 'Coverage 50-100%',
                    6: 'Tight coverage'
                }
            },
            composite: {
                low: 'Low risk',
                moderate: 'Moderate risk',
                high: 'High risk',
                note: 'Composite risk is the maximum of the five normalised mechanism sub-indices (conservative worst-case aggregation). The 3D overlay layers each mechanism weighted by its sub-index, so the dominant threat reads strongest.',
                zonesTitle: 'Per-zone spatial composite',
                zonesNote: 'Local RH is raised near the base by capillary rise and soluble-salt supply decays with height, so lower zones carry more salt-driven risk than the face/crown.'
            },
            toggles: {
                chemical: 'Chemical Fading',
                lifetime: 'Lifetime Multiplier',
                mould: 'Mould Growth'
            },
            modelsCard: {
                title: 'Deterioration Models'
            },
            models: {
                chemical: 'Arrhenius (Chemical Fading)',
                lifetime: 'Michalski eLM (Lifetime Multiplier)',
                mould: 'VTT Hukka-Viitanen (Mould Growth)',
                saltCryst: 'Scherer-Steiger (Salt Crystallization)'
            },
            saltCryst: {
                pressure: 'Crystallization Pressure',
                damageRatio: 'Damage Ratio',
                ofTensile: 'of tensile strength',
                threshold: 'DRH threshold: {drh}% RH',
                crystallizing: 'Crystallizing',
                dissolved: 'Dissolved'
            },
            params: {
                configure: '⚙ Params',
                resetDefaults: 'Reset Defaults',
                chemical: {
                    Ea_dark: 'Dark Reaction Ea (J/mol)',
                    Ea_light: 'Light Reaction Ea (J/mol)',
                    k0_dark: 'Dark Pre-exponential',
                    k0_light: 'Light Pre-exponential',
                    q: 'Water Reaction Order',
                    p: 'Light Reciprocity'
                },
                lifetime: {
                    Ea: 'Activation Energy (J/mol)',
                    n: 'Humidity Exponent',
                    T0: 'Reference Temp (°C)',
                    RH0: 'Reference RH (%)'
                },
                mould: {
                    growthCoeff: 'Growth Coefficient',
                    declineRate: 'Decline Rate (/day)'
                },
                saltCryst: {
                    Vm: 'Molar Volume (m³/mol)',
                    DRH_ref: 'Reference DRH (%)',
                    DRH_slope: 'DRH Temp Coefficient (%/°C)',
                    T_ref: 'Reference Temp (°C)',
                    tensileStrength: 'Tensile Strength (MPa)',
                    cyclesPerYear: 'Wet-Dry Cycles/Year'
                }
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

        // Live Data Panel
        liveData: {
            title: 'Environment Monitoring',
            sensors: 'sensors',
            samples: 'samples',
            currentTemp: 'Temp',
            currentRh: 'RH',
            dailyRhAmplitude: 'Daily ΔRH',
            range: 'Range',
            interval: 'Interval',
            autoRefresh: 'Auto-refresh',
            refresh: 'Refresh',
            off: 'Off',
            last24h: 'Last 24h',
            last7d: 'Last 7 days',
            last30d: 'Last 30 days',
            last1y: 'Last year',
            allTime: 'All time',
            raw: 'Raw (10 min)',
            hourly: 'Hourly',
            daily: 'Daily',
            periodSummary: 'Period Summary',
            tMean: 'T mean',
            tRange: 'T range',
            rhMean: 'RH mean',
            rhRange: 'RH range',
            tStd: 'T stddev',
            rhAmp: 'ΔRH / day',
            noSensors: 'No sensors are linked to this artifact or its parent cave yet.',
            gapDetected: '{count} data gap(s) detected (totalling {duration})',
            loading: 'Loading…',
            adminControls: 'Admin controls',
            registeredSensors: 'Registered sensors',
            csvUpload: 'CSV Upload',
            selectSensor: 'Select sensor…',
            upload: 'Upload',
            csvHint: 'CSV must have columns: timestamp, temperature, humidity (lightKlux optional).',
            registerNewSensor: 'Register new sensor',
            register: 'Register sensor',
            link: 'Link',
            unlink: 'Unlink',
            inactive: 'inactive',
            rotateKey: 'Rotate API key',
            rotateConfirm: 'This invalidates the current API key. Any field logger using the old key will stop being able to post data until reconfigured. Continue?',
            keySaved: '✓ New key generated — save it now (shown once):',
            apiKeyNote: 'The secret portion of the key is stored as a bcrypt hash and cannot be recovered. If the field deployment has lost its key, rotate it to issue a new one.',
            ingestionEndpoints: 'Ingestion endpoints',
            apiKey: 'API key',
            exampleUsage: 'Example usage',
            sensorGid: 'Sensor gid',
            keyPrefix: 'Key prefix',
            channels: 'Channels',
            samplesIngested: 'Samples ingested',
            lastSeen: 'Last seen',
            never: 'never',
            single: 'Single',
            batch: 'Batch',
            csv: 'CSV'
        },

        // Pigment Analysis Panel
        pigmentAnalysis: {
            title: 'Pigment Analysis',
            identifyBtn: 'Identify Pigments',
            restoreBtn: 'Restore Colours',
            identifying: 'Identifying pigments…',
            restoring: 'Restoring colours…',
            displayCurrent: 'Current',
            displayPigmentMap: 'Pigment Map',
            displayRestored: 'Restored',
            restorationStrength: 'Restoration Strength',
            detectedPigments: 'Detected Pigments',
            emptyHint: 'Click "Identify Pigments" to analyse the texture',
            errorNoPixelData: 'No texture pixel data available. Load a model with a texture first.',
            errorNoTexture: 'No texture data available.',
            analysisFailed: 'Analysis failed: ',
            restorationFailed: 'Restoration failed: '
        },

        // Form Validation
        validation: {
            required: '{field} is required',
            invalid: '{field} is invalid',
            tooShort: '{field} is too short',
            tooLong: '{field} is too long'
        },

        // Login page
        loginPage: {
            heroTitle: 'Preserve a thousand-year heritage,',
            heroTitleStrong: 'in living detail.',
            heroSubtitle: 'An interactive digital twin for the Mogao Grottoes. Monitor microclimate, simulate deterioration scenarios, and plan conservation interventions — all grounded in physics-based models calibrated to the site.',
            feature3D: '3D digital replicas of cave temples and artefacts',
            featureMonitoring: 'Real-time environmental monitoring and analysis',
            featureSimulation: 'Deterioration simulation and conservation planning',
            featureCollaboration: 'Collaborative research across institutions',
            formEyebrow: 'Sign in',
            formTitle: 'Welcome back',
            formSubtitle: 'Sign in to access the platform',
            usernameLabel: 'Username',
            usernamePlaceholder: 'Enter your username',
            passwordLabel: 'Password',
            passwordPlaceholder: 'Enter your password',
            signIn: 'Sign In',
            signingIn: 'Please wait…',
            or: 'or',
            visitAsGuest: 'Visit as a Guest',
            footer: 'Mogao Digital Twin © 2026',
            connectionFailed: 'Connection failed. Is the backend running?'
        },

        // Sidebar/topbar additions
        navExtras: {
            maintenance: 'Maintenance'
        },

        // Maintenance queue (admin)
        maintenance: {
            title: '🔧 Maintenance Queue',
            exportPdf: '📄 Export PDF',
            refresh: '↻ Refresh',
            loading: 'Scoring all artifacts… (runs a full deterioration replay for each)',
            statTotal: 'Total',
            statCritical: 'Critical',
            statHigh: 'High',
            statMedium: 'Medium',
            statLow: 'Low',
            statAnomalies: 'Active anomalies',
            search: 'Search by name, gid or type…',
            clearFilter: 'Clear filter',
            noMatch: 'No artifacts match the filter.',
            colPriority: 'Priority',
            colScore: 'Score',
            colArtifact: 'Artifact',
            colType: 'Type',
            colDamage: 'Damage',
            colNearestEta: 'Nearest ETA',
            colAnomalies: 'Anomalies',
            colHistory: 'Hist.',
            colTopAction: 'Top action',
            openArtifact3D: '▶ Open 3D + Prediction',
            drillUnavailable: '(Drill-in unavailable — no parent cave on record.)',
            scoreBreakdown: 'Score breakdown',
            recommendations: 'Recommendations',
            currentCumulativeState: 'Current cumulative state',
            activeAnomalies: 'Active anomalies',
            currentDamage: 'Current damage',
            etaUrgency: 'ETA urgency',
            inspectionAge: 'Inspection age',
            conservationStatusLabel: 'Conservation status',
            chemicalDeltaE: '⚗️ Chemical ΔE*',
            mouldIndex: '🦠 Mould index',
            fatigueDamage: '🧱 Fatigue D',
            saltCumulative: '🧂 Salt cumulative',
            equivYears: '⏳ Equiv. reference-years',
            mouldThreshold: '/ 6 (threshold 3)',
            damageThreshold: '/ 1.0',
            noCumulative: 'No cumulative data available yet.',
            methodology: 'ℹ Scoring: composite = 1.0·damage + 1.0·(1/ETA_years) + 0.5·anomalyCount + 0.3·inspectionAge + 0.8·statusSeverity. Score ≥ 2.5 = critical, ≥ 1.5 = high, ≥ 0.8 = medium, else low. Expand any row for the per-index breakdown, full cumulative state, active anomalies, and all recommendations.'
        },

        // Sensor data emulator ("Data Lab")
        emulator: {
            intro: 'Synthetic data publisher for development and demos. Each sensor gets its own runner — adjust parameters then Start to begin emitting samples at the chosen cadence. Catchup fills past history in one go.',
            noSensors: 'No sensors registered yet. Add one from the Fleet tab first.',
            start: 'Start',
            stop: 'Stop',
            targetT: 'Temperature',
            targetRH: 'Humidity',
            cadence: 'Cadence',
            paramsToggle: 'Synthetic-data parameters',
            sampleCount: 'Samples',
            startedAt: 'Started',
            lastSample: 'Last',
            catchupLabel: 'Backfill',
            catchupUnit: 'days @ 10-min cadence',
            catchupRun: '↺ Run catchup',
            catchupRunning: 'Generating…',
            catchupConfirm: 'Backfill {days} days of synthetic samples for this sensor? Existing samples in the same minute-buckets will be left alone (deduped).',
            catchupDone: 'Catchup complete: {accepted} accepted, {duplicates} duplicates, {rejected} rejected.'
        },

        // Per-sensor API-key modal
        sensorKey: {
            keyPrefix: 'API key prefix',
            newKey: 'New API key — store this now',
            newKeyHint: 'This key will not be shown again. Copy and store it now; any device still using the previous key will need to be updated.',
            bcryptNote: 'The secret portion of the key is stored as a bcrypt hash and cannot be recovered. To obtain a copyable key, rotate it below — the previous key will be invalidated.',
            rotate: '🔄 Rotate API key',
            rotateAgain: 'Rotate again',
            rotating: 'Rotating…',
            rotateConfirm: 'This invalidates the current API key. Any device using the old key will stop being able to push data until reconfigured. Continue?',
            endpoints: 'Ingestion endpoints',
            copy: 'Copy'
        },

        // Per-sensor history modal
        sensorHistory: {
            range24h: '24h',
            range7d: '7d',
            range30d: '30d',
            range90d: '90d',
            rangeall: 'All',
            refresh: '↻ Refresh',
            loading: 'Loading…',
            count: 'Samples',
            daysCovered: 'Days covered',
            light: 'Light (klux)',
            timestamp: 'Timestamp',
            noSamples: 'No samples in this range.',
            noSnapshots: 'No snapshots in this range.'
        },

        // Snapshots panel (camera frame time-lapse)
        snapshots: {
            title: 'Snapshots',
            refresh: 'Refresh',
            loading: 'Loading…',
            empty: 'No snapshots have been ingested for this artefact yet. Cameras push frames to /snapshots/ingest with their sensor key.',
            delete: 'Delete',
            deleteConfirm: 'Delete this snapshot?'
        },

        // Prediction panel (per-artifact replay + threshold ETA)
        prediction: {
            title: '🔮 Prediction',
            historyDuration: '{days} days ({years} y) of monitored history',
            noSensors: 'No sensors linked to this artifact. Link one in the Live Data panel to enable prediction.',
            noSamples: 'No sensor samples ingested yet for this artifact.',
            forecastForward: 'Forecast forward (climate-repeat)',
            horizon: 'Horizon',
            years10: '10 years',
            years50: '50 years',
            years200: '200 years',
            refresh: '↻ Refresh',
            exportPdf: '📄 Export PDF',
            runningReplay: 'Running replay…',
            modelChemical: 'Chemical fading',
            modelMould: 'Mould index',
            modelFatigue: 'Fatigue damage',
            modelSalt: 'Salt cumulative',
            modelLifetime: 'Lifetime consumed',
            ofThreshold: 'of {threshold} threshold',
            etaCrossed: 'already crossed',
            etaPrefix: 'ETA: {eta}',
            chartLegendChemical: '⚗️ Chemical',
            chartLegendMould: '🦠 Mould',
            chartLegendFatigue: '🧱 Fatigue',
            chartLegendSalt: '🧂 Salt',
            chartYAxis: 'Fraction of threshold',
            methodology: 'ℹ Method: historical replay integrates the five models day-by-day through the actual monitored T/RH/ΔRH record. Forecast (dashed) projects forward by looping the most recent year of climate — a defensible baseline when no external climate forecast is available. Thresholds: ΔE*=5, mould=3/6, D=1, salt-cum=1.'
        },

        // Defects panel keys
        defects: {
            logNew: '+ Log new defect',
            empty: 'No defects recorded yet.',
            errorTypeRequired: 'Defect type is required',
            deleteConfirm: 'Delete the defect "{name}"? This cannot be undone.',
            formCreateTitle: 'Log new defect',
            formEditTitle: 'Edit defect',
            fieldName: 'Name (optional)',
            fieldType: 'Defect type',
            fieldSeverity: 'Severity',
            fieldDetectionDate: 'Detection date',
            fieldAffectedArea: 'Affected area (m²)',
            fieldUrgent: 'Requires immediate action',
            fieldDescription: 'Description',
            fieldTreatment: 'Treatment history'
        },

        // Sensor dashboard form keys
        sensorDashboardForm: {
            createTitle: 'Register new sensor',
            editTitle: 'Edit sensor',
            placeholderName: 'Name *',
            placeholderModel: 'Model (e.g. HOBO MX2301A)',
            placeholderSerial: 'Serial #',
            typeTemperature: 'Temperature sensor',
            typeHumidity: 'Humidity sensor',
            typeCamera: 'Camera (image)',
            noArtifactLink: '— No artifact link —',
            groupCaves: 'Caves (whole-cave scope)',
            groupStatues: 'Statues (per-artifact)',
            groupMurals: 'Murals (per-artifact)',
            groupPaintings: 'Paintings (per-artifact)',
            groupInscriptions: 'Inscriptions (per-artifact)',
            activeCheckbox: 'Active (receiving new samples)',
            saveChanges: 'Save changes',
            register: 'Register',
            cancel: 'Cancel',
            apiKeyShown: '✓ Sensor registered — save this API key (shown once):',
            edit: 'Edit',
            editTitle2: 'Edit sensor metadata and artifact link'
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

// Shared global locale ref (singleton across all components)
const savedLocale = localStorage.getItem('locale');
const globalLocale = ref((savedLocale && messages[savedLocale]) ? savedLocale : defaultLocale);

// Composable for Vue components
export function useI18n() {
    const translate = (key, params) => t(key, globalLocale.value, params);

    const setLocale = (newLocale) => {
        if (messages[newLocale]) {
            globalLocale.value = newLocale;
            localStorage.setItem('locale', newLocale);
        }
    };

    return {
        locale: globalLocale,
        t: translate,
        setLocale
    };
}
