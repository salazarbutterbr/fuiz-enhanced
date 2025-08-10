#!/usr/bin/env python3
"""
Test script to validate Zendesk API connection and credentials.
Run this before the main export script to ensure everything is working.
"""

import requests
import argparse
import sys
from zendesk_export import load_config_from_file

def test_zendesk_connection(subdomain: str, email: str, api_token: str) -> bool:
    """
    Test connection to Zendesk API.
    
    Args:
        subdomain: Zendesk subdomain
        email: Zendesk email
        api_token: Zendesk API token
        
    Returns:
        True if connection successful, False otherwise
    """
    base_url = f"https://{subdomain}.zendesk.com/api/v2"
    
    session = requests.Session()
    session.auth = (f"{email}/token", api_token)
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    print(f"🔍 Testing connection to {base_url}...")
    
    try:
        # Test basic API access
        response = session.get(f"{base_url}/help_center/articles.json?per_page=1")
        response.raise_for_status()
        
        print("✅ Basic API connection successful")
        
        # Test Help Center access
        data = response.json()
        articles = data.get('articles', [])
        
        if articles:
            print(f"✅ Found {len(articles)} sample article(s)")
            article = articles[0]
            print(f"   Sample article: '{article.get('title', 'No title')}' (ID: {article.get('id')})")
        else:
            print("⚠️  No articles found in Help Center")
        
        # Test metrics API
        if articles:
            article_id = articles[0].get('id')
            metrics_response = session.get(f"{base_url}/help_center/articles/metrics.json?article_ids={article_id}")
            
            if metrics_response.status_code == 200:
                print("✅ Metrics API access successful")
            else:
                print("⚠️  Metrics API access failed (this is normal for some accounts)")
        
        # Test user information
        user_response = session.get(f"{base_url}/users/me.json")
        if user_response.status_code == 200:
            user_data = user_response.json()
            user = user_data.get('user', {})
            print(f"✅ Authenticated as: {user.get('name', 'Unknown')} ({user.get('email', 'Unknown')})")
        else:
            print("⚠️  Could not retrieve user information")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection failed: {e}")
        
        if "401" in str(e):
            print("   This usually means invalid credentials (email or API token)")
        elif "403" in str(e):
            print("   This usually means insufficient permissions")
        elif "404" in str(e):
            print("   This usually means invalid subdomain")
        
        return False

def main():
    parser = argparse.ArgumentParser(description="Test Zendesk API connection")
    parser.add_argument('--subdomain', help='Your Zendesk subdomain')
    parser.add_argument('--email', help='Your Zendesk email address')
    parser.add_argument('--api-token', help='Your Zendesk API token')
    parser.add_argument('--config-file', help='Path to .env file containing configuration')
    
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
    
    # Test connection
    success = test_zendesk_connection(subdomain, email, api_token)
    
    if success:
        print("\n🎉 Connection test successful! You can now run the main export script.")
        print("   python zendesk_export.py --subdomain", subdomain, "--email", email, "--api-token", api_token[:10] + "...")
    else:
        print("\n❌ Connection test failed. Please check your credentials and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
