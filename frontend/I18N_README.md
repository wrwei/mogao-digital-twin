# Multilingual Support (i18n) - Mogao Digital Twin

## Overview

The Mogao Digital Twin project features **fully auto-generated multilingual support** integrated into the Model-Driven Architecture. Language resources are generated from the Ecore metamodel, ensuring consistency across all components.

## Supported Languages

- **Chinese (中文)** - Default language (`zh`)
- **English** - Secondary language (`en`)
- **Extensible** - Easy to add more languages

## Files

### Auto-Generated
- **`i18n.js`** - Main language resource file (auto-generated from metamodel)

### Manual
- **`i18n-demo.html`** - Interactive demo showing all translations

## Architecture

```
Ecore Metamodel (mogao_dt.ecore)
        ↓
FrontendHelpers.eol (Multilingual label functions)
        ↓
GenerateI18n.egl Template
        ↓
i18n.js (Auto-generated language resources)
        ↓
Vue Components (Use translations)
```

## Usage in Components

### Basic Usage

```javascript
import { useI18n } from './i18n.js';

export default {
    setup() {
        const { locale, t, setLocale } = useI18n();

        return {
            locale,  // Current language ('zh' or 'en')
            t,       // Translation function
            setLocale // Change language function
        };
    },
    template: `
        <div>
            <h1>{{ t('entities.cave') }}</h1>
            <button @click="setLocale('en')">English</button>
            <button @click="setLocale('zh')">中文</button>
        </div>
    `
};
```

### Translation with Parameters

```javascript
// Simple translation
t('common.create')  // => "创建" or "Create"

// With parameters
t('actions.createNew', { entity: t('entities.statue') })
// => "创建新雕像" or "Create New Statue"

t('validation.required', { field: t('fields.name') })
// => "名称是必填项" or "Name is required"
```

## Translation Keys Structure

### Common UI (common.*)
```javascript
t('common.create')   // 创建 / Create
t('common.edit')     // 编辑 / Edit
t('common.delete')   // 删除 / Delete
t('common.save')     // 保存 / Save
t('common.loading')  // 加载中... / Loading...
```

### Entity Names (entities.*)
```javascript
t('entities.cave')        // 洞窟 / Cave
t('entities.caves')       // 洞窟列表 / Cave List
t('entities.statue')      // 雕像 / Statue
t('entities.statues')     // 雕像列表 / Statue List
```

### Field Labels (fields.*)
```javascript
t('fields.name')                 // 名称 / Name
t('fields.description')          // 描述 / Description
t('fields.conservationStatus')   // 保护状态 / Conservation Status
t('fields.material')             // 材质 / Material
```

### Conservation Status (conservationStatus.*)
```javascript
t('conservationStatus.excellent')  // 优秀 / Excellent
t('conservationStatus.good')       // 良好 / Good
t('conservationStatus.fair')       // 一般 / Fair
t('conservationStatus.poor')       // 较差 / Poor
t('conservationStatus.critical')   // 危急 / Critical
```

### Defect Types (defectTypes.*)
```javascript
t('defectTypes.cracking')         // 开裂 / Cracking
t('defectTypes.flaking')          // 剥落 / Flaking
t('defectTypes.colorAlteration')  // 变色 / Color Alteration
```

### Severity Levels (severity.*)
```javascript
t('severity.minor')      // 轻微 / Minor
t('severity.moderate')   // 中等 / Moderate
t('severity.severe')     // 严重 / Severe
t('severity.critical')   // 危急 / Critical
```

### 3D Viewer (viewer.*)
```javascript
t('viewer.title')        // 三维模型 / 3D Model
t('viewer.loading')      // 加载3D模型中... / Loading 3D model...
t('viewer.autoRotate')   // 启用自动旋转 / Enable Auto-rotate
t('viewer.controls')     // 左键旋转 | 右键平移 | 滚轮缩放 / Left-click: Rotate | ...
```

### Actions (actions.*)
```javascript
t('actions.createNew', { entity: 'Cave' })   // 创建新Cave
t('actions.saveSuccess', { entity: 'Statue' })  // Statue保存成功
t('actions.deleteConfirm', { entity: 'Mural' }) // 确认删除此Mural吗？
```

