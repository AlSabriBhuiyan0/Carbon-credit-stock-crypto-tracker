#!/usr/bin/env python3

import sys
import json
import time

def main():
    print("Testing Zenodo connection step by step...")
    
    try:
        # Step 1: Import
        print("Step 1: Importing UNFCCC package...")
        from unfccc_di_api import ZenodoReader
        print("✅ Import successful")
        
        # Step 2: Create reader
        print("Step 2: Creating ZenodoReader...")
        start_time = time.time()
        reader = ZenodoReader()
        print(f"✅ ZenodoReader created in {time.time() - start_time:.2f}s")
        
        # Step 3: Test simple query
        print("Step 3: Testing simple query...")
        start_time = time.time()
        
        # Try to get just metadata first
        print("  - Getting parties info...")
        parties = reader.parties
        print(f"  ✅ Parties info retrieved in {time.time() - start_time:.2f}s")
        print(f"  - Found {len(parties)} parties")
        
        # Step 4: Test actual query
        print("Step 4: Testing data query...")
        start_time = time.time()
        
        # Try with a very small query
        print("  - Querying USA data...")
        data = reader.query(party_code='USA')
        print(f"  ✅ Data query completed in {time.time() - start_time:.2f}s")
        print(f"  - Retrieved {len(data)} records")
        
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
