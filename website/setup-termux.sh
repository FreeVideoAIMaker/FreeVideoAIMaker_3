#!/bin/bash
# ========================================================
# FreeVideoAIMaker - Automated Termux Environment Installer
# ========================================================

echo "----------------------------------------------------"
echo "  Preparing FreeVideoAIMaker on Termux (Android)..."
echo "----------------------------------------------------"

# 1. Keep Termux awake in background
if command -v termux-wake-lock &> /dev/null; then
    echo ">> Enabling termux-wake-lock (keeps server running with screen off)..."
    termux-wake-lock
fi

# 2. Update Termux packages
echo ">> Updating packages..."
pkg update -y

# 3. Install Node.js LTS and Git
echo ">> Installing Node.js and Git..."
pkg install nodejs-lts git -y

# 4. Install Project Dependencies
echo ">> Installing project npm packages..."
npm install

# 5. Build Production Client Assets
echo ">> Compiling production bundle..."
npm run build

# 6. Ensure Local Tablet Data Folders Exist
echo ">> Initializing local tablet storage folders..."
mkdir -p data/videos

echo "----------------------------------------------------"
echo "  Setup Complete! FreeVideoAIMaker is ready."
echo "----------------------------------------------------"
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "To get your instant worldwide HTTPS link, open a new session and run:"
echo "  npx cloudflared tunnel --url http://localhost:3000"
echo "----------------------------------------------------"
