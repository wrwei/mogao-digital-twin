#!/usr/bin/env python3
"""
AI-Based Texture Restoration using Real-ESRGAN
For Mogao Caves Digital Twin - Professional Grade Restoration
"""

import os
import sys
from pathlib import Path

try:
    from basicsr.archs.rrdbnet_arch import RRDBNet
    from realesrgan import RealESRGANer
    from PIL import Image
    import cv2
    import numpy as np
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("\nPlease run: backend\\install_realesrgan.bat")
    print("Or install manually:")
    print("  pip install basicsr facexlib gfpgan realesrgan")
    sys.exit(1)


def download_model_if_needed(model_path):
    """Download Real-ESRGAN model weights if not present"""
    if os.path.exists(model_path):
        print(f"[OK] Model found: {model_path}")
        return True

    print(f"[WARN] Model not found: {model_path}")
    print("\nDownloading Real-ESRGAN model weights...")
    print("This is a one-time download (~67MB)...")

    import urllib.request
    model_url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"

    try:
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        urllib.request.urlretrieve(model_url, model_path)
        print("[OK] Model downloaded successfully!")
        return True
    except Exception as e:
        print(f"[ERROR] Download failed: {e}")
        print(f"\nPlease download manually from:")
        print(model_url)
        print(f"And save to: {model_path}")
        return False


def restore_texture_ai(input_path, output_path, scale=2, model_path=None):
    """
    Restore texture using Real-ESRGAN

    Args:
        input_path: Path to input texture
        output_path: Path to save restored texture
        scale: Upscaling factor (2 or 4)
        model_path: Path to model weights
    """
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║  AI-Based Texture Restoration with Real-ESRGAN                    ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print()

    # Default model path
    if model_path is None:
        project_root = Path(__file__).parent
        model_path = project_root / "models" / "RealESRGAN_x4plus.pth"
        model_path = str(model_path)

    # Download model if needed
    if not download_model_if_needed(model_path):
        return False

    print(f"\n[LOAD] Loading texture: {input_path}")
    img = cv2.imread(input_path, cv2.IMREAD_COLOR)

    if img is None:
        print(f"[ERROR] Failed to load image from: {input_path}")
        return False

    original_size = os.path.getsize(input_path) / (1024 * 1024)
    print(f"[INFO] Original size: {img.shape[1]}x{img.shape[0]} ({original_size:.2f} MB)")

    # Initialize Real-ESRGAN
    print("\n[AI] Initializing Real-ESRGAN model...")
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)

    upsampler = RealESRGANer(
        scale=4,
        model_path=model_path,
        model=model,
        tile=400,  # Adjust based on GPU memory
        tile_pad=10,
        pre_pad=0,
        half=False  # Set to True if using GPU with FP16 support
    )

    print(f"[PROCESS] Restoring texture with {scale}x upscaling...")
    print("   This may take 1-2 minutes for large textures...")

    try:
        # Perform restoration
        output, _ = upsampler.enhance(img, outscale=scale)

        # Save restored texture
        print(f"\n[SAVE] Saving restored texture to: {output_path}")
        cv2.imwrite(output_path, output, [cv2.IMWRITE_JPEG_QUALITY, 95])

        restored_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"[OK] Restoration complete!")
        print(f"[INFO] Restored size: {output.shape[1]}x{output.shape[0]} ({restored_size:.2f} MB)")
        print(f"[RESULT] Quality improvement: {scale}x upscale with AI enhancement")

        return True

    except Exception as e:
        print(f"[ERROR] Restoration failed: {e}")
        print("\nTroubleshooting:")
        print("1. Ensure you have enough RAM (8GB+ recommended)")
        print("2. Try reducing tile size in code (line 66)")
        print("3. Check GPU availability for faster processing")
        return False


if __name__ == "__main__":
    # Configuration
    PROJECT_ROOT = Path(__file__).parent
    TEXTURE_DIR = PROJECT_ROOT / "src" / "main" / "resources" / "exhibit_models" / \
                  "kneeling-attendant-bodhisattva" / "source" / "obj" / "obj"

    INPUT_FILE = "1924_70_Bodhisattva-1mil.jpg"
    OUTPUT_FILE = "1924_70_Bodhisattva-1mil_restored_ai.jpg"

    input_path = str(TEXTURE_DIR / INPUT_FILE)
    output_path = str(TEXTURE_DIR / OUTPUT_FILE)

    if not os.path.exists(input_path):
        print(f"[ERROR] Texture file not found: {input_path}")
        sys.exit(1)

    print("Choose restoration scale:")
    print("1. 2x upscale (recommended - faster, good quality)")
    print("2. 4x upscale (best quality, slower, larger file)")
    print()

    choice = input("Enter choice (1/2, default=1): ").strip() or "1"

    scale = 2 if choice == "1" else 4

    success = restore_texture_ai(input_path, output_path, scale=scale)

    if success:
        print("\n" + "="*70)
        print("[SUCCESS] AI Restoration Complete!")
        print("="*70)
        print("\nNext steps:")
        print(f"1. View restored texture: {output_path}")
        print(f"2. Compare with original: {input_path}")
        print("3. Update model.flexmi to use restored texture:")
        print(f'   textureLocation="/exhibit_models/.../1924_70_Bodhisattva-1mil_restored_ai.jpg"')
        print("4. Refresh browser to see the restored texture on the 3D model")
        print("="*70)
    else:
        print("\n[ERROR] Restoration failed. Please check error messages above.")
        sys.exit(1)
