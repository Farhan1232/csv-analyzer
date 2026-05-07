#!/bin/bash
set -e

echo "========================================"
echo "  CSV Analyzer Pro — Setup Script"
echo "========================================"

# Step 1: Rust toolchain
echo ""
echo "[1/4] Checking Rust..."
source ~/.cargo/env 2>/dev/null || true
if ! command -v rustc &>/dev/null; then
  echo "Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source ~/.cargo/env
fi
rustc --version

# Step 2: System dependencies (requires sudo)
echo ""
echo "[2/4] Installing system dependencies (requires sudo)..."
sudo apt-get update -qq
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  pkg-config \
  build-essential \
  libgtk-3-dev

# Step 3: npm install
echo ""
echo "[3/4] Installing npm dependencies..."
npm install

# Step 4: Generate icons
echo ""
echo "[4/4] Generating app icons..."
source ~/.cargo/env
cargo tauri icon src-tauri/icons/app-icon.png 2>/dev/null || true

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "  Run: npm run tauri dev"
echo "========================================"
