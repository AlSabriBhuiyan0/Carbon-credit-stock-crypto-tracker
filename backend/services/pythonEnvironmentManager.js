const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PythonEnvironmentManager {
    constructor() {
        this.envPath = path.join(__dirname, '..', 'python_env');
        this.pythonPath = '/usr/bin/python3';
        this.pipPath = '/usr/bin/pip3';
        this.isReady = false;
    }

    /**
     * Check if the Python environment is ready
     */
    async checkEnvironment() {
        try {
            // Check if required packages are installed
            console.log('🐍 Checking Python environment...');
            
            const packagesInstalled = await this.checkPackages();
            if (!packagesInstalled) {
                console.log('📦 Some required packages are missing, but continuing with available ones...');
                // Don't try to install packages in system Python
            }

            this.isReady = true;
            console.log('✅ Python environment is ready (using system Python)');
            return true;
        } catch (error) {
            console.error('❌ Failed to setup Python environment:', error);
            return false;
        }
    }

    /**
     * Create a new Python virtual environment
     */
    async createEnvironment() {
        return new Promise((resolve, reject) => {
            console.log('🐍 Creating Python virtual environment...');
            
            const proc = spawn('python3', ['-m', 'venv', this.envPath], {
                stdio: 'inherit'
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Virtual environment created successfully');
                    resolve();
                } else {
                    reject(new Error(`Failed to create virtual environment, exit code: ${code}`));
                }
            });

            proc.on('error', (error) => {
                reject(new Error(`Failed to create virtual environment: ${error.message}`));
            });
        });
    }

    /**
     * Check if required packages are installed
     */
    async checkPackages() {
        const requiredPackages = ['pandas', 'numpy', 'statsmodels', 'sklearn', 'prophet'];
        
        for (const pkg of requiredPackages) {
            try {
                const isInstalled = await this.checkPackage(pkg);
                if (!isInstalled) {
                    console.log(`❌ Package ${pkg} not found`);
                    return false;
                }
            } catch (error) {
                console.log(`❌ Error checking package ${pkg}:`, error.message);
                return false;
            }
        }
        
        console.log('✅ All required Python packages are available');
        return true;
    }

    /**
     * Check if a specific package is installed
     */
    async checkPackage(packageName) {
        return new Promise((resolve) => {
            const proc = spawn(this.pythonPath, ['-c', `import ${packageName}; print('OK')`], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (code) => {
                resolve(code === 0 && output.includes('OK'));
            });

            proc.on('error', () => {
                resolve(false);
            });
        });
    }

    /**
     * Install required packages
     */
    async installPackages() {
        const packages = [
            'prophet',
            'pandas',
            'numpy', 
            'statsmodels',
            'scikit-learn'
        ];

        for (const pkg of packages) {
            try {
                console.log(`📦 Installing ${pkg}...`);
                await this.installPackage(pkg);
                console.log(`✅ ${pkg} installed successfully`);
            } catch (error) {
                console.error(`❌ Failed to install ${pkg}:`, error.message);
                throw error;
            }
        }
    }

    /**
     * Install a specific package
     */
    async installPackage(packageName) {
        return new Promise((resolve, reject) => {
            const proc = spawn(this.pipPath, ['install', packageName], {
                stdio: 'inherit'
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Failed to install ${packageName}, exit code: ${code}`));
                }
            });

            proc.on('error', (error) => {
                reject(new Error(`Failed to install ${packageName}: ${error.message}`));
            });
        });
    }

    /**
     * Get the Python executable path
     */
    getPythonPath() {
        return this.pythonPath;
    }

    /**
     * Check if environment is ready
     */
    isEnvironmentReady() {
        return this.isReady;
    }
}

// Create and export a singleton instance
const pythonEnvManager = new PythonEnvironmentManager();

module.exports = pythonEnvManager;
