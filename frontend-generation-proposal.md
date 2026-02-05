# Frontend Code Generation with EGL

## Overview

Use the same `mogao_dt.ecore` metamodel to automatically generate Vue.js frontend components, forms, and API integration code using Epsilon Generation Language (EGL).

## Why Generate Frontend Code?

### Benefits
1. ✅ **Single Source of Truth** - Metamodel drives both backend and frontend
2. ✅ **Consistency** - Backend DTOs and frontend forms always match
3. ✅ **Rapid Development** - Generate complete CRUD interfaces instantly
4. ✅ **Easy Updates** - Change metamodel → regenerate → both sides updated
5. ✅ **Reduced Errors** - No manual synchronization between backend/frontend
6. ✅ **Type Safety** - Frontend knows exact structure of backend DTOs

### What to Generate

#### 1. **Vue Components** (from EClass definitions)
- `CaveCard.js` - Display card component
- `CaveList.js` - List component with filtering
- `CaveForm.js` - Create/Edit form
- `CaveDetails.js` - Detail view

#### 2. **Composables** (from EClass operations)
- `useCaves.js` - Data fetching and state management
- `useDefects.js` - CRUD operations
- `useExhibits.js` - Type-specific exhibit handling

#### 3. **API Integration** (from REST endpoints)
- Already have api.js, but could generate endpoint definitions

#### 4. **Form Validation** (from EAttribute constraints)
- Required fields
- Type validation
- Range constraints

---

## Architecture

```
mogao_dt.ecore (Metamodel)
        ↓
    ┌───┴───┐
    ↓       ↓
Backend   Frontend
(Java)    (Vue.js)
    ↓       ↓
  REST API ← → Components
```

### Generation Flow

```
1. Load mogao_dt.ecore
2. For each EClass (Cave, Defect, Statue, etc.):
   → Generate Vue component files
   → Generate form components
   → Generate composables
   → Generate API methods
3. Write to frontend/components/
```

---

## EGL Templates for Frontend

### Template Structure

```
backend/src/main/resources/transformation/frontend/
├── GenerateVueComponent.egl      # Component template
├── GenerateVueForm.egl            # Form template
├── GenerateVueList.egl            # List template
├── GenerateVueCard.egl            # Card template
├── GenerateComposable.egl         # Composable template
└── GenerateApiMethods.egl         # API integration
```

### Example: GenerateVueCard.egl

```egl
[%
var className = eClass.name;
var attributes = eClass.eAllAttributes;
var packageName = "components/" + className;
%]
/**
 * [%=className%] Card Component
 * Auto-generated from mogao_dt.ecore
 */
export default {
    name: '[%=className%]Card',
    props: {
        [%=className.toLowerCase()%]: {
            type: Object,
            required: true
        }
    },
    template: `
        <div class="card [%=className.toLowerCase()%]-card" @click="$emit('select', [%=className.toLowerCase()%])">
            <div class="card-header">
                <h3 class="card-title">{{ [%=className.toLowerCase()%].name }}</h3>
                [% if (hasConservationStatus(eClass)) { %]
                <span class="badge" :class="'badge-' + [%=className.toLowerCase()%].conservationStatus.toLowerCase()">
                    {{ [%=className.toLowerCase()%].conservationStatus }}
                </span>
                [% } %]
            </div>
            <div class="card-body">
                [% for (attr in getDisplayAttributes(attributes)) { %]
                <div class="card-field">
                    <span class="field-label">[%=getFieldLabel(attr.name)%]:</span>
                    <span class="field-value">{{ [%=className.toLowerCase()%].[%=attr.name%] }}</span>
                </div>
                [% } %]
            </div>
            <div class="card-footer">
                <button class="btn btn-sm btn-primary" @click.stop="$emit('edit', [%=className.toLowerCase()%])">
                    编辑
                </button>
                <button class="btn btn-sm btn-error" @click.stop="$emit('delete', [%=className.toLowerCase()%])">
                    删除
                </button>
            </div>
        </div>
    `,
    computed: {
        [% for (attr in getComputedAttributes(attributes)) { %]
        [%=attr.name%]Display() {
            return this.[%=className.toLowerCase()%].[%=attr.name%] || 'N/A';
        },
        [% } %]
    }
};
```

### Example: GenerateVueForm.egl

