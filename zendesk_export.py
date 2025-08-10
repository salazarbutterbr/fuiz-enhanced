#!/usr/bin/env python3
"""
Zendesk Knowledge Base Article Exporter

This script extracts knowledge articles from Zendesk and exports them to CSV format.
It retrieves: article titles, article links, article author name, author ID, and views.

Requirements:
- requests
- pandas
- python-dotenv (optional, for environment variables)

Usage:
    python zendesk_export.py --subdomain your-subdomain --email your-email --api-token your-token
    python zendesk_export.py --config-file .env
"""

import requests
import pandas as pd
import argparse
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional
import time

class ZendeskExporter:
    def __init__(self, subdomain: str, email: str, api_token: str):
        """
        Initialize the Zendesk exporter.
        
        Args:
            subdomain: Your Zendesk subdomain (e.g., 'company' for company.zendesk.com)
            email: Your Zendesk email address
            api_token: Your Zendesk API token
        """
        self.subdomain = subdomain
        self.email = email
        self.api_token = api_token
        self.base_url = f"https://{subdomain}.zendesk.com/api/v2"
        self.session = requests.Session()
        self.session.auth = (f"{email}/token", api_token)
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def test_connection(self) -> bool:
        """Test the connection to Zendesk API."""
        try:
            response = self.session.get(f"{self.base_url}/help_center/articles.json?per_page=1")
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def get_all_articles(self) -> List[Dict]:
        """
        Retrieve all knowledge articles from Zendesk.
        
        Returns:
            List of article dictionaries
        """
        articles = []
        page = 1
        per_page = 100  # Maximum allowed by Zendesk
        
        print("📚 Fetching articles from Zendesk...")
        
        while True:
            try:
                url = f"{self.base_url}/help_center/articles.json"
                params = {
                    'per_page': per_page,
                    'page': page,
                    'include': 'users'  # Include user information for author details
                }
                
                response = self.session.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                current_articles = data.get('articles', [])
                
                if not current_articles:
                    break
                
                articles.extend(current_articles)
                print(f"   Retrieved {len(current_articles)} articles (page {page})")
                
                # Check if there are more pages
                if len(current_articles) < per_page:
                    break
                    
                page += 1
                
                # Rate limiting - be respectful to Zendesk API
                time.sleep(0.1)
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Error fetching articles on page {page}: {e}")
                break
        
        print(f"✅ Total articles retrieved: {len(articles)}")
        return articles
    
    def get_article_metrics(self, article_ids: List[int]) -> Dict[int, Dict]:
        """
        Get metrics (including views) for articles.
        
        Args:
            article_ids: List of article IDs
            
        Returns:
            Dictionary mapping article ID to metrics
        """
        metrics = {}
        
        if not article_ids:
            return metrics
            
        print("📊 Fetching article metrics...")
        
        # Zendesk metrics API endpoint
        try:
            url = f"{self.base_url}/help_center/articles/metrics.json"
            params = {
                'article_ids': ','.join(map(str, article_ids))
            }
            
            response = self.session.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            article_metrics = data.get('article_metrics', [])
            
            for metric in article_metrics:
                article_id = metric.get('article_id')
                if article_id:
                    metrics[article_id] = {
                        'views': metric.get('views', 0),
                        'comments': metric.get('comments', 0),
                        'votes': metric.get('votes', 0)
                    }
                    
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Warning: Could not fetch metrics: {e}")
            print("   Views will be set to 0")
        
        return metrics
    
    def get_user_info(self, user_id: int, users_cache: Dict[int, Dict]) -> Dict:
        """
        Get user information from cache or API.
        
        Args:
            user_id: User ID
            users_cache: Cache of user information
            
        Returns:
            User information dictionary
        """
        if user_id in users_cache:
            return users_cache[user_id]
        
        # If not in cache, return default values
        return {
            'name': 'Unknown Author',
            'id': user_id
        }
    
    def process_articles(self, articles: List[Dict], users_cache: Dict[int, Dict], metrics: Dict[int, Dict]) -> List[Dict]:
        """
        Process articles and extract required information.
        
        Args:
            articles: List of article dictionaries
            users_cache: Cache of user information
            metrics: Dictionary of article metrics
            
        Returns:
            List of processed article dictionaries
        """
        processed_articles = []
        
        print("🔧 Processing articles...")
        
        for article in articles:
            article_id = article.get('id')
            author_id = article.get('author_id')
            
            # Get author information
            author_info = self.get_user_info(author_id, users_cache)
            
            # Get metrics
            article_metrics = metrics.get(article_id, {})
            
            processed_article = {
                'article_title': article.get('title', ''),
                'article_link': f"https://{self.subdomain}.zendesk.com/hc/en-us/articles/{article_id}",
                'article_author_name': author_info.get('name', 'Unknown Author'),
                'author_id': author_id,
                'views': article_metrics.get('views', 0),
                'article_id': article_id,
                'created_at': article.get('created_at', ''),
                'updated_at': article.get('updated_at', ''),
                'status': article.get('draft', False) and 'draft' or 'published'
            }
            
            processed_articles.append(processed_article)
        
        return processed_articles
    
    def build_users_cache(self, articles: List[Dict]) -> Dict[int, Dict]:
        """
        Build a cache of user information from articles that include user data.
        
        Args:
            articles: List of article dictionaries
            
        Returns:
            Dictionary mapping user ID to user information
        """
        users_cache = {}
        
        # Extract user information from articles if available
        for article in articles:
            if 'user' in article and article['user']:
                user = article['user']
                user_id = user.get('id')
                if user_id:
                    users_cache[user_id] = {
                        'name': user.get('name', 'Unknown Author'),
                        'id': user_id
                    }
        
        return users_cache
    
    def export_to_csv(self, articles: List[Dict], filename: Optional[str] = None) -> str:
        """
        Export articles to CSV file.
        
        Args:
            articles: List of processed article dictionaries
            filename: Output filename (optional)
            
        Returns:
            Filename of the exported CSV
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"zendesk_articles_{timestamp}.csv"
        
        df = pd.DataFrame(articles)
        
        # Reorder columns to match requirements
        column_order = [
            'article_title',
            'article_link', 
            'article_author_name',
            'author_id',
            'views',
            'article_id',
            'created_at',
            'updated_at',
            'status'
        ]
        
        # Only include columns that exist in the dataframe
        existing_columns = [col for col in column_order if col in df.columns]
        df = df[existing_columns]
        
        df.to_csv(filename, index=False, encoding='utf-8')
        
        print(f"✅ Exported {len(articles)} articles to {filename}")
        return filename
    
    def run_export(self, output_file: Optional[str] = None) -> str:
        """
        Run the complete export process.
        
        Args:
            output_file: Output filename (optional)
            
        Returns:
            Filename of the exported CSV
        """
        print("🚀 Starting Zendesk Knowledge Base Export")
        print(f"📋 Target: {self.subdomain}.zendesk.com")
        
        # Test connection
        if not self.test_connection():
            raise Exception("Failed to connect to Zendesk API")
        
        # Get all articles
        articles = self.get_all_articles()
        
        if not articles:
            print("❌ No articles found")
            return ""
        
        # Build users cache
        users_cache = self.build_users_cache(articles)
        
        # Get article IDs for metrics
        article_ids = [article.get('id') for article in articles if article.get('id')]
        
        # Get metrics
        metrics = self.get_article_metrics(article_ids)
        
        # Process articles
        processed_articles = self.process_articles(articles, users_cache, metrics)
        
        # Export to CSV
        filename = self.export_to_csv(processed_articles, output_file)
        
        # Print summary
        print("\n📊 Export Summary:")
        print(f"   Total Articles: {len(processed_articles)}")
        print(f"   Total Views: {sum(article['views'] for article in processed_articles)}")
        print(f"   Output File: {filename}")
        
        return filename

def load_config_from_file(config_file: str) -> Dict[str, str]:
    """Load configuration from .env file."""
    config = {}
    
    try:
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip().strip('"').strip("'")
    except FileNotFoundError:
        print(f"❌ Config file {config_file} not found")
        sys.exit(1)
    
    return config

def main():
    parser = argparse.ArgumentParser(
        description="Export Zendesk Knowledge Base articles to CSV",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python zendesk_export.py --subdomain mycompany --email user@company.com --api-token token123
  python zendesk_export.py --config-file .env
  python zendesk_export.py --subdomain mycompany --email user@company.com --api-token token123 --output articles.csv
        """
    )
    
    parser.add_argument(
        '--subdomain',
        help='Your Zendesk subdomain (e.g., "company" for company.zendesk.com)'
    )
    parser.add_argument(
        '--email',
        help='Your Zendesk email address'
    )
    parser.add_argument(
        '--api-token',
        help='Your Zendesk API token'
    )
    parser.add_argument(
        '--config-file',
        help='Path to .env file containing configuration'
    )
    parser.add_argument(
        '--output',
        help='Output CSV filename (optional)'
    )
    
    args = parser.parse_args()
    
    # Load configuration
    if args.config_file:
        config = load_config_from_file(args.config_file)
        subdomain = config.get('ZENDESK_SUBDOMAIN') or args.subdomain
        email = config.get('ZENDESK_EMAIL') or args.email
        api_token = config.get('ZENDESK_API_TOKEN') or args.api_token
    else:
        subdomain = args.subdomain
        email = args.email
        api_token = args.api_token
    
    # Validate required parameters
    if not all([subdomain, email, api_token]):
        print("❌ Missing required parameters")
        print("   Please provide --subdomain, --email, and --api-token")
        print("   Or use --config-file with a .env file")
        sys.exit(1)
    
    try:
        # Create exporter and run export
        exporter = ZendeskExporter(subdomain, email, api_token)
        output_file = exporter.run_export(args.output)
        
        if output_file:
            print(f"\n🎉 Export completed successfully!")
            print(f"📁 File saved as: {output_file}")
        else:
            print("\n❌ Export failed")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
