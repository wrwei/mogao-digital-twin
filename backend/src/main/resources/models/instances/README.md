# Mogao Digital Twin - Model Instances

## Overview

This directory contains Flexmi model instances that represent the actual data for the Mogao Caves Digital Twin.

## Model File

**`model.flexmi`** - The singleton demo model used by both frontend and backend

This is the single source of truth for the demo application, containing:
- 3 caves (Cave 001, 002, 003) from different dynasties
- Multiple exhibits (statues, murals, paintings, inscriptions)
- Defects with varying severity levels
- Environmental monitoring data
- 3D model references for exhibits

## Model Structure

### Cave Hierarchy

```
DTPackage (MogaoCaves)
  └─ Cave (001, 002, 003)
      ├─ Coordinates
      ├─ Exhibits
      │   ├─ Statue (with optional 3D model reference)
      │   ├─ Mural
      │   ├─ Painting
      │   └─ Inscription
      │       ├─ Coordinates
      │       ├─ AssetReference (3D model, metadata, texture)
      │       ├─ Defects
      │       └─ Environment Conditions
      └─ Environment Conditions
          ├─ Temperature
          ├─ Humidity
          └─ Light Intensity
```

## Demo Model Contents

### Cave 001 - Tang Dynasty (618-907 AD)
**Status:** Good condition
**Highlights:**
- North Wall Mural with Jataka tales (fair condition, 2 defects)
- Central Buddha Statue with **3D model reference** (good condition)
- Donor Inscription from Li family (excellent condition)

**Defects:**
1. Pigment flaking on mural (moderate severity)
2. Horizontal crack on mural (severe severity - requires action)
3. Material loss on statue (minor severity)

### Cave 002 - Song Dynasty (960-1279 AD)
**Status:** Fair condition
**Highlights:**
- Avalokiteshvara silk banner painting (poor condition, urgent conservation needed)

**Defects:**
1. Severe color alteration (critical severity - requires immediate action)

### Cave 003 - Northern Wei Dynasty (386-534 AD)
**Status:** Excellent condition
**Highlights:**
- Standing Bodhisattva statue (excellent condition)
- West Wall Paradise mural (good condition)

## 3D Model References

Currently, only **Cave 001 - Central Buddha Statue** has a 3D model reference:
- **Model:** `/exhibit_models/kneeling-attendant-bodhisattva/source/obj/obj/1924_70_Bodhisattva-1mil.obj`
- **Material:** `/exhibit_models/kneeling-attendant-bodhisattva/source/obj/obj/1924_70_Bodhisattva-1mil.mtl`
- **Texture:** `/exhibit_models/kneeling-attendant-bodhisattva/textures/1924_70_Bodhisattva-1mil.jpeg`

## Environmental Monitoring Data

All caves include environmental sensors tracking:
- **Temperature** (in Kelvin, optimal: ~293K / 20°C)
- **Humidity** (in %RH, optimal: 48-55%)
- **Light Intensity** (in lux, conservation-safe: 50-150 lux)

Timestamp format: Unix epoch time in milliseconds

## Defect Severity Levels

- **minor** - Document and monitor
- **moderate** - Requires treatment planning
- **severe** - Urgent treatment needed
- **critical** - Immediate action required

## Conservation Status Levels

- **excellent** - No intervention needed
- **good** - Stable with routine monitoring
- **fair** - Some conservation work recommended
- **poor** - Significant intervention required
- **critical** - Emergency conservation needed

## Usage

### Backend (Java/Micronaut)
The model is loaded by the Epsilon model manager and used to populate the DTOs served via REST API.

### Frontend (Vue.js)
The frontend fetches data from the backend API, which is generated from this model.

### Model-Driven Workflow

1. **Edit** `model.flexmi` to modify data
2. **Regenerate** code if metamodel changes: `cd backend && ./generate-code.bat`
3. **Restart** backend to reload model data
4. **Test** frontend to verify changes

## Flexmi Format Notes

- Flexmi is a relaxed XML format for EMF models
- IDE warnings about syntax are expected and can be ignored
- Epsilon Flexmi parser handles the format correctly
- Use `xsi:type` to specify concrete types for abstract classes
- Containment relationships are expressed through nesting

## Adding New Data

To add new caves or exhibits:

1. Follow the existing structure
2. Use unique `gid` (global ID) for each element
3. Ensure coordinates are specified where required
4. Add `xsi:type` for concrete class types (Cave, Statue, Mural, etc.)
5. Include AssetReference if you have 3D model files

Example:
```xml
<exhibits xsi:type="Statue"
          gid="statue-new"
          name="New Statue"
          ...>
  <reference gid="ref-new"
             modelLocation="/path/to/model.obj"
             metadataLocation="/path/to/model.mtl"
             textureLocation="/path/to/texture.jpg"/>
  <coordinates gid="coord-new"
               x="0.0" y="0.0" z="0.0"/>
</exhibits>
```

## Validation

The model conforms to the metamodel defined in:
`backend/src/main/resources/metamodel/mogao_dt.ecore`

Any changes to this model file should be validated against the metamodel structure.