```egl
[%
var className = eClass.name;
var attributes = eClass.eAllAttributes;
%]
/**
 * [%=className%] Form Component
 * Auto-generated from mogao_dt.ecore
 */
export default {
    name: '[%=className%]Form',
    props: {
        [%=className.toLowerCase()%]: {
            type: Object,
            default: null
        },
        mode: {
            type: String,
            default: 'create' // 'create' or 'edit'
        }
    },
    data() {
        return {
            form: {
                [% for (attr in attributes) { %]
                [%=attr.name%]: this.[%=className.toLowerCase()%]?.[%=attr.name%] || [%=getDefaultValue(attr)%],
                [% } %]
            },
            errors: {},
            loading: false
        };
    },
    methods: {
        async handleSubmit() {
            if (!this.validate()) return;

            this.loading = true;
            try {
                if (this.mode === 'create') {
                    const created = await api.[%=className.toLowerCase()%]s.create(this.form);
                    this.$emit('created', created);
                } else {
                    await api.[%=className.toLowerCase()%]s.update(this.[%=className.toLowerCase()%].gid, this.form);
                    this.$emit('updated', this.form);
                }
            } catch (error) {
                this.$emit('error', error.message);
            } finally {
                this.loading = false;
            }
        },

        validate() {
            this.errors = {};
            [% for (attr in attributes) { %]
            [% if (attr.lowerBound > 0) { // Required field %]
            if (!this.form.[%=attr.name%]) {
                this.errors.[%=attr.name%] = '[%=getFieldLabel(attr.name)%]是必填项';
            }
            [% } %]
            [% if (hasValidation(attr)) { %]
            if (this.form.[%=attr.name%] && ![%=getValidationFunction(attr)%](this.form.[%=attr.name%])) {
                this.errors.[%=attr.name%] = '[%=getValidationMessage(attr)%]';
            }
            [% } %]
            [% } %]
            return Object.keys(this.errors).length === 0;
        }
    },
    template: `
        <form @submit.prevent="handleSubmit" class="form">
            <h2>{{ mode === 'create' ? '创建' : '编辑' }}[%=getChineseLabel(className)%]</h2>

            [% for (attr in attributes) { %]
            <div class="form-group">
                <label class="form-label [%if (attr.lowerBound > 0) {%]form-label-required[%}%]">
                    [%=getFieldLabel(attr.name)%]
                </label>
                [% if (isTextArea(attr)) { %]
                <textarea
                    v-model="form.[%=attr.name%]"
                    class="form-textarea"
                    :class="{ 'form-input-error': errors.[%=attr.name%] }"
                    placeholder="请输入[%=getFieldLabel(attr.name)%]"
                ></textarea>
                [% } else if (isSelect(attr)) { %]
                <select
                    v-model="form.[%=attr.name%]"
                    class="form-select"
                    :class="{ 'form-select-error': errors.[%=attr.name%] }"
                >
                    <option value="">请选择</option>
                    [% for (option in getEnumOptions(attr)) { %]
                    <option value="[%=option%]">[%=option%]</option>
                    [% } %]
                </select>
                [% } else if (isNumber(attr)) { %]
                <input
                    type="number"
                    v-model.number="form.[%=attr.name%]"
                    class="form-input"
                    :class="{ 'form-input-error': errors.[%=attr.name%] }"
                    placeholder="请输入[%=getFieldLabel(attr.name)%]"
                    [%if (hasMin(attr)) {%]min="[%=getMin(attr)%]"[%}%]
                    [%if (hasMax(attr)) {%]max="[%=getMax(attr)%]"[%}%]
                />
                [% } else { %]
                <input
                    type="text"
                    v-model="form.[%=attr.name%]"
                    class="form-input"
                    :class="{ 'form-input-error': errors.[%=attr.name%] }"
                    placeholder="请输入[%=getFieldLabel(attr.name)%]"
                />
                [% } %]
                <span v-if="errors.[%=attr.name%]" class="form-error">
                    {{ errors.[%=attr.name%] }}
                </span>
            </div>
            [% } %]

            <div class="form-actions">
                <button type="button" class="btn btn-outline" @click="$emit('cancel')">
                    取消
                </button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    {{ loading ? '保存中...' : (mode === 'create' ? '创建' : '更新') }}
                </button>
            </div>
        </form>
    `
};
```

### Example: GenerateComposable.egl

