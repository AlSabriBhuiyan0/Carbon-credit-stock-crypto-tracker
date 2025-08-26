const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const logger = require('../middleware/errorHandler').logger;
const pythonEnvManager = require('./pythonEnvironmentManager');
const execAsync = util.promisify(exec);

class UNFCCCNodeService {
    constructor() {
        this.pythonScriptPath = path.join(__dirname, '..', 'forcasting', 'unfcccService.py');
        this.isAvailable = false;
        this.lastCheck = null;
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Check if the UNFCCC service is available
     */
    async checkAvailability() {
        try {
            if (this.lastCheck && (Date.now() - this.lastCheck) < this.checkInterval) {
                return this.isAvailable;
            }

            const status = await this.getServiceStatus();
            this.isAvailable = status.available;
            this.lastCheck = Date.now();
            
            logger.info(`UNFCCC service availability: ${this.isAvailable}`);
            return this.isAvailable;
        } catch (error) {
            logger.error('Failed to check UNFCCC service availability:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Get the status of the UNFCCC service
     */
    async getServiceStatus() {
        try {
            return await this.executePythonFunction('get_service_status');
        } catch (error) {
            logger.error('Failed to get UNFCCC service status:', error.message);
            throw error;
        }
    }

    /**
     * Execute a Python function with arguments
     */
    async executePythonFunction(functionName, args = []) {
        try {
            // Ensure Python environment is ready
            if (!pythonEnvManager.isEnvironmentReady()) {
                await pythonEnvManager.checkEnvironment();
            }

            // Execute Python script with function and args
            const command = `python3 "${this.pythonScriptPath}" --function ${functionName} --args '${JSON.stringify(args)}'`;
            console.log('🌍 UNFCCC service executing:', command);
            
            const { stdout, stderr } = await execAsync(command, { 
                timeout: 30000, // 30 second timeout
                maxBuffer: 50 * 1024 * 1024 // 50MB buffer to handle large datasets
            });
            
            if (stderr && stderr.trim()) {
                logger.warn('UNFCCC service stderr:', stderr);
            }
            
            // Parse the output
            const result = JSON.parse(stdout.trim());
            return result;
            
        } catch (error) {
            if (error.message.includes('maxBuffer')) {
                throw new Error(`UNFCCC service output too large. Consider filtering data or using pagination. Original error: ${error.message}`);
            }
            throw new Error(`UNFCCC service failed: ${error.message}`);
        }
    }

    /**
     * Get available parties (countries)
     */
    async getAvailableParties() {
        try {
            return await this.executePythonFunction('get_available_parties');
        } catch (error) {
            logger.error('Failed to get available parties:', error.message);
            throw error;
        }
    }

    /**
     * Get available greenhouse gases
     */
    async getAvailableGases() {
        try {
            return await this.executePythonFunction('get_available_gases');
        } catch (error) {
            logger.error('Failed to get available gases:', error.message);
            throw error;
        }
    }

    /**
     * Get emissions data for a specific party
     */
    async getEmissionsData(partyCode, gases = null) {
        try {
            const args = [partyCode];
            if (gases) args.push(gases);
            return await this.executePythonFunction('get_emissions_data', args);
        } catch (error) {
            logger.error('Failed to get emissions data:', error.message);
            throw error;
        }
    }

    /**
     * Get Annex I data
     */
    async getAnnexOneData(partyCodes, gases = null) {
        try {
            const args = [partyCodes];
            if (gases) args.push(gases);
            return await this.executePythonFunction('get_annex_one_data', args);
        } catch (error) {
            logger.error('Failed to get Annex I data:', error.message);
            throw error;
        }
    }

    /**
     * Get non-Annex I data
     */
    async getNonAnnexOneData(partyCodes, gases = null) {
        try {
            const args = [partyCodes];
            if (gases) args.push(gases);
            return await this.executePythonFunction('get_non_annex_one_data', args);
        } catch (error) {
            logger.error('Failed to get non-Annex I data:', error.message);
            throw error;
        }
    }

    /**
     * Get Zenodo data
     */
    async getZenodoData(partyCode) {
        try {
            return await this.executePythonFunction('get_zenodo_data', [partyCode]);
        } catch (error) {
            logger.error('Failed to get Zenodo data:', error.message);
            throw error;
        }
    }

    /**
     * Get emissions summary for multiple parties
     */
    async getEmissionsSummary(partyCodes) {
        try {
            return await this.executePythonFunction('get_emissions_summary', [partyCodes]);
        } catch (error) {
            logger.error('Failed to get emissions summary:', error.message);
            throw error;
        }
    }
}

module.exports = new UNFCCCNodeService();
