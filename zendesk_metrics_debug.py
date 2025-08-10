#!/usr/bin/env python3
"""
Debug script to investigate Zendesk metrics API access and find the correct endpoints.
"""

import requests
import json
import sys
from zendesk_export import load_config_from_file

def test_metrics_endpoints(subdomain: str, email: str, api_token: str):
    """Test various metrics endpoints to find the correct one."""
    
    session = requests.Session()
    session.auth = (f"{email}/token", api_token)
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    base_url = f"https://{subdomain}.zendesk.com/api/v2"
    
    print("🔍 Testing Zendesk Metrics API Endpoints")
    print("=" * 50)
    
    # Test 1: Standard metrics endpoint
    print("\n1. Testing standard metrics endpoint...")
    try:
        url = f"{base_url}/help_center/articles/metrics.json"
        response = session.get(url)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
        else:
            print(f"   Error: {response.text[:200]}...")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 2: Individual article metrics
    print("\n2. Testing individual article metrics...")
    try:
        # First get a sample article ID
        articles_url = f"{base_url}/help_center/articles.json?per_page=1"
        articles_response = session.get(articles_url)
        if articles_response.status_code == 200:
            articles_data = articles_response.json()
            if articles_data.get('articles'):
                article_id = articles_data['articles'][0]['id']
                print(f"   Using article ID: {article_id}")
                
                url = f"{base_url}/help_center/articles/{article_id}/metrics.json"
                response = session.get(url)
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Response: {json.dumps(data, indent=2)}")
                else:
                    print(f"   Error: {response.text[:200]}...")
        else:
            print(f"   Could not get sample article: {articles_response.status_code}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 3: Analytics API endpoints
    print("\n3. Testing Analytics API endpoints...")
    analytics_endpoints = [
        f"{base_url}/analytics/reports/help_center_articles.json",
        f"{base_url}/analytics/reports/help_center_views.json",
        f"{base_url}/analytics/reports/help_center_metrics.json"
    ]
    
    for endpoint in analytics_endpoints:
        try:
            response = session.get(endpoint)
            print(f"   {endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {json.dumps(response.json(), indent=2)[:200]}...")
        except Exception as e:
            print(f"   {endpoint}: Exception - {e}")
    
    # Test 4: Help Center API with different parameters
    print("\n4. Testing Help Center API with different parameters...")
    try:
        url = f"{base_url}/help_center/articles.json"
        params = {
            'per_page': 1,
            'include': 'metrics,users'
        }
        response = session.get(url, params=params)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response keys: {list(data.keys())}")
            if data.get('articles'):
                article = data['articles'][0]
                print(f"   Article keys: {list(article.keys())}")
                if 'metrics' in article:
                    print(f"   Metrics: {json.dumps(article['metrics'], indent=2)}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 5: Check API access and permissions
    print("\n5. Testing API access and permissions...")
    try:
        # Test user info
        user_response = session.get(f"{base_url}/users/me.json")
        print(f"   User API: {user_response.status_code}")
        if user_response.status_code == 200:
            user_data = user_response.json()
            user = user_data.get('user', {})
            print(f"   User: {user.get('name')} ({user.get('email')})")
            print(f"   Role: {user.get('role')}")
            print(f"   Permissions: {user.get('permissions', [])}")
        
        # Test Help Center access
        hc_response = session.get(f"{base_url}/help_center.json")
        print(f"   Help Center API: {hc_response.status_code}")
        if hc_response.status_code == 200:
            hc_data = hc_response.json()
            print(f"   Help Center: {hc_data.get('help_center', {}).get('name', 'Unknown')}")
    except Exception as e:
        print(f"   Exception: {e}")

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--config-file':
        config_file = sys.argv[2]
        config = load_config_from_file(config_file)
        subdomain = config.get('ZENDESK_SUBDOMAIN')
        email = config.get('ZENDESK_EMAIL')
        api_token = config.get('ZENDESK_API_TOKEN')
    else:
        print("Usage: python3 zendesk_metrics_debug.py --config-file zendesk_config.env")
        sys.exit(1)
    
    if not all([subdomain, email, api_token]):
        print("❌ Missing configuration")
        sys.exit(1)
    
    test_metrics_endpoints(subdomain, email, api_token)

if __name__ == "__main__":
    main()
