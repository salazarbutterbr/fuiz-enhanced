#!/bin/bash

# 🚀 Fuiz Enhanced - Deployment Script

echo "🎯 Fuiz Enhanced - Deployment Script"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "📖 See SETUP.md for installation instructions."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating template..."
    cat > .env.local << EOF
# Backend URLs (for production)
PUBLIC_BACKEND_URL="https://api.fuiz.org"
PUBLIC_WS_URL="wss://api.fuiz.org"
PUBLIC_CORKBOARD_URL="https://corkboard.fuiz.org"

# Display URLs
PUBLIC_DISPLAY_PLAY_URL="localhost:5173"
PUBLIC_PLAY_URL="http://localhost:5173"

# Auth configuration (generate these)
AUTH_SECRET="your-secret-key-here"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
EOF
    echo "✅ Created .env.local template"
    echo "⚠️  Please update .env.local with your actual values"
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Start development server
echo "🚀 Starting development server..."
echo "📱 Open your browser and go to: http://localhost:5173"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev 