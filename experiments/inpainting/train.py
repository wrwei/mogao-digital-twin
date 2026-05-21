"""
Training script for the mural inpainting U-Net.

Usage:
    python train.py --data_dir /path/to/muraldh/images
                    --mask_dir /path/to/muraldh/masks  (optional)
                    --epochs 50
                    --batch_size 8
                    --lr 1e-4
                    --output_dir ./checkpoints

The trained model is exported to ONNX for browser deployment via ONNX Runtime Web,
and also saved as a PyTorch checkpoint.
"""

import argparse
import os
import time

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from model import UNetInpainter
from dataset import MuralInpaintingDataset


class CombinedLoss(nn.Module):
    """L1 + perceptual-style loss (MSE on features not needed for CPU training)."""
    def __init__(self, l1_weight=0.7, mse_weight=0.3):
        super().__init__()
        self.l1 = nn.L1Loss()
        self.mse = nn.MSELoss()
        self.l1_weight = l1_weight
        self.mse_weight = mse_weight

    def forward(self, pred, target):
        return self.l1_weight * self.l1(pred, target) + self.mse_weight * self.mse(pred, target)


def train_one_epoch(model, loader, optimizer, criterion, device, epoch):
    model.train()
    total_loss = 0
    for batch_idx, (inputs, targets) in enumerate(loader):
        inputs, targets = inputs.to(device), targets.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

        if (batch_idx + 1) % 10 == 0:
            print(f"  Epoch {epoch} [{batch_idx+1}/{len(loader)}] "
                  f"loss: {loss.item():.6f}")

    return total_loss / len(loader)


def validate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    with torch.no_grad():
        for inputs, targets in loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            total_loss += loss.item()
    return total_loss / len(loader)


def export_onnx(model, output_path, image_size=256):
    """Export model to ONNX for browser deployment."""
    model.eval()
    dummy = torch.randn(1, 4, image_size, image_size)
    torch.onnx.export(
        model, dummy, output_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch', 2: 'height', 3: 'width'},
            'output': {0: 'batch', 2: 'height', 3: 'width'}
        },
        opset_version=13
    )
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"ONNX model exported: {output_path} ({size_mb:.1f} MB)")


def main():
    parser = argparse.ArgumentParser(description='Train mural inpainting U-Net')
    parser.add_argument('--data_dir', type=str, required=True,
                        help='Directory containing mural images')
    parser.add_argument('--mask_dir', type=str, default=None,
                        help='Directory containing damage masks (optional)')
    parser.add_argument('--output_dir', type=str, default='./checkpoints',
                        help='Output directory for checkpoints')
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--batch_size', type=int, default=4)
    parser.add_argument('--lr', type=float, default=1e-4)
    parser.add_argument('--image_size', type=int, default=256)
    parser.add_argument('--val_split', type=float, default=0.1)
    parser.add_argument('--features', type=str, default='32,64,128,256',
                        help='U-Net feature sizes (comma-separated)')
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")

    # Dataset
    features = [int(x) for x in args.features.split(',')]
    dataset = MuralInpaintingDataset(
        args.data_dir,
        mask_dir=args.mask_dir,
        image_size=args.image_size,
        augment=True
    )

    # Train/val split
    val_size = max(1, int(len(dataset) * args.val_split))
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])
    # Disable augmentation for validation
    val_ds.dataset.augment = False

    train_loader = DataLoader(train_ds, batch_size=args.batch_size,
                              shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size,
                            shuffle=False, num_workers=0, pin_memory=True)

    print(f"Train: {train_size}, Val: {val_size}")
    print(f"U-Net features: {features}")

    # Model
    model = UNetInpainter(in_channels=4, out_channels=3, features=features).to(device)
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=5, verbose=True
    )
    criterion = CombinedLoss()

    best_val_loss = float('inf')

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, device, epoch)
        val_loss = validate(model, val_loader, criterion, device)
        elapsed = time.time() - t0

        scheduler.step(val_loss)

        print(f"Epoch {epoch}/{args.epochs} — "
              f"train_loss: {train_loss:.6f}, val_loss: {val_loss:.6f}, "
              f"time: {elapsed:.1f}s, lr: {optimizer.param_groups[0]['lr']:.2e}")

        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            ckpt_path = os.path.join(args.output_dir, 'best_model.pt')
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': val_loss,
                'features': features,
                'image_size': args.image_size,
            }, ckpt_path)
            print(f"  ** Best model saved (val_loss: {val_loss:.6f})")

        # Periodic checkpoint
        if epoch % 10 == 0:
            ckpt_path = os.path.join(args.output_dir, f'checkpoint_epoch{epoch}.pt')
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'val_loss': val_loss,
                'features': features,
            }, ckpt_path)

    # Export best model to ONNX
    print("\nExporting best model to ONNX...")
    best_ckpt = torch.load(os.path.join(args.output_dir, 'best_model.pt'),
                           weights_only=True)
    model.load_state_dict(best_ckpt['model_state_dict'])
    onnx_path = os.path.join(args.output_dir, 'mural_inpainter.onnx')
    export_onnx(model, onnx_path, args.image_size)

    print(f"\nTraining complete. Best val_loss: {best_val_loss:.6f}")
    print(f"Checkpoint: {args.output_dir}/best_model.pt")
    print(f"ONNX model: {onnx_path}")


if __name__ == '__main__':
    main()
