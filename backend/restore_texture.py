#!/usr/bin/env python3
"""
Texture Restoration Script for Mogao Caves Digital Twin
Restores aged/damaged textures to make them look new
"""

import os
import sys
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

def simple_restoration(input_path, output_path):
    """
    Simple restoration using PIL - enhances contrast, sharpness, and color
    Good for quick improvements without AI models
    """
    print(f"Loading texture from: {input_path}")
    img = Image.open(input_path)

    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')

    print("Applying restoration techniques...")

    # 1. Reduce noise
    img = img.filter(ImageFilter.MedianFilter(size=3))

    # 2. Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.2)

    # 3. Enhance color saturation
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.15)

    # 4. Enhance sharpness
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.3)

    # 5. Adjust brightness slightly
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.05)

    # Save restored texture
    print(f"Saving restored texture to: {output_path}")
    img.save(output_path, 'JPEG', quality=95, optimize=True)
    print(f"✅ Restoration complete! File size: {os.path.getsize(output_path) / (1024*1024):.2f} MB")


def advanced_restoration_opencv(input_path, output_path):
    """
    Advanced restoration using OpenCV - includes denoising and detail enhancement
    Requires: pip install opencv-python
    """
    try:
        import cv2
    except ImportError:
        print("⚠️  OpenCV not installed. Install with: pip install opencv-python")
        return False

    print(f"Loading texture with OpenCV from: {input_path}")
    img = cv2.imread(input_path)

    if img is None:
        print("❌ Failed to load image")
        return False

    print("Applying advanced restoration...")

    # 1. Denoising
    img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

    # 2. Enhance details with CLAHE (Contrast Limited Adaptive Histogram Equalization)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # 3. Sharpen
    kernel = np.array([[-1,-1,-1],
                       [-1, 9,-1],
                       [-1,-1,-1]])
    img = cv2.filter2D(img, -1, kernel)

    # 4. Color enhancement
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    s = cv2.multiply(s, 1.15)
    s = np.clip(s, 0, 255).astype(np.uint8)
    hsv = cv2.merge([h, s, v])
    img = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)

    print(f"Saving restored texture to: {output_path}")
    cv2.imwrite(output_path, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(f"✅ Advanced restoration complete! File size: {os.path.getsize(output_path) / (1024*1024):.2f} MB")
    return True


def ai_restoration_guide():
    """
    Guide for using AI-based restoration (Real-ESRGAN)
    For best results on cultural heritage textures
    """
    print("""
╔════════════════════════════════════════════════════════════════════╗
║  AI-Based Texture Restoration (Best Quality)                      ║
╚════════════════════════════════════════════════════════════════════╝

For professional-grade restoration, use Real-ESRGAN:

1. Install Real-ESRGAN:
   pip install realesrgan
   pip install basicsr
   pip install facexlib
   pip install gfpgan

2. Download model weights:
   wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth

3. Run restoration:
   realesrgan-ncnn-vulkan -i input.jpg -o output.jpg -s 2

Or use online tools:
- https://arc.tencent.com/en/ai-demos/faceRestoration
- https://www.vanceai.com/photo-restorer/

Benefits:
✅ AI understands texture patterns and details
✅ Removes degradation while preserving authenticity
✅ Upscales resolution if needed (2x, 4x)
✅ Specifically trained on cultural heritage images
    """)


if __name__ == "__main__":
    # Configuration
    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
    TEXTURE_DIR = os.path.join(PROJECT_ROOT, "src", "main", "resources",
                               "exhibit_models", "kneeling-attendant-bodhisattva",
                               "source", "obj", "obj")

    INPUT_FILE = "1924_70_Bodhisattva-1mil.jpg"
    OUTPUT_FILE = "1924_70_Bodhisattva-1mil_restored.jpg"

    input_path = os.path.join(TEXTURE_DIR, INPUT_FILE)
    output_path = os.path.join(TEXTURE_DIR, OUTPUT_FILE)

    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║  Mogao Caves Digital Twin - Texture Restoration Tool              ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print()

    if not os.path.exists(input_path):
        print(f"❌ Texture file not found: {input_path}")
        sys.exit(1)

    print("Choose restoration method:")
    print("1. Simple Restoration (PIL - fast, good results)")
    print("2. Advanced Restoration (OpenCV - better quality, requires opencv-python)")
    print("3. AI Restoration Guide (Real-ESRGAN - best quality)")
    print()

    choice = input("Enter choice (1/2/3): ").strip()

    if choice == "1":
        simple_restoration(input_path, output_path)
        print("\n📸 Preview the restored texture and update model.flexmi if satisfied!")

    elif choice == "2":
        if not advanced_restoration_opencv(input_path, output_path):
            print("\n⚠️  Falling back to simple restoration...")
            simple_restoration(input_path, output_path)
        print("\n📸 Preview the restored texture and update model.flexmi if satisfied!")

    elif choice == "3":
        ai_restoration_guide()

    else:
        print("Invalid choice. Exiting.")
        sys.exit(1)

    if choice in ["1", "2"]:
        print("\n" + "="*70)
        print("Next steps:")
        print(f"1. Open the restored texture: {output_path}")
        print(f"2. Compare with original: {input_path}")
        print("3. If satisfied, update the model.flexmi textureLocation")
        print("4. Regenerate code and refresh browser")
        print("="*70)
