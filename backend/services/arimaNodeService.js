const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

async function runARIMA(payload) {
    try {
        const script = path.join(__dirname, '..', 'forcasting', 'arimaService.py');
        
        console.log('📊 ARIMA service options:', { script });
        console.log('📊 Script path:', script);
        
        // Execute Python script with JSON payload piped via echo
        const command = `echo '${JSON.stringify(payload)}' | python3 "${script}"`;
        console.log('📊 Executing command:', command);
        
        const { stdout, stderr } = await execAsync(command, { timeout: 30000 }); // 30 second timeout
        
        if (stderr && stderr.trim()) {
            console.warn('ARIMA service stderr:', stderr);
        }
        
        // Parse the output
        const result = JSON.parse(stdout.trim());
        return result;
        
    } catch (error) {
        throw new Error(`ARIMA service failed: ${error.message}`);
    }
}

module.exports = { runARIMA };
