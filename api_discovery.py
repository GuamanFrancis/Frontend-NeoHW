#!/usr/bin/env python3
"""
Backend API Discovery Script
Discovers and catalogs backend endpoints for admin catalog/components
"""

import json
import urllib.request
import urllib.error
import sys
from typing import Optional, Dict, Any

BACKEND = "http://192.168.1.35:3000"
EMAIL = "admin@tudominio.com"
PASSWORD = "Admin@12345Local"
TIMEOUT = 5

def make_request(method: str, path: str, body: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
    """Make an HTTP request and return the response."""
    if headers is None:
        headers = {}
    
    url = f"{BACKEND}{path}"
    headers['Content-Type'] = 'application/json'
    headers['User-Agent'] = 'APIDiscovery/1.0'
    
    if body:
        data = json.dumps(body).encode('utf-8')
    else:
        data = None
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            response_data = response.read().decode('utf-8')
            status = response.status
            try:
                parsed = json.loads(response_data) if response_data else None
            except json.JSONDecodeError:
                parsed = None
            
            return {
                'status': status,
                'body': parsed,
                'raw': response_data
            }
    except urllib.error.HTTPError as e:
        response_data = e.read().decode('utf-8')
        try:
            parsed = json.loads(response_data) if response_data else None
        except json.JSONDecodeError:
            parsed = None
        
        return {
            'status': e.code,
            'body': parsed,
            'raw': response_data
        }
    except urllib.error.URLError as e:
        return {
            'status': 0,
            'error': str(e),
            'body': None,
            'raw': ''
        }
    except Exception as e:
        return {
            'status': 0,
            'error': str(e),
            'body': None,
            'raw': ''
        }

def main():
    print("\n" + "="*70)
    print("BACKEND API ENDPOINT DISCOVERY")
    print("="*70)
    print(f"Backend: {BACKEND}")
    print(f"Credentials: {EMAIL}\n")
    
    # Step 1: Test connectivity
    print("[1] Testing backend connectivity...")
    res = make_request('GET', '/')
    if res['status'] > 0:
        print(f"✓ Backend is reachable (Status: {res['status']})\n")
    else:
        print(f"✗ Backend connection failed: {res.get('error', 'Unknown error')}\n")
        return
    
    # Step 2: Authenticate
    token = None
    print("[2] Attempting authentication...")
    
    res = make_request('POST', '/auth/login', {
        'email': EMAIL,
        'password': PASSWORD
    })
    
    if res['status'] in (200, 201):
        print(f"✓ Auth successful at /auth/login (Status: {res['status']})")
        if res['body']:
            print(f"  Response keys: {', '.join(res['body'].keys())}")
            token = (res['body'].get('token') or 
                    res['body'].get('access_token') or 
                    res['body'].get('accessToken') or
                    (res['body'].get('data', {}).get('token') if isinstance(res['body'].get('data'), dict) else None))
            
            if token:
                print(f"✓ Token received: {token[:40]}...")
            else:
                print("✗ No token found in response")
                print(f"  Full response: {json.dumps(res['body'], indent=2)}")
    else:
        print(f"✗ Auth failed at /auth/login (Status: {res['status']})")
        print(f"  Response: {res['raw']}")
    
    if not token:
        print("\n✗ Cannot proceed without authentication token\n")
        return
    
    # Step 3: Probe endpoints
    print("\n[3] Probing catalog/component endpoints...\n")
    
    endpoints = [
        '/components',
        '/catalog',
        '/products',
        '/admin/components',
        '/admin/catalog',
        '/admin/products',
        '/api/components',
        '/api/catalog',
        '/api/products',
        '/api/admin/components',
        '/api/admin/catalog',
        '/api/admin/products',
        '/v1/components',
        '/v1/admin/components',
        '/users'
    ]
    
    auth_headers = {
        'Authorization': f'Bearer {token}'
    }
    
    discovered = []
    
    for endpoint in endpoints:
        res = make_request('GET', endpoint, headers=auth_headers)
        
        if res['status'] in (200, 201):
            print(f"✓ {endpoint}")
            print(f"  Method: GET | Status: {res['status']}")
            
            ep_info = {
                'method': 'GET',
                'path': endpoint,
                'status': res['status'],
                'body': res['body'],
                'response_keys': list(res['body'].keys()) if isinstance(res['body'], dict) else [],
                'is_list': isinstance(res['body'], list)
            }
            
            if isinstance(res['body'], list):
                if len(res['body']) > 0:
                    ep_info['item_count'] = len(res['body'])
                    ep_info['item_keys'] = list(res['body'][0].keys()) if isinstance(res['body'][0], dict) else []
                    print(f"  Type: Array ({len(res['body'])} items)")
                    if res['body'][0]:
                        print(f"  Item keys: {', '.join(ep_info['item_keys'])}")
                else:
                    print(f"  Type: Empty Array")
            elif isinstance(res['body'], dict):
                print(f"  Type: Object")
                print(f"  Keys: {', '.join(res['body'].keys())}")
                
                if 'data' in res['body'] and isinstance(res['body']['data'], list) and len(res['body']['data']) > 0:
                    ep_info['nested_data'] = True
                    ep_info['data_keys'] = list(res['body']['data'][0].keys()) if isinstance(res['body']['data'][0], dict) else []
                    print(f"  Nested data array: {len(res['body']['data'])} items")
                    if res['body']['data'][0]:
                        print(f"  Data item keys: {', '.join(ep_info['data_keys'])}")
            
            discovered.append(ep_info)
        elif res['status'] == 401:
            print(f"⊘ {endpoint} (Status: 401 Unauthorized)")
        elif res['status'] == 403:
            print(f"⊘ {endpoint} (Status: 403 Forbidden)")
        elif res['status'] == 404:
            print(f"⊘ {endpoint} (Status: 404 Not Found)")
        else:
            print(f"⊘ {endpoint} (Status: {res['status']})")
        
        print("")
    
    # Summary
    print("="*70)
    print(f"SUMMARY: Found {len(discovered)} working endpoints\n")
    
    for i, ep in enumerate(discovered, 1):
        print(f"\n{i}. {ep['path']}")
        print(f"   Method: {ep['method']}")
        print(f"   Status: {ep['status']}")
        print(f"   Response Type: {'Array' if ep['is_list'] else 'Object'}")
        
        if ep['is_list'] and ep.get('item_keys'):
            print(f"   Item Structure: {', '.join(ep['item_keys'])}")
            if ep['body'] and len(ep['body']) > 0 and isinstance(ep['body'][0], dict):
                print(f"   Sample Item:")
                sample_str = json.dumps(ep['body'][0], indent=4)
                for line in sample_str.split('\n')[:15]:
                    print(f"     {line}")
        elif ep.get('nested_data'):
            print(f"   Data Array Items: {ep.get('item_count', '?')}")
            if ep.get('data_keys'):
                print(f"   Item Structure: {', '.join(ep['data_keys'])}")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
