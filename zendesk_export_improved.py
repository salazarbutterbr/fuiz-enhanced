#!/usr/bin/env python3
"""
Improved Zendesk Knowledge Base Article Exporter

This script extracts knowledge articles from Zendesk and exports them to CSV format.
It retrieves: article titles, article links, article author name, author ID, and views.

Improvements:
- Better user information fetching
- Alternative metrics fetching methods
- More robust error handling
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
    
    def get_user_info_direct(self, user_id: int) -> Dict:
        """
        Fetch user information directly from Zendesk API.
        
        Args:
            user_id: User ID
            
        Returns:
            User information dictionary
        """
        try:
            url = f"{self.base_url}/users/{user_id}.json"
            response = self.session.get(url)
            response.raise_for_status()
            
            data = response.json()
            user = data.get('user', {})
            
            return {
                'name': user.get('name', 'Unknown Author'),
                'id': user_id,
                'email': user.get('email', '')
            }
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Could not fetch user {user_id}: {e}")
            return {
                'name': f'Unknown Author (ID: {user_id})',
                'id': user_id,
                'email': ''
            }
    
    def get_article_metrics_alternative(self, article_ids: List[int]) -> Dict[int, Dict]:
        """
        Try alternative methods to get article metrics.
        
        Args:
            article_ids: List of article IDs
            
        Returns:
            Dictionary mapping article ID to metrics
        """
        metrics = {}
        
        if not article_ids:
            return metrics
            
        print("📊 Fetching article metrics (alternative methods)...")
        
        # Method 1: Try the standard metrics endpoint
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
            
            print(f"✅ Retrieved metrics for {len(metrics)} articles via standard API")
            return metrics
                    
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Standard metrics API failed: {e}")
        
        # Method 2: Try individual article metrics
        print("   Trying individual article metrics...")
        for article_id in article_ids[:10]:  # Limit to first 10 to avoid rate limiting
            try:
                url = f"{self.base_url}/help_center/articles/{article_id}/metrics.json"
                response = self.session.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    metric = data.get('article_metric', {})
                    metrics[article_id] = {
                        'views': metric.get('views', 0),
                        'comments': metric.get('comments', 0),
                        'votes': metric.get('votes', 0)
                    }
                
                time.sleep(0.1)  # Rate limiting
                
            except requests.exceptions.RequestException:
                continue
        
        if metrics:
            print(f"✅ Retrieved metrics for {len(metrics)} articles via individual API")
        else:
            print("⚠️  Could not retrieve metrics via any method")
        
        return metrics
    
    def build_users_cache_improved(self, articles: List[Dict]) -> Dict[int, Dict]:
        """
        Build a comprehensive cache of user information.
        
        Args:
            articles: List of article dictionaries
            
        Returns:
            Dictionary mapping user ID to user information
        """
        users_cache = {}
        unique_user_ids = set()
        
        # Collect all unique user IDs from articles
        for article in articles:
            author_id = article.get('author_id')
            if author_id:
                unique_user_ids.add(author_id)
        
        print(f"👥 Fetching information for {len(unique_user_ids)} unique users...")
        
        # Fetch user information for each unique user
        for user_id in unique_user_ids:
            if user_id not in users_cache:
                user_info = self.get_user_info_direct(user_id)
                users_cache[user_id] = user_info
                time.sleep(0.1)  # Rate limiting
        
        print(f"✅ User information cached for {len(users_cache)} users")
        return users_cache
    
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
            author_info = users_cache.get(author_id, {
                'name': f'Unknown Author (ID: {author_id})',
                'id': author_id,
                'email': ''
            })
            
            # Get metrics
            article_metrics = metrics.get(article_id, {})
            
            processed_article = {
                'article_title': article.get('title', ''),
                'article_link': f"https://{self.subdomain}.zendesk.com/hc/en-us/articles/{article_id}",
                'article_author_name': author_info.get('name', 'Unknown Author'),
                'author_id': author_id,
                'author_email': author_info.get('email', ''),
                'views': article_metrics.get('views', 0),
                'comments': article_metrics.get('comments', 0),
                'votes': article_metrics.get('votes', 0),
                'article_id': article_id,
                'created_at': article.get('created_at', ''),
                'updated_at': article.get('updated_at', ''),
                'status': article.get('draft', False) and 'draft' or 'published',
                'section_id': article.get('section_id', ''),
                'category_id': article.get('category_id', '')
            }
            
            processed_articles.append(processed_article)
        
        return processed_articles
    
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
            filename = f"zendesk_articles_improved_{timestamp}.csv"
        
        df = pd.DataFrame(articles)
        
        # Reorder columns to match requirements
        column_order = [
            'article_title',
            'article_link', 
            'article_author_name',
            'author_id',
            'author_email',
            'views',
            'comments',
            'votes',
            'article_id',
            'created_at',
            'updated_at',
            'status',
            'section_id',
            'category_id'
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
        print("🚀 Starting Improved Zendesk Knowledge Base Export")
        print(f"📋 Target: {self.subdomain}.zendesk.com")
        
        # Test connection
        if not self.test_connection():
            raise Exception("Failed to connect to Zendesk API")
        
        # Get all articles
        articles = self.get_all_articles()
        
        if not articles:
            print("❌ No articles found")
            return ""
        
        # Build improved users cache
        users_cache = self.build_users_cache_improved(articles)
        
        # Get article IDs for metrics
        article_ids = [article.get('id') for article in articles if article.get('id')]
        
        # Get metrics using alternative methods
        metrics = self.get_article_metrics_alternative(article_ids)
        
        # Process articles
        processed_articles = self.process_articles(articles, users_cache, metrics)
        
        # Export to CSV
        filename = self.export_to_csv(processed_articles, output_file)
        
        # Print summary
        print("\n📊 Export Summary:")
        print(f"   Total Articles: {len(processed_articles)}")
        print(f"   Total Views: {sum(article['views'] for article in processed_articles)}")
        print(f"   Articles with Views: {sum(1 for article in processed_articles if article['views'] > 0)}")
        print(f"   Unique Authors: {len(set(article['author_id'] for article in processed_articles))}")
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
        description="Export Zendesk Knowledge Base articles to CSV (Improved Version)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python zendesk_export_improved.py --subdomain mycompany --email user@company.com --api-token token123
  python zendesk_export_improved.py --config-file zendesk_config.env
  python zendesk_export_improved.py --subdomain mycompany --email user@company.com --api-token token123 --output articles.csv
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
