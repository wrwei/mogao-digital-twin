# Mogao Digital Twin — Machine Learning Models

*Technical specification for pigment analysis and colour restoration models*

---

## 1. Overview

The system uses two ML models for heritage pigment analysis, each operating in dual mode: a **heuristic fallback** (works immediately, no training data required) and a **neural network slot** (activated when trained weights are deployed).

| Model | Task | Heuristic Mode | Neural Network Mode |
|-------|------|----------------|---------------------|
| **Model 1: PigmentIdentifier** | Semantic segmentation — classify each texture pixel into one of 8 pigment classes | HSV colour-space decision boundaries | MobileNetV2 encoder + segmentation head |
| **Model 2: PigmentRestorer** | Image-to-image translation — reconstruct original polychrome from faded texture | Per-pigment HSV colour correction keyed off PigmentDatabase | U-Net with skip connections |

Both models operate on 2D texture images (not 3D geometry).

---

## 2. Model 1: Pigment Identifier

### 2.1 Task Definition

**Input:** RGBA texture image (any resolution, internally resized to 256x256 for inference)
**Output:** Per-pixel pigment class ID (Uint8Array), confidence map (Float32Array), region summary

### 2.2 Classes

| ID | Key | Pigment | Chinese | Typical Hue Range |
|----|-----|---------|---------|-------------------|
| 0 | background | Ground/substrate | 底色 | Low saturation, mid-value |
| 1 | azurite | Azurite | 石青 | H 195-255, S > 0.25 |
| 2 | malachite | Malachite | 石绿 | H 90-165, S > 0.25 |
| 3 | vermilion | Vermilion | 朱砂 | H 345-360/0-15, S > 0.50 |
| 4 | leadWhite | Lead white | 铅白 | S < 0.08, V > 0.75 |
| 5 | goldLeaf | Gold leaf | 金箔 | H 35-60, S > 0.50 |
| 6 | redOchre | Red ochre | 赭石 | H 15-40, S 0.30-0.50 |
| 7 | carbonBlack | Carbon black | 墨 | S < 0.06, V < 0.12 |

### 2.3 Heuristic Mode (current)

Converts each pixel to HSV and applies threshold-based classification. Conservative saturation thresholds (0.25-0.50) ensure neutral tones stay as "background" rather than being aggressively classified.

**Strengths:**
- Zero latency, no dependencies, works on any browser
- Surprisingly effective for Dunhuang pigments which have distinctive hue signatures even after fading

**Weaknesses:**
- Cannot distinguish pigments with overlapping hue ranges after severe degradation
- No spatial context — classifies each pixel independently
- Cannot detect pigment mixtures or layering

### 2.4 Neural Network Mode (planned)

**Architecture:** MobileNetV2 encoder (pretrained on ImageNet) + lightweight decoder with 1x1 conv to 8 output classes.

```
Input (256x256x3)
    │
    ▼
MobileNetV2 Encoder (pretrained, fine-tuned)
    │
    ├── Block 3 features (32x32x96)   ──┐
    ├── Block 6 features (16x16x160)  ──┤  skip connections
    ├── Block 13 features (8x8x320)  ──┤
    │                                    │
    ▼                                    │
Bottleneck (8x8x1280)                   │
    │                                    │
    ▼                                    │
Upsample + Concat ◄─────────────────────┘
    │
    ▼
1x1 Conv → 8 classes
    │
    ▼
Bilinear upsample to 256x256
    │
    ▼
Softmax → class probabilities
```

**Why MobileNetV2:** Lightweight (~3.4M parameters), fast inference in TF.js, strong transfer learning from ImageNet features (edges, textures, colour gradients are all relevant to pigment boundaries).

**Training requirements:**
- Labelled dataset: Dunhuang mural/sculpture photographs with per-pixel pigment annotations
- Ground truth from XRF (X-ray fluorescence), Raman spectroscopy, or FORS (fibre optic reflectance spectroscopy)
- Minimum ~200 annotated images at 256x256 for fine-tuning
- Data augmentation: random crop, flip, colour jitter, brightness/contrast variation
- Loss: weighted cross-entropy (pigment classes are imbalanced — background dominates)
- Optimiser: Adam, lr=1e-4, 50 epochs

**Deployment:**
```bash
tensorflowjs_converter --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    saved_model/ \
    frontend/ml/models/pigment-identifier/
```

---

## 3. Model 2: Pigment Restorer

### 3.1 Task Definition

**Input:** RGBA faded texture + pigment map (optional, from Model 1)
**Output:** RGBA restored texture at original resolution

### 3.2 Heuristic Mode (current)

Per-pigment colour correction in HSV space:

1. For each pixel, look up its pigment class from the identifier
2. Convert pixel RGB to HSV
3. Convert target RGB (from PigmentDatabase) to HSV
4. Blend hue via shortest-arc angular interpolation: `H' = lerp_angle(H_current, H_target, strength * 0.7)`
5. Blend saturation linearly: `S' = S + (S_target - S) * strength`
6. Blend value conservatively: `V' = V + (V_target - V) * strength * 0.5`
7. Adaptive strength: pixels further from target receive stronger correction

