"""
Dataset loader for MuralDH inpainting training.

The MuralDH segmentation subset has 1000 images with pixel-level damage annotations.
We use the damage masks to train the inpainting model:
  - Input: damaged image (original with masked regions zeroed) + binary mask
  - Target: original undamaged image

For images without paired masks, we generate synthetic damage masks
(random rectangles, irregular blobs) to augment training data.
"""

import os
import random
from pathlib import Path

import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.transforms.functional as TF


def generate_random_mask(h, w, min_rects=3, max_rects=8):
    """Generate a random irregular damage mask."""
    mask = np.zeros((h, w), dtype=np.uint8)

    # Random rectangles
    n_rects = random.randint(min_rects, max_rects)
    for _ in range(n_rects):
        rw = random.randint(w // 20, w // 4)
        rh = random.randint(h // 20, h // 4)
        rx = random.randint(0, w - rw)
        ry = random.randint(0, h - rh)
        mask[ry:ry+rh, rx:rx+rw] = 255

    # Random brush strokes (circles along a path)
    n_strokes = random.randint(1, 4)
    for _ in range(n_strokes):
        n_points = random.randint(5, 20)
        radius = random.randint(5, max(6, min(h, w) // 15))
        x, y = random.randint(0, w-1), random.randint(0, h-1)
        for _ in range(n_points):
            cx = np.clip(x + random.randint(-20, 20), 0, w-1)
            cy = np.clip(y + random.randint(-20, 20), 0, h-1)
            rr, cc = np.ogrid[-radius:radius+1, -radius:radius+1]
            circle = rr**2 + cc**2 <= radius**2
            y_start = max(0, cy - radius)
            y_end = min(h, cy + radius + 1)
            x_start = max(0, cx - radius)
            x_end = min(w, cx + radius + 1)
            circle_crop = circle[
                y_start - (cy - radius):y_end - (cy - radius),
                x_start - (cx - radius):x_end - (cx - radius)
            ]
            mask[y_start:y_end, x_start:x_end][circle_crop] = 255
            x, y = cx, cy

    return mask


class MuralInpaintingDataset(Dataset):
    """
    Dataset for mural inpainting training.

    Args:
        image_dir: Directory containing mural images (PNG/JPG)
        mask_dir: Optional directory containing damage masks (matched by filename)
        image_size: Resize images to this size (square)
        augment: Whether to apply data augmentation
        synthetic_mask_ratio: Fraction of samples that get synthetic masks
                              when no real mask exists (0-1)
    """
    def __init__(self, image_dir, mask_dir=None, image_size=256,
                 augment=True, synthetic_mask_ratio=1.0):
        self.image_size = image_size
        self.augment = augment
        self.synthetic_mask_ratio = synthetic_mask_ratio

        # Collect image paths
        exts = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff'}
        self.image_paths = sorted([
            p for p in Path(image_dir).rglob('*')
            if p.suffix.lower() in exts
        ])

        # Match masks if mask_dir provided
        self.mask_map = {}
        if mask_dir and os.path.isdir(mask_dir):
            for mp in Path(mask_dir).rglob('*'):
                if mp.suffix.lower() in exts:
                    self.mask_map[mp.stem] = mp

        print(f"Dataset: {len(self.image_paths)} images, "
              f"{len(self.mask_map)} matched masks")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        # Load image
        img_path = self.image_paths[idx]
        img = Image.open(img_path).convert('RGB')
        img = img.resize((self.image_size, self.image_size), Image.LANCZOS)

        # Load or generate mask
        stem = img_path.stem
        if stem in self.mask_map:
            mask = Image.open(self.mask_map[stem]).convert('L')
            mask = mask.resize((self.image_size, self.image_size), Image.NEAREST)
            mask = np.array(mask)
            # Binarise: damaged = 255, intact = 0
            mask = (mask > 127).astype(np.uint8) * 255
        else:
            mask = generate_random_mask(self.image_size, self.image_size)

        # Augmentation
        if self.augment:
            if random.random() > 0.5:
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
                mask = np.fliplr(mask).copy()
            if random.random() > 0.5:
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
                mask = np.flipud(mask).copy()
            if random.random() > 0.5:
                k = random.choice([1, 2, 3])
                img = img.rotate(k * 90, expand=False)
                mask = np.rot90(mask, k).copy()

        # Convert to tensors
        img_tensor = TF.to_tensor(img)  # (3, H, W), [0, 1]
        mask_tensor = torch.from_numpy(mask).float().unsqueeze(0) / 255.0  # (1, H, W), {0, 1}

        # Create damaged input: zero out masked regions
        damaged = img_tensor * (1 - mask_tensor)

        # Input: damaged RGB + mask channel = 4 channels
        input_tensor = torch.cat([damaged, mask_tensor], dim=0)  # (4, H, W)

        return input_tensor, img_tensor  # input, target


if __name__ == '__main__':
    # Quick test with a dummy directory
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a dummy image
        dummy = Image.fromarray(np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8))
        dummy.save(os.path.join(tmpdir, 'test.png'))

        ds = MuralInpaintingDataset(tmpdir, image_size=256, augment=False)
        inp, tgt = ds[0]
        print(f"Input shape: {inp.shape}, Target shape: {tgt.shape}")
        print(f"Input range: [{inp.min():.3f}, {inp.max():.3f}]")
        print(f"Mask channel unique values: {inp[3].unique()}")
