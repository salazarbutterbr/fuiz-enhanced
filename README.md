# 🎯 Fuiz Enhanced - Multi-Language Quiz Platform

A production-ready quiz platform supporting 300+ participants with multi-language support and comprehensive CSV export capabilities.

## 🌟 Features

- ✅ **300+ Participant Support** - Handle large audiences
- ✅ **8 Language Support** - English, Spanish, French, Portuguese, Russian, Chinese, Vietnamese, Turkish
- ✅ **File Upload** - Drag & drop JSON/CSV quiz files
- ✅ **Real-time Hosting** - Live quiz management with WebSockets
- ✅ **CSV Export** - Comprehensive participant data export
- ✅ **Web-based Admin** - Complete system management dashboard
- ✅ **Zero CLI Required** - Everything managed through browser

## 🚀 Quick Deploy

### Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/yourusername/fuiz-enhanced)

1. Click the Railway button above
2. Connect your GitHub account
3. Railway will automatically deploy your platform
4. Configure environment variables in Railway dashboard
5. Access your platform at the provided URL

### Manual Deployment
```bash
# Clone the repository
git clone https://github.com/yourusername/fuiz-enhanced.git
cd fuiz-enhanced

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database settings

# Run database migrations
npx prisma migrate dev

# Start the platform
npm run dev
```

## 📁 Project Structure

```
fuiz-enhanced/
├── src/                    # Frontend (SvelteKit)
│   ├── routes/            # Application routes
│   ├── lib/               # Shared utilities
│   └── app.html           # HTML template
├── server/                # Backend (Node.js + Express)
│   ├── routes/            # API endpoints
│   ├── utils/             # Backend utilities
│   └── index.js           # Server entry point
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma schema
├── messages/              # Translation files
├── static/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🎮 Usage

### Creating Quizzes
1. Access the platform at your deployed URL
2. Go to "Create Quiz" section
3. Upload JSON/CSV files with multi-language content
4. Review and create your quiz

### Hosting Quizzes
1. Go to "Host Quiz" section
2. Select your quiz
3. Start the quiz with one click
4. Monitor participants in real-time
5. Export results as CSV

### Admin Dashboard
- **System Monitoring** - Real-time health checks
- **Quiz Management** - Start/stop/delete quizzes
- **Participant Tracking** - Live participant monitoring
- **Data Export** - Download comprehensive reports
- **System Logs** - View application logs

## 📤 File Upload Support

### Supported Formats
- **JSON Files** - Complete quiz structure with translations
- **CSV Files** - Simple question-answer format

### Multi-Language Upload
- Automatic language detection
- Translation preservation
- Language validation
- Manual translation overrides

## 🌍 Language Support

### Supported Languages
- 🇺🇸 English (en)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇵🇹 Portuguese (pt)
- 🇷🇺 Russian (ru)
- 🇨🇳 Chinese (zh)
- 🇻🇳 Vietnamese (vi)
- 🇹🇷 Turkish (tr)

### Language Selection
- Participants choose language at join
- Quiz displays in selected language
- Fallback to primary language

## 📊 Data Export

### Export Types
1. **Participant Data** - Complete participant information
2. **Summary Statistics** - Quiz performance metrics
3. **Detailed Analysis** - Rankings and percentiles
4. **Complete Export** - All data in JSON format

### Export Process
- One-click export from admin dashboard
- Automatic CSV generation
- Download with timestamped filenames
- Export history tracking

## ⚙️ Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-super-secret-session-key-here

# Optional
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your database settings

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run lint` - Lint code

## 🚀 Deployment

### Railway (Recommended)
1. Fork this repository
2. Connect to Railway
3. Configure environment variables
4. Deploy automatically

### Other Platforms
- **Vercel** - Frontend deployment
- **Heroku** - Full-stack deployment
- **AWS** - Production deployment
- **Docker** - Containerized deployment

## 📈 Performance

### Scalability
- **300+ Concurrent Participants** - Tested and optimized
- **Real-time Updates** - WebSocket connections
- **Database Optimization** - Indexed queries
- **CDN Support** - Global content delivery

### Monitoring
- Real-time system health
- Performance metrics
- Error tracking
- Usage analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check the guides in the repository
- **Issues** - Report bugs on GitHub
- **Discussions** - Ask questions in GitHub Discussions

## 🎉 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Backend powered by [Express.js](https://expressjs.com/)
- Database managed with [Prisma](https://www.prisma.io/)
- Real-time features with [Socket.IO](https://socket.io/)
- Deployed on [Railway](https://railway.app/)

---

**🎯 Ready to create amazing multi-language quizzes? Deploy now and start hosting!** 