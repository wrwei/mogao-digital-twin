#!/usr/bin/env python3
"""
Restore texture to appear as if brand new
Removes aging, weathering, cracks, and discoloration
"""

import sys
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import cv2

def restore_to_new(input_path, output_path):
    """
    Restore aged texture to look brand new with vibrant colors

    Args:
        input_path: Path to original aged texture
        output_path: Path to save restored texture
    """
    print("\n" + "="*60)
    print("  Restoring Heritage Artifact to Original Vibrant Colors")
    print("="*60 + "\n")

    # Load image
    print(f"[LOAD] Loading texture: {input_path}")
    img = Image.open(input_path)
    original_size = img.size
    print(f"[INFO] Original size: {img.size[0]}x{img.size[1]} ({img.size[0]*img.size[1]//1000000} MP)")

    # Convert to OpenCV format for advanced processing
    img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

    # Step 1: Remove small cracks and imperfections with bilateral filter
    print("\n[STEP 1/6] Removing small cracks and imperfections...")
    # Bilateral filter smooths while preserving edges
    img_cv = cv2.bilateralFilter(img_cv, d=9, sigmaColor=75, sigmaSpace=75)

    # Step 2: Reduce large cracks with inpainting-like blur
    print("[STEP 2/6] Smoothing surface damage...")
    # Create a slightly blurred version to fill in damaged areas
    blurred = cv2.GaussianBlur(img_cv, (5, 5), 0)
    # Blend original with blurred to soften damage
    img_cv = cv2.addWeighted(img_cv, 0.7, blurred, 0.3, 0)

    # Step 3: Aggressive color restoration - bring back original vibrant colors
    print("[STEP 3/6] Restoring original vibrant colors...")
    # Convert to LAB color space for better color manipulation
    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # Significantly increase lightness to remove heavy darkening from age
    l = cv2.add(l, 35)  # Much brighter than before
    l = np.clip(l, 0, 255)

    # Enhance color channels to restore original pigmentation
    # Increase both a and b channels to bring back color
    a = np.clip(a.astype(np.int16) * 1.5, 0, 255).astype(np.uint8)  # Boost red/green channel
    b = np.clip(b.astype(np.int16) * 1.5, 0, 255).astype(np.uint8)  # Boost blue/yellow channel

    lab = cv2.merge([l, a, b])
    img_cv = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    # Convert back to PIL for remaining enhancements
    img = Image.fromarray(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))

    # Step 4: Dramatically enhance color vibrancy (restore original pigment brightness)
    print("[STEP 4/6] Dramatically enhancing color vibrancy...")
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(3.5)  # Much more aggressive saturation boost

    # Step 5: Increase brightness to simulate fresh pigments
    print("[STEP 5/6] Brightening to simulate fresh pigments...")
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.3)  # Brighten overall

    # Step 6: Increase contrast (restore depth)
    print("[STEP 6/6] Restoring visual depth...")
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.4)  # More contrast

    # Step 7: Sharpen details to bring out fine painted features
    print("[STEP 7/7] Sharpening fine details...")
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=2))

    # Save result
    print(f"\n[SAVE] Saving restored texture: {output_path}")
    img.save(output_path, quality=95, optimize=True)

    # Get file size
    import os
    output_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[INFO] Restored texture: {img.size[0]}x{img.size[1]} ({output_size:.2f} MB)")

    print("\n" + "="*60)
    print("  [OK] Restoration Complete!")
    print("  The texture now shows vibrant original colors")
    print("  as if freshly painted and undamaged")
    print("="*60 + "\n")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python restore_to_new.py <input_image> <output_image>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        restore_to_new(input_path, output_path)
    except Exception as e:
        print(f"\n[ERROR] Restoration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