### Validation (validation.*)
```javascript
t('validation.required', { field: 'Name' })  // Name是必填项
t('validation.invalid', { field: 'Email' })  // Email格式不正确
```

## Language Switching

### Setting Language
```javascript
const { setLocale } = useI18n();

// Switch to English
setLocale('en');

// Switch to Chinese
setLocale('zh');
```

### Persistence
Language preference is automatically saved to `localStorage` and restored on page reload.

```javascript
// Automatically saved
localStorage.getItem('locale')  // => 'en' or 'zh'
```

## Adding New Translations

### Option 1: Update FrontendHelpers.eol (Recommended)
Add to the label maps in `FrontendHelpers.eol`:

```eol
operation getEnglishLabel(fieldName : String) : String {
    var labels = Map {
        // ... existing labels
        "newField" = "New Field",  // Add here
    };
    return labels.get(fieldName) ?: fieldName;
}

operation getFieldLabel(fieldName : String) : String {
    var labels = Map {
        // ... existing labels
        "newField" = "新字段",  // Add here
    };
    return labels.get(fieldName) ?: fieldName;
}
```

### Option 2: Manually Edit i18n.js (Quick Fix)
Directly add translations to `frontend/i18n.js`:

```javascript
export const messages = {
    zh: {
        fields: {
            // ... existing fields
            newField: '新字段'
        }
    },
    en: {
        fields: {
            // ... existing fields
            newField: 'New Field'
        }
    }
};
```

**Note:** Manual edits will be overwritten when you regenerate code!

## Adding More Languages

To add a new language (e.g., French):

1. **Update GenerateI18n.egl template**:
   ```egl
   fr: {
       common: {
           create: 'Créer',
           edit: 'Modifier',
           // ... more translations
       }
   }
   ```

2. **Update useI18n() composable**:
   ```javascript
   export const defaultLocale = 'zh';  // or 'fr' for French default
   ```

3. **Regenerate**:
   ```bash
   cd backend
   ./generate-code.bat
   ```

## Testing

### Demo Page
Open the interactive demo to test all translations:

```bash
cd frontend
python -m http.server 8000
# Navigate to http://localhost:8000/i18n-demo.html
```

### In Components
```javascript
// Test in browser console
import { t } from './i18n.js';
console.log(t('common.create', 'en'));  // "Create"
console.log(t('common.create', 'zh'));  // "创建"
```

## Integration with Generated Components

All auto-generated components should use translations:

```javascript
// In generated StatueCard.js
template: `
    <button @click="$emit('edit')">
        {{ t('common.edit') }}
    </button>
`
```

## Best Practices

1. **Always use translation keys** instead of hardcoded strings
2. **Use consistent key structure** (category.subcategory.key)
3. **Regenerate after metamodel changes** to update translations
4. **Test both languages** before deployment
5. **Use parameters for dynamic content**

## Model-Driven Benefits

✅ **Consistency** - All translations derived from metamodel
✅ **Maintainability** - Update metamodel, regenerate translations
✅ **Type Safety** - Translation keys match entity/field names
✅ **Automation** - No manual translation file management
✅ **Extensibility** - Easy to add new languages or fields

## Troubleshooting

### Missing Translation
If a translation is missing, the key is returned:
```javascript
t('nonexistent.key')  // => 'nonexistent.key'
```

### Wrong Language
Check localStorage:
```javascript
localStorage.getItem('locale')  // Should be 'en' or 'zh'
localStorage.setItem('locale', 'zh')  // Reset to Chinese
```

### Not Updating
After regenerating i18n.js, clear browser cache or hard refresh (Ctrl+F5).

## Future Enhancements

- [ ] Add more languages (French, Japanese, etc.)
- [ ] Generate translations for enum values
- [ ] Support for pluralization rules
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale
- [ ] RTL (Right-to-Left) language support

## References

- **Metamodel**: `backend/src/main/resources/metamodel/mogao_dt.ecore`
- **Template**: `backend/src/main/resources/transformation/frontend/GenerateI18n.egl`
- **Helpers**: `backend/src/main/resources/transformation/frontend/FrontendHelpers.eol`
- **Generated**: `frontend/i18n.js`
- **Demo**: `frontend/i18n-demo.html`
