"""
U-Net Inpainting Model for Dunhuang Mural/Sculpture Pigment Restoration
Trained on the MuralDH dataset (segmentation subset).

Architecture: U-Net with skip connections
Input: 4-channel (RGB image + 1-channel binary mask of damaged regions)
Output: 3-channel restored RGB image
"""

import torch
import torch.nn as nn


class ConvBlock(nn.Module):
    """Double convolution block with BatchNorm and ReLU."""
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.block(x)


class UNetInpainter(nn.Module):
    """
    U-Net for mural inpainting.
    Input: (B, 4, H, W) — RGB + mask
    Output: (B, 3, H, W) — restored RGB
    """
    def __init__(self, in_channels=4, out_channels=3, features=None):
        super().__init__()
        if features is None:
            features = [64, 128, 256, 512]

        # Encoder
        self.encoders = nn.ModuleList()
        self.pools = nn.ModuleList()
        ch = in_channels
        for f in features:
            self.encoders.append(ConvBlock(ch, f))
            self.pools.append(nn.MaxPool2d(2))
            ch = f

        # Bottleneck
        self.bottleneck = ConvBlock(features[-1], features[-1] * 2)

        # Decoder
        self.upconvs = nn.ModuleList()
        self.decoders = nn.ModuleList()
        rev = list(reversed(features))
        ch = features[-1] * 2
        for f in rev:
            self.upconvs.append(nn.ConvTranspose2d(ch, f, 2, stride=2))
            self.decoders.append(ConvBlock(f * 2, f))
            ch = f

        # Final 1x1 conv
        self.final = nn.Conv2d(features[0], out_channels, 1)

    def forward(self, x):
        skips = []
        for enc, pool in zip(self.encoders, self.pools):
            x = enc(x)
            skips.append(x)
            x = pool(x)

        x = self.bottleneck(x)

        for upconv, dec, skip in zip(self.upconvs, self.decoders, reversed(skips)):
            x = upconv(x)
            # Handle size mismatch from odd dimensions
            if x.shape != skip.shape:
                x = nn.functional.interpolate(x, size=skip.shape[2:])
            x = torch.cat([skip, x], dim=1)
            x = dec(x)

        return torch.sigmoid(self.final(x))


def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == '__main__':
    model = UNetInpainter()
    print(f"UNetInpainter: {count_params(model):,} trainable parameters")
    dummy = torch.randn(1, 4, 256, 256)
    out = model(dummy)
    print(f"Input: {dummy.shape} -> Output: {out.shape}")
