#!/usr/bin/env python3

import sys
import json

def main():
    print("Testing basic Python functionality...")
    
    # Test basic imports
    try:
        import pandas as pd
        print("✅ Pandas imported successfully")
    except Exception as e:
        print(f"❌ Pandas import failed: {e}")
    
    try:
        from unfccc_di_api import ZenodoReader
        print("✅ UNFCCC package imported successfully")
    except Exception as e:
        print(f"❌ UNFCCC import failed: {e}")
    
    # Test basic function call
    print("✅ Basic Python functionality working")
    
    # Return simple result
    result = {"status": "success", "message": "Basic test passed"}
    print(json.dumps(result))

if __name__ == "__main__":
    main()