**Restoration strength** is user-configurable (0-100%, default 65%).

**Strengths:**
- Art-historically informed — target colours come from conservation literature on Dunhuang pigments
- Controllable intensity via the strength slider
- Preserves spatial detail (only shifts colour, doesn't hallucinate structure)

**Weaknesses:**
- Uniform correction per pigment class — cannot recover spatial variation within a class
- Depends on accurate pigment identification (Model 1)
- Cannot reconstruct patterns or details lost to physical damage

### 3.3 Neural Network Mode (planned)

**Architecture:** U-Net with skip connections (encoder-decoder).

```
Input (256x256x3, faded texture)
    │
    ▼
Encoder
    ├── Conv 64 + BN + ReLU (256x256)  ──┐
    ├── MaxPool + Conv 128 (128x128)    ──┤
    ├── MaxPool + Conv 256 (64x64)      ──┤  skip connections
    ├── MaxPool + Conv 512 (32x32)      ──┤
    │                                      │
    ▼                                      │
Bottleneck Conv 1024 (16x16)               │
    │                                      │
    ▼                                      │
Decoder                                    │
    ├── UpConv 512 + Concat (32x32)    ◄──┘
    ├── UpConv 256 + Concat (64x64)    ◄──┘
    ├── UpConv 128 + Concat (128x128)  ◄──┘
    ├── UpConv 64 + Concat (256x256)   ◄──┘
    │
    ▼
1x1 Conv → 3 channels (RGB)
    │
    ▼
Sigmoid → pixel values (0-1)
```

**Why U-Net:** Skip connections preserve spatial detail from the input while allowing the bottleneck to learn global colour transformations. Well-suited for image-to-image translation where the output structure mirrors the input.

**Training strategy:**

1. **Synthetic paired data generation:**
   - Start with digitally restored reference images (from Dunhuang Academy publications, or manually colour-corrected photographs)
   - Apply known Arrhenius degradation using the existing `DeteriorationService` with randomised parameters (time, temperature, humidity, light)
   - This produces (degraded, original) pairs for supervised training

2. **Loss function:** Perceptual loss (VGG16 feature matching at layers conv1_2, conv2_2, conv3_3) + L1 pixel loss + SSIM loss
   ```
   L_total = 0.5 * L_perceptual + 0.3 * L_L1 + 0.2 * L_SSIM
   ```

3. **Training parameters:**
   - Optimiser: Adam, lr=1e-4 with cosine annealing
   - Batch size: 16
   - Epochs: 100-200
   - ~500 paired images (can be synthetically generated)

4. **Optional: pigment-conditioned restoration**
   - Concatenate the pigment map (one-hot encoded, 8 channels) with the RGB input → 11-channel input
   - This lets the network learn different restoration strategies per pigment class

**Deployment:** Same `tensorflowjs_converter` pipeline as Model 1.

---

## 4. Per-Pigment Deterioration (downstream of Model 1)

When Model 1 produces a pigment map, the physics-based Arrhenius simulation switches from uniform fading to **region-aware degradation**:

```
For each pixel:
    cls = pigmentMap[pixel]
    params = PigmentDatabase[cls]

    // Arrhenius rate constant for this specific pigment
    k = k0_dark * |H₂O|^q * exp(-Ea_dark / RT)
      + k0_light * light^p * |H₂O|^q * exp(-Ea_light / RT)

    degradationFactor = exp(-k * totalDays)
```

This produces chemically accurate per-region fading. Example for 200 years at Mogao conditions (13C, 35% RH, 2 klux):

| Pigment | k (day⁻¹) | Degradation Factor | % Lost | Visual Effect |
|---------|-----------|-------------------|--------|---------------|
| Gold leaf | ~10⁻⁹ | ~1.000 | ~0% | Virtually unchanged |
| Carbon black | ~10⁻⁸ | ~0.999 | ~0.1% | Negligible |
| Red ochre | ~10⁻⁷ | ~0.993 | ~0.7% | Very slight |
| Malachite | ~10⁻⁶ | ~0.930 | ~7% | Slight fading |
| Azurite | ~10⁻⁵ | ~0.520 | ~48% | Significant fading + green shift |
| Vermilion | ~10⁻⁵ | ~0.340 | ~66% | Heavy darkening / blackening |

This matches real-world observations: gold leaf and carbon black survive millennia; azurite and vermilion are the most vulnerable.

---

## 5. Runtime Environment

### 5.1 Current: Browser-only (TF.js)

Both models run entirely client-side via TensorFlow.js. No server-side inference required.

**Pros:**
- Zero infrastructure cost, no GPU server needed
- Works offline after initial page load
- Data never leaves the browser (privacy)

**Cons:**
- Limited to ~20M parameter models for acceptable inference speed
- No GPU acceleration on most laptops (falls back to WebGL or CPU)
- 8192x8192 textures require downsampling to 256x256 (loss of detail)

### 5.2 Planned: Python Backend for Training and Inference

For production-quality models, a Python ML backend is recommended. This provides:

1. **Faster training** — PyTorch/TensorFlow with CUDA GPU acceleration
2. **Larger models** — not constrained by browser memory/compute
3. **Higher resolution** — process textures at 512x512 or 1024x1024
4. **Model serving** — REST API for inference, browser sends texture and receives results

#### 5.2.1 Recommended Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| ML Framework | PyTorch 2.x | Model training and inference |
| Model serving | FastAPI + Uvicorn | REST API for inference |
| GPU support | CUDA 12.x | Training acceleration |
| Image processing | Pillow, OpenCV | Texture preprocessing |
| Experiment tracking | MLflow or Weights & Biases | Hyperparameter tracking |
| Model export | TorchScript or ONNX | Optimised inference |
| Browser fallback | TF.js (converted from ONNX) | Offline/no-server mode |

#### 5.2.2 Proposed API Endpoints

```
POST /api/ml/identify-pigments
    Body: multipart/form-data { texture: <image file> }
    Response: { pigmentMap: base64, regionSummary: [...] }
    ~200ms inference at 512x512 on GPU

POST /api/ml/restore-colours
    Body: multipart/form-data { texture: <image file>, pigmentMap?: base64, strength?: 0.65 }
    Response: { restoredTexture: base64 }
    ~500ms inference at 512x512 on GPU

GET /api/ml/status
    Response: { identifier: { loaded, mode }, restorer: { loaded, mode } }
```

#### 5.2.3 Hybrid Architecture

```
Browser (Vue 3 + Three.js)
    │
    ├── Try Python backend first (if available)
    │       POST /api/ml/identify-pigments
    │       ◄── pigmentMap + regionSummary
    │
    └── Fall back to client-side (TF.js / heuristic)
            PigmentIdentifier.identify()
            ◄── pigmentMap + regionSummary
```

The frontend `PigmentIdentifier` and `PigmentRestorer` classes can be extended with a `_inferRemote()` method that calls the Python backend. If the backend is unavailable (network error, 404), it falls back silently to the existing client-side modes.

#### 5.2.4 Training Pipeline

```
1. Data preparation
   dunhuang-pigments/
   ├── images/          # Cropped mural/sculpture photographs
   ├── masks/           # Per-pixel pigment class annotations (PNG, 8-class palette)
   └── metadata.csv     # Image ID, source cave, dynasty, pigment notes

2. Training
   python train_identifier.py \
       --data dunhuang-pigments/ \
       --arch mobilenetv2_seg \
       --epochs 50 \
       --lr 1e-4 \
       --batch-size 16 \
       --output models/pigment-identifier/

   python train_restorer.py \
       --data dunhuang-pigments/ \
       --arch unet \
       --epochs 100 \
       --loss perceptual+l1+ssim \
       --output models/pigment-restorer/

3. Export to TF.js (for browser fallback)
   python export_tfjs.py \
       --checkpoint models/pigment-identifier/best.pt \
       --output frontend/ml/models/pigment-identifier/

4. Deploy to FastAPI server
   python serve.py --port 8010 --models models/
```

---

## 6. Accuracy Evaluation Metrics

### Model 1: Pigment Identifier

| Metric | Description | Target |
|--------|-------------|--------|
| mIoU (mean Intersection over Union) | Per-class IoU averaged across all 8 classes | > 0.60 |
| Pixel accuracy | % of correctly classified pixels | > 80% |
| Per-class IoU | IoU for each pigment class individually | > 0.40 for rare classes |
| Confusion matrix | Misclassification patterns (e.g., faded vermilion → red ochre) | Inspect manually |

### Model 2: Pigment Restorer

| Metric | Description | Target |
|--------|-------------|--------|
| PSNR | Peak signal-to-noise ratio vs. ground truth | > 25 dB |
| SSIM | Structural similarity index | > 0.85 |
| Delta E (CIELAB) | Perceptual colour difference vs. reference | < 10 (mean) |
| FID | Frechet Inception Distance (realism) | < 50 |
| Art-historical review | Expert assessment of plausibility | Qualitative |

---

## 7. References

1. Bacci, M. et al. (2003). Non-invasive fibre optic Fourier transform-infrared reflectance spectroscopy on painted layers. *Journal of Cultural Heritage*, 4(3):238-242.
2. Liang, H. (2012). Advances in multispectral and hyperspectral imaging for archaeology and art conservation. *Applied Physics A*, 106(2):309-323.
3. Ronneberger, O., Fischer, P. & Brox, T. (2015). U-Net: Convolutional Networks for Biomedical Image Segmentation. *MICCAI 2015*, pp. 234-241.
4. Sandler, M. et al. (2018). MobileNetV2: Inverted Residuals and Linear Bottlenecks. *CVPR 2018*.
5. Isola, P. et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks. *CVPR 2017*.
6. Fan, Y. et al. (2020). Digital restoration of murals based on deep learning. *Heritage Science*, 8:90.
7. Strlič, M. et al. (2015). Damage function for historic paper. *Heritage Science*, 3:40.
8. Johnston-Feller, R. et al. (1984). The kinetics of fading. *JAIC*, 23(2):114-129.
9. Dunhuang Academy (2010). *Conservation of Ancient Sites on the Silk Road*. Getty Conservation Institute.

---

Last updated: 2026-04-11
