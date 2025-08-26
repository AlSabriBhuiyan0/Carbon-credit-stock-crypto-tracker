#!/usr/bin/env python3

import sys
import json
import os
import time

def main():
    print("Testing network connectivity and UNFCCC service...")
    
    # Step 1: Basic imports
    try:
        from unfccc_di_api import ZenodoReader
        print("✅ Step 1: UNFCCC package imported")
    except Exception as e:
        print(f"❌ Step 1 failed: {e}")
        return
    
    # Step 2: Test network connectivity
    try:
        import urllib.request
        print("✅ Step 2: Network libraries available")
    except Exception as e:
        print(f"❌ Step 2 failed: {e}")
        return
    
    # Step 3: Test basic internet connectivity
    try:
        print("Testing internet connectivity...")
        response = urllib.request.urlopen('https://httpbin.org/get', timeout=10)
        print("✅ Step 3: Internet connectivity working")
    except Exception as e:
        print(f"❌ Step 3 failed: {e}")
        return
    
    # Step 4: Try Zenodo with timeout
    try:
        print("Testing Zenodo connection with timeout...")
        start_time = time.time()
        
        # Try to create ZenodoReader with a timeout approach
        zenodo_reader = None
        try:
            zenodo_reader = ZenodoReader()
            print(f"✅ Step 4: ZenodoReader created in {time.time() - start_time:.2f}s")
        except Exception as e:
            print(f"❌ Step 4 failed: {e}")
            return
            
    except Exception as e:
        print(f"❌ Step 4 failed: {e}")
        return
    
    # Step 5: Return result
    result = {
        "status": "success",
        "steps_completed": 4,
        "message": "Network and UNFCCC service test passed"
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
