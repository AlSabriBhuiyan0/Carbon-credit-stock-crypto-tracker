#!/usr/bin/env python3
"""
UNFCCC DI API Service for Carbon Credit Data
This service provides access to UNFCCC greenhouse gas emissions data
"""

import os
import sys
import json
import pandas as pd
from typing import Dict, List, Optional, Any
import logging

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging to be less verbose
logging.basicConfig(level=logging.WARNING)

try:
    from unfccc_di_api import UNFCCCApiReader, UNFCCCSingleCategoryApiReader, ZenodoReader
    UNFCCC_AVAILABLE = True
except ImportError:
    UNFCCC_AVAILABLE = False
    logging.warning("UNFCCC DI API package not available. Install with: pip install unfccc-di-api")

class UNFCCCService:
    """Service for accessing UNFCCC greenhouse gas emissions data"""
    
    def __init__(self):
        self.api_key = os.getenv('UNFCCC_DI_API_KEY')
        self.base_url = 'https://di.unfccc.int/api/'
        self.reader = None
        self.zenodo_reader = None
        self.use_zenodo_primary = False
        
        if UNFCCC_AVAILABLE:
            try:
                # Try to initialize the main API reader first
                if self.api_key:
                    self.reader = UNFCCCApiReader(base_url=self.base_url)
                    logging.info("UNFCCC API service initialized successfully")
                else:
                    logging.warning("No UNFCCC API key provided, using Zenodo backup")
                    self.use_zenodo_primary = True
            except Exception as e:
                logging.error(f"Failed to initialize UNFCCC API: {e}")
                self.reader = None
                self.use_zenodo_primary = True
            
            # Skip Zenodo initialization for now to avoid hanging
            # We'll implement a proper timeout mechanism later
            self.zenodo_reader = None
            logging.info("Zenodo backup disabled to prevent hanging issues")
    
    def is_available(self) -> bool:
        """Check if UNFCCC service is available"""
        return UNFCCC_AVAILABLE and self.reader is not None
    
    def get_available_parties(self) -> List[Dict[str, Any]]:
        """Get list of all available parties (countries)"""
        if not self.is_available():
            return []
        
        try:
            if self.reader:
                parties_df = self.reader.parties
                records = parties_df.to_dict('records')
                
                # Clean NaN values for JSON serialization
                for record in records:
                    for key, value in record.items():
                        if pd.isna(value):
                            record[key] = None
                return records
            else:
                return []
        except Exception as e:
            logging.error(f"Error getting parties: {e}")
            return []
    
    def get_available_gases(self) -> List[Dict[str, Any]]:
        """Get list of available greenhouse gases"""
        if not self.is_available():
            return []
        
        try:
            if self.reader:
                gases_df = self.reader.gases
                records = gases_df.to_dict('records')
                
                # Clean NaN values for JSON serialization
                for record in records:
                    for key, value in record.items():
                        if pd.isna(value):
                            record[key] = None
                return records
            else:
                return []
        except Exception as e:
            logging.error(f"Error getting gases: {e}")
            return []
    
    def get_emissions_data(self, party_code: str, gases: Optional[List[str]] = None, limit: Optional[int] = 1000) -> Dict[str, Any]:
        """
        Get emissions data for a specific party (country)
        
        Args:
            party_code: ISO code of the party (e.g., 'USA', 'GBR', 'DEU')
            gases: List of gases to query (e.g., ['CO2', 'CH4', 'N2O'])
            limit: Maximum number of records to return (default: 1000)
        
        Returns:
            Dictionary containing emissions data and metadata
        """
        if not self.is_available():
            return {"error": "UNFCCC service not available - API key required"}
        
        try:
            if self.reader:
                data_df = self.reader.query(party_code=party_code, gases=gases)
                if not data_df.empty:
                    # Limit the data if specified
                    if limit and len(data_df) > limit:
                        data_df = data_df.head(limit)
                    
                    records = data_df.to_dict('records')
                    # Clean NaN values for JSON serialization
                    for record in records:
                        for key, value in record.items():
                            if pd.isna(value):
                                record[key] = None
                    
                    # Extract unique years and categories
                    years = sorted(data_df['year'].unique().tolist()) if 'year' in data_df.columns else []
                    categories = sorted(data_df['category_name'].unique().tolist()) if 'category_name' in data_df.columns else []
                    
                    return {
                        "party_code": party_code,
                        "gases": gases or "all",
                        "data": records,
                        "source": "unfccc_api",
                        "limit_applied": limit if limit and len(data_df) > limit else None,
                        "summary": {
                            "total_records": len(records),
                            "total_available": len(data_df) if limit else len(records),
                            "years": years,
                            "categories": categories,
                            "data_columns": list(data_df.columns)
                        }
                    }
                else:
                    return {
                        "party_code": party_code,
                        "gases": gases or "all",
                        "data": [],
                        "source": "unfccc_api",
                        "message": "No data found for this party"
                    }
            else:
                return {"error": "UNFCCC API reader not available"}
            
        except Exception as e:
            logging.error(f"Error querying data for {party_code}: {e}")
            return {"error": str(e), "party_code": party_code, "source": "error"}
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get the status of the UNFCCC service"""
        return {
            "available": self.is_available(),
            "python_package_installed": UNFCCC_AVAILABLE,
            "api_initialized": self.reader is not None,
            "zenodo_available": False,  # Disabled for now
            "use_zenodo_primary": False,
            "base_url": self.base_url,
            "api_key_configured": bool(self.api_key),
            "fallback_mode": False,
            "message": "Service requires UNFCCC API key for full functionality"
        }

# Create a global instance
unfccc_service = UNFCCCService()

def main():
    """Main function to handle command-line calls from Node.js"""
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='UNFCCC API Service')
    parser.add_argument('--function', required=True, help='Function to call')
    parser.add_argument('--args', help='JSON string of arguments')
    
    args = parser.parse_args()
    
    try:
        if args.function == 'get_service_status':
            result = unfccc_service.get_service_status()
        elif args.function == 'get_available_parties':
            result = unfccc_service.get_available_parties()
        elif args.function == 'get_available_gases':
            result = unfccc_service.get_available_gases()
        elif args.function == 'get_emissions_data':
            if args.args:
                try:
                    func_args = json.loads(args.args)
                    party_code = func_args[0] if len(func_args) > 0 else 'USA'
                    gases = func_args[1] if len(func_args) > 1 else None
                    limit = func_args[2] if len(func_args) > 2 else 1000
                except json.JSONDecodeError:
                    party_code = 'USA'
                    gases = None
                    limit = 1000
            else:
                party_code = 'USA'
                gases = None
                limit = 1000
            result = unfccc_service.get_emissions_data(party_code, gases, limit)
        else:
            result = {"error": f"Unknown function: {args.function}"}
        
        # Output result as JSON
        print(json.dumps(result, default=str))
        
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result, default=str))
        sys.exit(1)

if __name__ == "__main__":
    main()


