#!/usr/bin/env python3

import sys
import json
import os

def main():
    print("Testing UNFCCC service step by step...")
    
    # Step 1: Basic imports
    try:
        from unfccc_di_api import ZenodoReader
        print("✅ Step 1: UNFCCC package imported")
    except Exception as e:
        print(f"❌ Step 1 failed: {e}")
        return
    
    # Step 2: Create service instance
    try:
        # Simplified service without complex initialization
        zenodo_reader = ZenodoReader()
        print("✅ Step 2: ZenodoReader created")
    except Exception as e:
        print(f"❌ Step 2 failed: {e}")
        return
    
    # Step 3: Test basic query
    try:
        # Test with a small query
        data_df = zenodo_reader.query(party_code='USA')
        print(f"✅ Step 3: Data query successful, got {len(data_df)} records")
    except Exception as e:
        print(f"❌ Step 3 failed: {e}")
        return
    
    # Step 4: Return result
    result = {
        "status": "success",
        "steps_completed": 3,
        "records_found": len(data_df),
        "message": "UNFCCC service test passed"
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