```egl
[%
var className = eClass.name;
var classNameLower = className.toLowerCase();
var classNamePlural = classNameLower + "s";
%]
/**
 * [%=className%] Composable
 * Auto-generated from mogao_dt.ecore
 */
import { ref, computed } from 'vue';
import api from '../api.js';

export function use[%=className%]s() {
    const [%=classNamePlural%] = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const selected[%=className%] = ref(null);

    const fetch[%=className%]s = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.[%=classNamePlural%].getAll();
            [%=classNamePlural%].value = response.data;
        } catch (err) {
            error.value = err.message;
            console.error('Failed to fetch [%=classNamePlural%]:', err);
        } finally {
            loading.value = false;
        }
    };

    const get[%=className%]ByGid = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.[%=classNamePlural%].getByGid(gid);
            return response.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const create[%=className%] = async (data) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.[%=classNamePlural%].create(data);
            [%=classNamePlural%].value.push(response.data);
            return response.data;
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const update[%=className%] = async (gid, data) => {
        loading.value = true;
        error.value = null;
        try {
            await api.[%=classNamePlural%].update(gid, data);
            const index = [%=classNamePlural%].value.findIndex(item => item.gid === gid);
            if (index !== -1) {
                [%=classNamePlural%].value[index] = { ...[%=classNamePlural%].value[index], ...data };
            }
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const delete[%=className%] = async (gid) => {
        loading.value = true;
        error.value = null;
        try {
            await api.[%=classNamePlural%].delete(gid);
            [%=classNamePlural%].value = [%=classNamePlural%].value.filter(item => item.gid !== gid);
        } catch (err) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        [%=classNamePlural%],
        loading,
        error,
        selected[%=className%],
        fetch[%=className%]s,
        get[%=className%]ByGid,
        create[%=className%],
        update[%=className%],
        delete[%=className%]
    };
}
```

---

## CodeGenerator Updates

### Add Frontend Generation to CodeGenerator.java

```java
public class CodeGenerator {
    private static final String FRONTEND_OUTPUT_DIR = "../frontend/";
    private static final String COMPONENTS_DIR = FRONTEND_OUTPUT_DIR + "components/";
    private static final String COMPOSABLES_DIR = FRONTEND_OUTPUT_DIR + "composables/";

    public static void main(String[] args) {
        // ... existing backend generation ...

        // Generate Frontend
        System.out.println("\nGenerating Frontend Components...");
        generator.generateFrontendComponents();

        System.out.println("\nGenerating Composables...");
        generator.generateComposables();
    }

    public void generateFrontendComponents() throws Exception {
        EpsilonModelManager manager = new EpsilonModelManager();
        EPackage metamodel = loadMetamodel();

        String[] entityClasses = {"Cave", "Defect", "Statue", "Mural", "Painting", "Inscription"};

        for (String className : entityClasses) {
            EClass eClass = findEClass(metamodel, className);
            if (eClass != null) {
                // Generate Card component
                generateComponent(manager, eClass, "Card", "frontend/GenerateVueCard.egl");

                // Generate Form component
                generateComponent(manager, eClass, "Form", "frontend/GenerateVueForm.egl");

                // Generate List component
                generateComponent(manager, eClass, "List", "frontend/GenerateVueList.egl");

                // Generate Details component
                generateComponent(manager, eClass, "Details", "frontend/GenerateVueDetails.egl");
            }
        }
    }

    public void generateComposables() throws Exception {
        // Similar to generateFrontendComponents but for composables
    }

    private void generateComponent(EpsilonModelManager manager, EClass eClass,
                                   String componentType, String templatePath) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("eClass", eClass);

        String generatedCode = manager.executeEglTemplateWithoutModel(templatePath, params);

        String outputDir = COMPONENTS_DIR + eClass.getName() + "/";
        String fileName = eClass.getName() + componentType + ".js";
        writeToFile(outputDir, fileName, generatedCode);

        System.out.println("    -> Generated: " + outputDir + fileName);
    }
}
```

---

## Generated Output Structure

```
frontend/
├── components/
│   ├── Cave/
│   │   ├── CaveCard.js          ✅ Generated
│   │   ├── CaveForm.js          ✅ Generated
│   │   ├── CaveList.js          ✅ Generated
│   │   └── CaveDetails.js       ✅ Generated
│   │
│   ├── Defect/
│   │   ├── DefectCard.js        ✅ Generated
│   │   ├── DefectForm.js        ✅ Generated
│   │   ├── DefectList.js        ✅ Generated
│   │   └── DefectDetails.js     ✅ Generated
│   │
│   └── ... (similar for all entities)
│
└── composables/
    ├── useCaves.js              ✅ Generated
    ├── useDefects.js            ✅ Generated
    ├── useStatues.js            ✅ Generated
    └── ... (similar for all entities)
```

