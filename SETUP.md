# 🚀 Fuiz Enhanced - Complete Setup Guide

## Prerequisites

### Option 1: Install Node.js (Recommended)

#### On macOS:
1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```

#### On Windows:
1. Download Node.js from: https://nodejs.org/
2. Run the installer and follow the setup wizard

#### On Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Option 2: Use Online Development (Alternative)

If you can't install Node.js locally, you can use online development environments:

1. **GitHub Codespaces** (Free for public repos)
2. **Gitpod** (Free tier available)
3. **Replit** (Free tier available)

## 🛠️ Project Setup

### Step 1: Verify Installation
```bash
node --version
npm --version
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables
Create a `.env.local` file in the project root:
```bash
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
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open in Browser
Navigate to: `http://localhost:5173`

## 🎯 Quick Start (No Installation Required)

If you want to see the project working immediately without setup:

1. **Open `demo.html`** in any web browser
2. **Test the features**:
   - Create a quiz
   - Invite people
   - Join as a participant
   - Export CSV data

## 📁 Project Structure

```
fuiz-enhanced/
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── languageManager.ts    # Language management
│   │   │   ├── translationManager.ts # Translation system
│   │   │   ├── invitationManager.ts  # Invitation system
│   │   │   └── csvExport.ts         # CSV export functionality
│   │   └── types.ts                 # TypeScript definitions
│   ├── routes/
│   │   ├── create/                  # Quiz creation
│   │   ├── host/                    # Host interface
│   │   └── play/                    # Participant interface
│   └── messages/                    # Translation files
├── demo.html                        # Interactive demo
├── package.json                     # Dependencies
└── README.md                        # Documentation
```

## 🌟 Features to Test

### 1. Multi-Language Support
- Create a quiz in English
- Add Spanish, French, and other languages
- Join as participants in different languages
- Verify content appears in selected language

### 2. CSV Export
- Host a quiz with participants
- Export participant data
- Export summary statistics
- Export detailed analysis

### 3. Invitation System
- Generate invitation links
- Create QR codes
- Share via different methods
- Test participant joining

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check TypeScript
npm run check

# Format code
npm run format

# Lint code
npm run lint
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Deploy automatically

### Option 2: Netlify
1. Push code to GitHub
2. Connect to Netlify
3. Deploy automatically

### Option 3: Cloudflare Pages
1. Push code to GitHub
2. Connect to Cloudflare Pages
3. Deploy automatically

## 🐛 Troubleshooting

### Common Issues:

1. **"node not found"**
   - Install Node.js (see Prerequisites)

2. **"npm not found"**
   - Node.js installation includes npm

3. **Port 5173 already in use**
   - Kill the process: `lsof -ti:5173 | xargs kill -9`
   - Or use different port: `npm run dev -- --port 3000`

4. **Build errors**
   - Clear cache: `npm run build -- --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Try the demo.html file first to verify functionality

## 🎉 Success!

Once everything is running, you'll have:

- ✅ Multi-language quiz platform
- ✅ Real-time participant management
- ✅ CSV export functionality
- ✅ Modern, responsive UI
- ✅ Complete invitation system

**Happy quizzing! 🎯** 