@echo off
echo ============================================
echo Installing Real-ESRGAN for Texture Restoration
echo ============================================
echo.

echo Step 1/3: Installing PyTorch and torchvision (CPU version)...
echo This may take a few minutes...
echo Note: Using compatible versions for Real-ESRGAN
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cpu

echo.
echo Step 2/3: Installing OpenCV...
pip install opencv-python

echo.
echo Step 3/3: Installing Real-ESRGAN and dependencies...
pip install basicsr
pip install facexlib
pip install gfpgan
pip install realesrgan

echo.
echo ============================================
echo Verifying Installation...
echo ============================================
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"
python -c "import realesrgan; print('Real-ESRGAN: OK')"

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.
echo You can now run: python restore_texture_ai.py
pause