---

## Helper Functions for EGL Templates

Create `frontend/EglHelpers.eol`:

```eol
// Get Chinese label for field name
operation getFieldLabel(fieldName : String) : String {
    var labels = Map {
        "name" = "名称",
        "description" = "描述",
        "gid" = "全局ID",
        "conservationStatus" = "保护状态",
        "defectType" = "缺陷类型",
        "severity" = "严重程度",
        // ... more mappings
    };
    return labels.get(fieldName) ?: fieldName;
}

// Get default value for attribute type
operation getDefaultValue(attr : EAttribute) : String {
    if (attr.eType.name == "EString") return "''";
    if (attr.eType.name == "EInt") return "0";
    if (attr.eType.name == "EDouble") return "0.0";
    if (attr.eType.name == "EBoolean") return "false";
    return "null";
}

// Check if attribute should be textarea
operation isTextArea(attr : EAttribute) : Boolean {
    return attr.name == "description" or attr.name.endsWith("Text");
}

// Check if attribute is select (enum)
operation isSelect(attr : EAttribute) : Boolean {
    return attr.eType.isKindOf(EEnum);
}

// Check if attribute is number
operation isNumber(attr : EAttribute) : Boolean {
    return attr.eType.name == "EInt" or attr.eType.name == "EDouble";
}

// Get enum options
operation getEnumOptions(attr : EAttribute) : Sequence {
    if (attr.eType.isKindOf(EEnum)) {
        return attr.eType.eLiterals.collect(l | l.name);
    }
    return Sequence{};
}

// Filter display attributes (exclude technical fields)
operation getDisplayAttributes(attributes : Sequence) : Sequence {
    return attributes.select(a | a.name <> "gid" and a.name <> "id");
}
```

---

## Advantages of Frontend Generation

### 1. **Immediate Synchronization**
```
Change metamodel → Run generator → Both backend & frontend updated
```

### 2. **Type Safety**
Generated forms match DTOs exactly - no possibility of mismatch

### 3. **Consistency**
All CRUD interfaces follow the same pattern

### 4. **Speed**
Complete Vue component set generated in seconds

### 5. **Maintainability**
Update one template, regenerate all components

---

## Implementation Plan

### Phase 1: Setup (1 day)
1. ✅ Create `transformation/frontend/` directory
2. ✅ Create base EGL templates
3. ✅ Create helper EOL functions
4. ✅ Update CodeGenerator.java

### Phase 2: Component Generation (2 days)
1. ✅ Implement Card generation
2. ✅ Implement Form generation
3. ✅ Implement List generation
4. ✅ Implement Details generation
5. ✅ Test generated components

### Phase 3: Composable Generation (1 day)
1. ✅ Create composable template
2. ✅ Generate use* functions
3. ✅ Test API integration

### Phase 4: Polish & Integration (1 day)
1. ✅ Add Chinese labels mapping
2. ✅ Add validation logic
3. ✅ Test full workflow
4. ✅ Documentation

**Total**: ~4-5 days for complete frontend generation

---

## Comparison: Manual vs Generated

### Manual Development
- ⏱️ 2-3 hours per entity × 6 entities = **12-18 hours**
- 🐛 Potential for inconsistencies
- 🔄 Manual sync with backend changes

### Generated Development
- ⏱️ Write templates once = **4-5 hours**
- ⏱️ Generate all entities = **< 1 minute**
- ✅ Perfect consistency
- 🔄 Automatic sync with backend

**Time Saved**: ~10-15 hours per project
**Maintenance**: Significantly easier

---

## Next Steps

1. **Create EGL Templates** - Start with one entity (Cave)
2. **Test Generation** - Verify generated components work
3. **Expand Templates** - Add all component types
4. **Integrate with Build** - Add to generate-code script
5. **Document** - Create generation guide

---

## Questions

1. Should we generate ALL frontend code or keep some manual?
2. Which components are most valuable to generate?
3. Should we version-control generated code or regenerate on demand?
4. How to handle custom business logic in generated components?

---

## Recommendation

**YES - Implement Frontend Generation!**

The benefits far outweigh the initial setup cost. This creates a truly model-driven architecture where the metamodel is the single source of truth for the entire application.

**Start with:** Card and Form components for Cave entity as proof-of-concept.
