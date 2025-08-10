# Zendesk Knowledge Base Article Exporter

This script extracts knowledge articles from Zendesk and exports them to CSV format with the following information:
- Article titles
- Article links
- Article author name
- Author ID
- Views count
- Additional metadata (article ID, creation date, status)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Get Your Zendesk API Token
1. Log into your Zendesk Admin Center
2. Go to **Channels** > **API** > **Token Access**
3. Click **Add API token**
4. Give it a name (e.g., "Article Export")
5. Copy the generated token

### 3. Run the Export

#### Option A: Using Command Line Arguments
```bash
python zendesk_export.py \
  --subdomain your-subdomain \
  --email your-email@company.com \
  --api-token your-api-token
```

#### Option B: Using Configuration File
1. Copy the example config:
   ```bash
   cp zendesk_config.env.example zendesk_config.env
   ```

2. Edit `zendesk_config.env` with your details:
   ```env
   ZENDESK_SUBDOMAIN=your-subdomain
   ZENDESK_EMAIL=your-email@company.com
   ZENDESK_API_TOKEN=your-api-token
   ```

3. Run the script:
   ```bash
   python zendesk_export.py --config-file zendesk_config.env
   ```

## 📊 Output Format

The script generates a CSV file with the following columns:

| Column | Description |
|--------|-------------|
| `article_title` | Title of the knowledge article |
| `article_link` | Direct link to the article |
| `article_author_name` | Name of the article author |
| `author_id` | Zendesk user ID of the author |
| `views` | Number of views for the article |
| `article_id` | Zendesk article ID |
| `created_at` | Article creation timestamp |
| `updated_at` | Last update timestamp |
| `status` | Article status (published/draft) |

## 🔧 Advanced Usage

### Custom Output Filename
```bash
python zendesk_export.py \
  --subdomain your-subdomain \
  --email your-email@company.com \
  --api-token your-api-token \
  --output my_articles.csv
```

### Using Environment Variables
```bash
export ZENDESK_SUBDOMAIN=your-subdomain
export ZENDESK_EMAIL=your-email@company.com
export ZENDESK_API_TOKEN=your-api-token

python zendesk_export.py \
  --subdomain $ZENDESK_SUBDOMAIN \
  --email $ZENDESK_EMAIL \
  --api-token $ZENDESK_API_TOKEN
```

## 📋 Prerequisites

### Zendesk Account Requirements
- **Admin access** to your Zendesk instance
- **API token** with appropriate permissions
- **Help Center** enabled in your Zendesk instance

### System Requirements
- Python 3.7 or higher
- Internet connection to access Zendesk API
- Sufficient disk space for CSV output

## 🔐 Security Notes

- **Never commit** your API token to version control
- **Use environment variables** or config files for sensitive data
- **Rotate API tokens** regularly for security
- **Limit token permissions** to only what's needed

## 🛠️ Troubleshooting

### Common Issues

#### "Connection failed" Error
- Verify your subdomain is correct
- Check your internet connection
- Ensure your Zendesk instance is accessible

#### "Authentication failed" Error
- Verify your email address is correct
- Check your API token is valid
- Ensure the token hasn't expired

#### "No articles found" Message
- Check if your Help Center has published articles
- Verify your account has access to the articles
- Ensure the API token has appropriate permissions

#### Rate Limiting
The script includes built-in rate limiting to respect Zendesk's API limits. If you encounter rate limiting:
- Wait a few minutes and try again
- The script will automatically retry with delays

### Debug Mode
For detailed debugging, you can modify the script to add more verbose logging:

```python
# Add this line in the script for debug output
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance

### Expected Performance
- **Small knowledge base** (< 100 articles): ~30 seconds
- **Medium knowledge base** (100-1000 articles): ~2-5 minutes
- **Large knowledge base** (> 1000 articles): ~10-30 minutes

### Optimization Tips
- The script uses pagination to handle large datasets
- Built-in rate limiting prevents API throttling
- User information is cached to reduce API calls

## 🔄 Automation

### Scheduled Exports
You can automate the export using cron jobs:

```bash
# Add to crontab for daily export at 2 AM
0 2 * * * cd /path/to/script && python zendesk_export.py --config-file zendesk_config.env
```

### Integration with Other Tools
The CSV output can be easily imported into:
- **Google Sheets** for analysis
- **Tableau** for visualization
- **Power BI** for reporting
- **Database systems** for storage

## 📝 Example Output

```csv
article_title,article_link,article_author_name,author_id,views,article_id,created_at,updated_at,status
"How to Reset Password","https://company.zendesk.com/hc/en-us/articles/123456","John Doe",12345,150,123456,"2023-01-15T10:30:00Z","2023-01-20T14:45:00Z","published"
"Product Installation Guide","https://company.zendesk.com/hc/en-us/articles/123457","Jane Smith",12346,89,123457,"2023-01-10T09:15:00Z","2023-01-10T09:15:00Z","published"
```

## 🤝 Contributing

To contribute to this script:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This script is provided as-is for educational and business use. Please ensure you comply with Zendesk's API terms of service.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Zendesk API credentials
3. Test with a small subset of articles first
4. Check Zendesk's API documentation for any changes

## 🔗 Useful Links

- [Zendesk API Documentation](https://developer.zendesk.com/api-reference/)
- [Zendesk Help Center API](https://developer.zendesk.com/api-reference/help_center/help-center-api/)
- [Zendesk Admin Center](https://admin.zendesk.com/)
