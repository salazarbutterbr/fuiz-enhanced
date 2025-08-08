# Fuiz Enhanced - Multi-Language Quiz Platform

A modern, enhanced version of the Fuiz quiz platform with support for multiple languages and comprehensive CSV export functionality.

## 🌟 Enhanced Features

### 🌍 Multi-Language Support
- **8 Supported Languages**: English, Spanish, French, Portuguese, Russian, Chinese (Simplified), Vietnamese, Turkish
- **Participant Language Selection**: Users choose their preferred language when joining a quiz
- **Localized Content**: Quiz questions, answers, and UI elements are displayed in the selected language
- **Browser Language Detection**: Automatically suggests the user's preferred language

### 📊 CSV Export Functionality
- **Participant Data Export**: Complete participant information including nicknames, scores, and team assignments
- **Detailed Answer Analysis**: Individual question responses, correctness, and response times
- **Summary Statistics**: Overall quiz performance metrics and analytics
- **Multiple Export Formats**: 
  - Participant Data (comprehensive)
  - Summary Statistics (overview)
  - Detailed Analysis (rankings and percentiles)

### 🎯 Quiz Management
- **Real-time Hosting**: Live quiz hosting with participant management
- **Language-specific Quizzes**: Create and manage quizzes in multiple languages
- **Participant Tracking**: Monitor real-time participation and performance
- **Export Options**: Download results in various CSV formats

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun 1.2+
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fuiz-enhanced
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```bash
   # Backend URLs (for production)
   PUBLIC_BACKEND_URL="https://api.fuiz.org"
   PUBLIC_WS_URL="wss://api.fuiz.org"
   PUBLIC_CORKBOARD_URL="https://corkboard.fuiz.org"
   
   # Display URLs
   PUBLIC_DISPLAY_PLAY_URL="localhost:5173"
   PUBLIC_PLAY_URL="http://localhost:5173"
   
   # Auth configuration
   AUTH_SECRET="your-secret-key"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   ```

4. **Start development server**
   ```bash
   bun run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage

### For Hosts

1. **Create a Quiz**
   - Navigate to `/create`
   - Select the primary language for your quiz
   - Add questions and answers
   - Save your quiz

2. **Host a Quiz**
   - Go to `/host`
   - Enter the game ID or create a new game
   - Start the quiz session
   - Monitor participants in real-time

3. **Export Results**
   - After the quiz ends, use the export options
   - Choose from three export formats:
     - **Participant Data**: Complete participant information
     - **Summary Statistics**: Overall performance metrics
     - **Detailed Analysis**: Rankings and detailed analytics

### For Participants

1. **Join a Quiz**
   - Navigate to `/play/[gameId]`
   - Select your preferred language
   - Enter your nickname
   - Join the game

2. **Take the Quiz**
   - Answer questions in your selected language
   - View real-time leaderboard
   - See your performance statistics

## 🌐 Supported Languages

| Language | Code | Flag | Name |
|----------|------|------|------|
| English | `en` | 🇺🇸 | English |
| Spanish | `es` | 🇪🇸 | Español |
| French | `fr` | 🇫🇷 | Français |
| Portuguese | `pt` | 🇵🇹 | Português |
| Russian | `ru` | 🇷🇺 | Русский |
| Chinese (Simplified) | `zh-cn` | 🇨🇳 | 中文 (简体) |
| Vietnamese | `vi` | 🇻🇳 | Tiếng Việt |
| Turkish | `tr` | 🇹🇷 | Türkçe |

## 📊 CSV Export Features

### Participant Data Export
- **Basic Information**: Nickname, score, team assignment
- **Performance Metrics**: Correct answers, total questions, accuracy percentage
- **Response Times**: Total and average response times
- **Detailed Answers**: Individual question responses with correctness and timing

### Summary Statistics Export
- **Quiz Information**: Title, language, export date
- **Participant Count**: Total number of participants
- **Score Statistics**: Average, highest, and lowest scores
- **Accuracy Metrics**: Overall accuracy percentage

### Detailed Analysis Export
- **Rankings**: Participant rankings by score
- **Percentiles**: Performance percentiles
- **Response Analysis**: Fastest and slowest response times
- **Performance Breakdown**: Detailed performance metrics

## 🛠️ Technical Details

### Architecture
- **Frontend**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: Inlang Paraglide
- **CSV Export**: PapaParse library
- **Real-time Communication**: WebSocket connections

### Key Components
- `LanguageManager`: Handles language selection and management
- `CSVExporter`: Manages CSV export functionality
- `ParticipantData`: Type definitions for participant information
- `QuizTranslation`: Multi-language quiz content management

### File Structure
```
src/
├── lib/
│   ├── utils/
│   │   ├── languageManager.ts    # Language management
│   │   └── csvExport.ts         # CSV export functionality
│   └── types.ts                 # TypeScript definitions
├── routes/
│   ├── host/                    # Host interface
│   ├── play/                    # Participant interface
│   └── create/                  # Quiz creation
└── messages/                    # Translation files
```

## 🔧 Configuration

### Adding New Languages
1. Add language configuration to `LanguageManager`
2. Create translation file in `messages/`
3. Update the `AvailableLanguageTag` type
4. Add language-specific content

### Customizing Export Fields
Modify the `exportFields` array in the host component to include/exclude specific data:
```typescript
let exportFields: ('nickname' | 'score' | 'team' | 'answers' | 'response_time')[] = 
  ['nickname', 'score', 'team'];
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the GNU AGPLv3 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Based on the original [Fuiz](https://gitlab.com/fuiz/website) project
- Enhanced with multi-language support and CSV export functionality
- Built with modern web technologies for optimal user experience

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the original Fuiz documentation

---

**Fuiz Enhanced** - Making quizzes accessible in multiple languages with comprehensive analytics! 🎯🌍📊 