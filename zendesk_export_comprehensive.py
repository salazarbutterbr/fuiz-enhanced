#!/usr/bin/env python3
"""
Comprehensive Zendesk Knowledge Base Article Exporter

This script tries multiple methods to extract view counts:
1. Standard API metrics
2. Individual article metrics
3. Analytics API
4. Web scraping from Help Center
5. Alternative endpoints
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
import re
from urllib.parse import urljoin

class ZendeskComprehensiveExporter:
    def __init__(self, subdomain: str, email: str, api_token: str):
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
        
        # Web scraping session
        self.web_session = requests.Session()
        self.web_session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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
        """Retrieve all knowledge articles from Zendesk."""
        articles = []
        page = 1
        per_page = 100
        
        print("📚 Fetching articles from Zendesk...")
        
        while True:
            try:
                url = f"{self.base_url}/help_center/articles.json"
                params = {
                    'per_page': per_page,
                    'page': page,
                    'include': 'users'
                }
                
                response = self.session.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                current_articles = data.get('articles', [])
                
                if not current_articles:
                    break
                
                articles.extend(current_articles)
                print(f"   Retrieved {len(current_articles)} articles (page {page})")
                
                if len(current_articles) < per_page:
                    break
                    
                page += 1
                time.sleep(0.1)
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Error fetching articles on page {page}: {e}")
                break
        
        print(f"✅ Total articles retrieved: {len(articles)}")
        return articles
    
    def get_user_info_direct(self, user_id: int) -> Dict:
        """Fetch user information directly from Zendesk API."""
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
            return {
                'name': f'Unknown Author (ID: {user_id})',
                'id': user_id,
                'email': ''
            }
    
    def try_metrics_method_1(self, article_ids: List[int]) -> Dict[int, Dict]:
        """Method 1: Standard metrics API"""
        print("   Trying Method 1: Standard metrics API...")
        metrics = {}
        
        try:
            url = f"{self.base_url}/help_center/articles/metrics.json"
            params = {'article_ids': ','.join(map(str, article_ids))}
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
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
                print(f"     ✅ Retrieved metrics for {len(metrics)} articles")
                return metrics
            else:
                print(f"     ❌ Failed: {response.status_code}")
        except Exception as e:
            print(f"     ❌ Exception: {e}")
        
        return metrics
    
    def try_metrics_method_2(self, article_ids: List[int]) -> Dict[int, Dict]:
        """Method 2: Individual article metrics"""
        print("   Trying Method 2: Individual article metrics...")
        metrics = {}
        
        for i, article_id in enumerate(article_ids[:20]):  # Limit to avoid rate limiting
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
                
                if i % 5 == 0:
                    print(f"     Progress: {i+1}/{min(20, len(article_ids))}")
                
                time.sleep(0.2)  # Rate limiting
                
            except Exception:
                continue
        
        if metrics:
            print(f"     ✅ Retrieved metrics for {len(metrics)} articles")
        return metrics
    
    def try_metrics_method_3(self, article_ids: List[int]) -> Dict[int, Dict]:
        """Method 3: Analytics API"""
        print("   Trying Method 3: Analytics API...")
        metrics = {}
        
        try:
            # Try different analytics endpoints
            analytics_endpoints = [
                f"{self.base_url}/analytics/reports/help_center_articles.json",
                f"{self.base_url}/analytics/reports/help_center_views.json",
                f"{self.base_url}/analytics/reports/help_center_metrics.json"
            ]
            
            for endpoint in analytics_endpoints:
                response = self.session.get(endpoint)
                if response.status_code == 200:
                    print(f"     ✅ Found working analytics endpoint: {endpoint}")
                    data = response.json()
                    # Parse analytics data to extract metrics
                    # This would need to be customized based on the actual response format
                    break
        except Exception as e:
            print(f"     ❌ Analytics API failed: {e}")
        
        return metrics
    
    def try_metrics_method_4(self, articles: List[Dict]) -> Dict[int, Dict]:
        """Method 4: Web scraping from Help Center"""
        print("   Trying Method 4: Web scraping from Help Center...")
        metrics = {}
        
        help_center_url = f"https://{self.subdomain}.zendesk.com/hc"
        
        # Test if Help Center is accessible
        try:
            response = self.web_session.get(help_center_url)
            if response.status_code != 200:
                print(f"     ❌ Help Center not accessible: {response.status_code}")
                return metrics
        except Exception as e:
            print(f"     ❌ Cannot access Help Center: {e}")
            return metrics
        
        print(f"     ✅ Help Center accessible, attempting to scrape metrics...")
        
        # Try to scrape view counts from article pages
        for i, article in enumerate(articles[:10]):  # Limit to avoid being blocked
            try:
                article_url = f"https://{self.subdomain}.zendesk.com/hc/en-us/articles/{article['id']}"
                response = self.web_session.get(article_url)
                
                if response.status_code == 200:
                    # Look for view count patterns in the HTML
                    html = response.text
                    
                    # Common patterns for view counts
                    view_patterns = [
                        r'(\d+)\s*views?',
                        r'views?:\s*(\d+)',
                        r'viewed\s*(\d+)\s*times?',
                        r'(\d+)\s*times?\s*viewed'
                    ]
                    
                    for pattern in view_patterns:
                        match = re.search(pattern, html, re.IGNORECASE)
                        if match:
                            views = int(match.group(1))
                            metrics[article['id']] = {
                                'views': views,
                                'comments': 0,
                                'votes': 0
                            }
                            print(f"     Found {views} views for article {article['id']}")
                            break
                
                if i % 3 == 0:
                    print(f"     Scraping progress: {i+1}/{min(10, len(articles))}")
                
                time.sleep(1)  # Be respectful
                
            except Exception as e:
                print(f"     Error scraping article {article['id']}: {e}")
                continue
        
        if metrics:
            print(f"     ✅ Scraped metrics for {len(metrics)} articles")
        return metrics
    
    def get_article_metrics_comprehensive(self, articles: List[Dict]) -> Dict[int, Dict]:
        """Try multiple methods to get article metrics."""
        metrics = {}
        article_ids = [article.get('id') for article in articles if article.get('id')]
        
        if not article_ids:
            return metrics
            
        print("📊 Fetching article metrics (comprehensive approach)...")
        
        # Try Method 1: Standard API
        if not metrics:
            metrics = self.try_metrics_method_1(article_ids)
        
        # Try Method 2: Individual API
        if not metrics:
            metrics = self.try_metrics_method_2(article_ids)
        
        # Try Method 3: Analytics API
        if not metrics:
            metrics = self.try_metrics_method_3(article_ids)
        
        # Try Method 4: Web scraping
        if not metrics:
            metrics = self.try_metrics_method_4(articles)
        
        if not metrics:
            print("   ⚠️  Could not retrieve metrics via any method")
            print("   This might be due to:")
            print("   - Help Center not enabled in your Zendesk instance")
            print("   - Metrics API not available in your plan")
            print("   - API permissions not configured")
        else:
            print(f"   ✅ Successfully retrieved metrics for {len(metrics)} articles")
        
        return metrics
    
    def build_users_cache_improved(self, articles: List[Dict]) -> Dict[int, Dict]:
        """Build a comprehensive cache of user information."""
        users_cache = {}
        unique_user_ids = set()
        
        for article in articles:
            author_id = article.get('author_id')
            if author_id:
                unique_user_ids.add(author_id)
        
        print(f"👥 Fetching information for {len(unique_user_ids)} unique users...")
        
        for user_id in unique_user_ids:
            if user_id not in users_cache:
                user_info = self.get_user_info_direct(user_id)
                users_cache[user_id] = user_info
                time.sleep(0.1)
        
        print(f"✅ User information cached for {len(users_cache)} users")
        return users_cache
    
    def process_articles(self, articles: List[Dict], users_cache: Dict[int, Dict], metrics: Dict[int, Dict]) -> List[Dict]:
        """Process articles and extract required information."""
        processed_articles = []
        
        print("🔧 Processing articles...")
        
        for article in articles:
            article_id = article.get('id')
            author_id = article.get('author_id')
            
            author_info = users_cache.get(author_id, {
                'name': f'Unknown Author (ID: {author_id})',
                'id': author_id,
                'email': ''
            })
            
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
                'category_id': article.get('category_id', ''),
                'vote_sum': article.get('vote_sum', 0),
                'vote_count': article.get('vote_count', 0)
            }
            
            processed_articles.append(processed_article)
        
        return processed_articles
    
    def export_to_csv(self, articles: List[Dict], filename: Optional[str] = None) -> str:
        """Export articles to CSV file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"zendesk_articles_comprehensive_{timestamp}.csv"
        
        df = pd.DataFrame(articles)
        
        column_order = [
            'article_title',
            'article_link', 
            'article_author_name',
            'author_id',
            'author_email',
            'views',
            'comments',
            'votes',
            'vote_sum',
            'vote_count',
            'article_id',
            'created_at',
            'updated_at',
            'status',
            'section_id',
            'category_id'
        ]
        
        existing_columns = [col for col in column_order if col in df.columns]
        df = df[existing_columns]
        
        df.to_csv(filename, index=False, encoding='utf-8')
        
        print(f"✅ Exported {len(articles)} articles to {filename}")
        return filename
    
    def run_export(self, output_file: Optional[str] = None) -> str:
        """Run the complete export process."""
        print("🚀 Starting Comprehensive Zendesk Knowledge Base Export")
        print(f"📋 Target: {self.subdomain}.zendesk.com")
        
        if not self.test_connection():
            raise Exception("Failed to connect to Zendesk API")
        
        articles = self.get_all_articles()
        
        if not articles:
            print("❌ No articles found")
            return ""
        
        users_cache = self.build_users_cache_improved(articles)
        metrics = self.get_article_metrics_comprehensive(articles)
        processed_articles = self.process_articles(articles, users_cache, metrics)
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
        description="Comprehensive Zendesk Knowledge Base Export with Multiple Metrics Methods",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python zendesk_export_comprehensive.py --config-file zendesk_config.env
  python zendesk_export_comprehensive.py --subdomain mycompany --email user@company.com --api-token token123
        """
    )
    
    parser.add_argument('--subdomain', help='Your Zendesk subdomain')
    parser.add_argument('--email', help='Your Zendesk email address')
    parser.add_argument('--api-token', help='Your Zendesk API token')
    parser.add_argument('--config-file', help='Path to .env file containing configuration')
    parser.add_argument('--output', help='Output CSV filename (optional)')
    
    args = parser.parse_args()
    
    if args.config_file:
        config = load_config_from_file(args.config_file)
        subdomain = config.get('ZENDESK_SUBDOMAIN') or args.subdomain
        email = config.get('ZENDESK_EMAIL') or args.email
        api_token = config.get('ZENDESK_API_TOKEN') or args.api_token
    else:
        subdomain = args.subdomain
        email = args.email
        api_token = args.api_token
    
    if not all([subdomain, email, api_token]):
        print("❌ Missing required parameters")
        print("   Please provide --subdomain, --email, and --api-token")
        print("   Or use --config-file with a .env file")
        sys.exit(1)
    
    try:
        exporter = ZendeskComprehensiveExporter(subdomain, email, api_token)
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
