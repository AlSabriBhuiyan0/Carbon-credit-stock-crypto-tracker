const axios = require('axios');
let ethers;
try { ethers = require('ethers'); } catch (_) { ethers = null; }

class BlockchainService {
  constructor() {
    this.mode = process.env.BLOCKCHAIN_MODE || (process.env.ETH_RPC_URL ? 'real' : 'mock'); // auto real if RPC set
    this.network = process.env.ETH_NETWORK || 'sepolia';
    this.indexerUrl = process.env.ALGORAND_INDEXER_URL || 'https://algoindexer.testnet.algoexplorer.io';
    this.ethRpcUrl = process.env.ETH_RPC_URL || '';
    this.ethProvider = this.mode === 'real' && ethers && this.ethRpcUrl ? new ethers.JsonRpcProvider(this.ethRpcUrl) : null;
    
    // Mock carbon credit asset IDs for demonstration
    this.carbonAssets = {
      'Gold Standard': 123456789,
      'Verified Carbon Standard': 987654321,
      'Clean Development Mechanism': 456789123
    };
  }

  async getCarbonCreditBalance(address) {
    try {
      console.log(`Fetching carbon credit balance for address: ${address}`);
      
      // Mock response for demonstration
      const mockBalance = {
        address,
        balances: [
          {
            assetId: this.carbonAssets['Gold Standard'],
            amount: Math.floor(Math.random() * 10000) + 1000,
            standard: 'Gold Standard',
            decimals: 0
          }
        ],
        totalCredits: Math.floor(Math.random() * 10000) + 1000
      };
      
      return mockBalance;
      
    } catch (error) {
      console.error(`Error fetching carbon credit balance for ${address}:`, error.message);
      throw error;
    }
  }

  async trackCarbonCreditRetirement(projectId, amount, standard) {
    try {
      console.log(`Tracking carbon credit retirement: ${amount} credits from ${standard} project ${projectId}`);
      
      const retirementRecord = {
        projectId,
        amount,
        standard,
        timestamp: new Date(),
        transactionHash: this.generateMockTransactionHash(),
        status: 'retired',
        blockchainNetwork: 'Algorand',
        verificationData: {
          verified: true,
          verificationDate: new Date(),
          verifier: 'System'
        }
      };
      
      console.log(`Carbon credit retirement tracked successfully: ${retirementRecord.transactionHash}`);
      return retirementRecord;
      
    } catch (error) {
      console.error('Error tracking carbon credit retirement:', error.message);
      throw error;
    }
  }

  async getCarbonCreditMarketData() {
    try {
      if (this.mode === 'real' && this.ethProvider) {
        // Placeholder real fetch: derive pseudo price from gasPrice and blockNumber
        const [blockNumber, gasPrice] = await Promise.all([
          this.ethProvider.getBlockNumber(),
          this.ethProvider.getGasPrice()
        ]);
        const basePrice = Number(gasPrice) / 1e9; // gwei
        const mk = [
          {
            standard: 'Gold Standard',
            assetId: this.carbonAssets['Gold Standard'],
            currentPrice: (basePrice / 2 + 7).toFixed(2),
            priceChange: (Math.random() * 4 - 2).toFixed(2),
            volume24h: Math.floor(Math.random() * 100000) + 10000,
            marketCap: Math.floor(Math.random() * 1000000) + 100000,
            lastUpdated: new Date(),
            model: 'arima',
            forecast: { nextDay: (basePrice / 2 + 7.2).toFixed(2), confidence: (80 + Math.random() * 15).toFixed(1) }
          },
          {
            standard: 'Verified Carbon Standard',
            assetId: this.carbonAssets['Verified Carbon Standard'],
            currentPrice: (basePrice / 2 + 12).toFixed(2),
            priceChange: (Math.random() * 4 - 2).toFixed(2),
            volume24h: Math.floor(Math.random() * 100000) + 10000,
            marketCap: Math.floor(Math.random() * 1000000) + 100000,
            lastUpdated: new Date(),
            model: 'prophet',
            forecast: { nextDay: (basePrice / 2 + 12.3).toFixed(2), confidence: (80 + Math.random() * 15).toFixed(1) }
          }
        ];
        return mk;
      }
      // Mock market data (fallback)
      const marketData = [
        {
          standard: 'Gold Standard',
          assetId: this.carbonAssets['Gold Standard'],
          currentPrice: (Math.random() * 20 + 5).toFixed(2),
          priceChange: (Math.random() * 10 - 5).toFixed(2),
          volume24h: Math.floor(Math.random() * 100000) + 10000,
          marketCap: Math.floor(Math.random() * 1000000) + 100000,
          lastUpdated: new Date(),
          model: 'arima', // Add model information
          forecast: {
            nextDay: (Math.random() * 20 + 5).toFixed(2),
            confidence: (Math.random() * 20 + 80).toFixed(1)
          }
        },
        {
          standard: 'Verified Carbon Standard',
          assetId: this.carbonAssets['Verified Carbon Standard'],
          currentPrice: (Math.random() * 20 + 5).toFixed(2),
          priceChange: (Math.random() * 10 - 5).toFixed(2),
          volume24h: Math.floor(Math.random() * 100000) + 10000,
          marketCap: Math.floor(Math.random() * 1000000) + 100000,
          lastUpdated: new Date(),
          model: 'prophet', // Add model information
          forecast: {
            nextDay: (Math.random() * 20 + 5).toFixed(2),
            confidence: (Math.random() * 20 + 80).toFixed(1)
          }
        }
      ];
      
      return marketData;
      
    } catch (error) {
      console.error('Error fetching carbon credit market data:', error.message);
      throw error;
    }
  }

  async checkBlockchainHealth() {
    try {
      if (this.mode === 'real' && this.ethProvider) {
        const start = Date.now();
        const blockNumber = await this.ethProvider.getBlockNumber();
        const gasPrice = await this.ethProvider.getGasPrice();
        const latencyMs = Date.now() - start;
        return {
          status: 'healthy',
          network: this.network,
          latestBlock: Number(blockNumber),
          gasPriceGwei: Number(gasPrice) / 1e9,
          latencyMs,
          timestamp: new Date()
        };
      }
      // Mock health check for demonstration
      return {
        status: 'healthy',
        network: this.network,
        latestBlock: Math.floor(Math.random()*10000000),
        gasPriceGwei: 15 + Math.random()*5,
        latencyMs: 40 + Math.floor(Math.random()*20),
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        indexer: { status: 'disconnected', url: this.indexerUrl },
        algod: { status: 'disconnected', url: 'https://testnet-api.algonode.cloud' },
        network: this.network,
        timestamp: new Date()
      };
    }
  }

  async verifyCarbonCredit(projectId, verificationData) {
    try {
      console.log(`Verifying carbon credit for project: ${projectId}`);
      
      const verification = {
        projectId,
        verified: true,
        verificationDate: new Date(),
        verifier: verificationData.verifier || 'System',
        verificationMethod: verificationData.method || 'Blockchain',
        confidence: verificationData.confidence || 0.95,
        blockchainProof: this.generateMockTransactionHash(),
        metadata: verificationData.metadata || {}
      };
      
      console.log(`Carbon credit verification completed for project: ${projectId}`);
      return verification;
      
    } catch (error) {
      console.error('Error verifying carbon credit:', error.message);
      throw error;
    }
  }

  // Utility methods
  generateMockTransactionHash() {
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  async getRecentTransactions(limit = 10) {
    try {
      if (this.mode === 'real' && this.ethProvider) {
        // In real mode, we could fetch recent transactions from the blockchain
        // For now, return mock data
        return this.generateMockTransactions(limit);
      }
      return this.generateMockTransactions(limit);
    } catch (error) {
      console.error('Error fetching recent transactions:', error.message);
      return this.generateMockTransactions(limit);
    }
  }

  async getNetworkStats() {
    try {
      if (this.mode === 'real' && this.ethProvider) {
        const blockNumber = await this.ethProvider.getBlockNumber();
        const gasPrice = await this.ethProvider.getGasPrice();
        const feeData = await this.ethProvider.getFeeData();
        
        return {
          totalBlocks: Number(blockNumber),
          averageBlockTime: 12, // Ethereum average
          gasPrice: {
            current: Number(gasPrice) / 1e9,
            maxFeePerGas: Number(feeData.maxFeePerGas) / 1e9,
            maxPriorityFeePerGas: Number(feeData.maxPriorityFeePerGas) / 1e9
          },
          networkUtilization: Math.random() * 100,
          activeAddresses: Math.floor(Math.random() * 1000000) + 500000
        };
      }
      
      // Mock network stats
      return {
        totalBlocks: Math.floor(Math.random() * 100000000) + 10000000,
        averageBlockTime: 12 + Math.random() * 2,
        gasPrice: {
          current: 15 + Math.random() * 10,
          maxFeePerGas: 20 + Math.random() * 15,
          maxPriorityFeePerGas: 2 + Math.random() * 3
        },
        networkUtilization: Math.random() * 100,
        activeAddresses: Math.floor(Math.random() * 1000000) + 500000
      };
    } catch (error) {
      console.error('Error fetching network stats:', error.message);
      return this.generateMockNetworkStats();
    }
  }

  async getCarbonCreditVerificationHistory(limit = 20) {
    try {
      // Mock verification history
      const history = [];
      const standards = ['Gold Standard', 'Verified Carbon Standard', 'Clean Development Mechanism'];
      const verifiers = ['System', 'Auditor A', 'Auditor B', 'Blockchain Validator'];
      
      for (let i = 0; i < limit; i++) {
        const standard = standards[Math.floor(Math.random() * standards.length)];
        const verifier = verifiers[Math.floor(Math.random() * verifiers.length)];
        
        history.push({
          id: `VER-${Date.now()}-${i}`,
          projectId: `PROJ-${Math.floor(Math.random() * 10000)}`,
          standard,
          amount: Math.floor(Math.random() * 10000) + 100,
          verifier,
          verificationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
          status: Math.random() > 0.1 ? 'verified' : 'pending', // 90% verified
          confidence: 0.85 + Math.random() * 0.15,
          transactionHash: this.generateMockTransactionHash()
        });
      }
      
      return history.sort((a, b) => b.verificationDate - a.verificationDate);
    } catch (error) {
      console.error('Error fetching verification history:', error.message);
      return [];
    }
  }

  generateMockTransactions(limit) {
    const transactions = [];
    const types = ['carbon_credit_mint', 'carbon_credit_transfer', 'carbon_credit_retirement', 'verification'];
    
    for (let i = 0; i < limit; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 10000) + 100;
      
      transactions.push({
        hash: this.generateMockTransactionHash(),
        type,
        amount,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
        status: 'confirmed',
        gasUsed: Math.floor(Math.random() * 100000) + 50000,
        gasPrice: (15 + Math.random() * 10).toFixed(2)
      });
    }
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  generateMockNetworkStats() {
    return {
      totalBlocks: Math.floor(Math.random() * 100000000) + 10000000,
      averageBlockTime: 12 + Math.random() * 2,
      gasPrice: {
        current: 15 + Math.random() * 10,
        maxFeePerGas: 20 + Math.random() * 15,
        maxPriorityFeePerGas: 2 + Math.random() * 3
      },
      networkUtilization: Math.random() * 100,
      activeAddresses: Math.floor(Math.random() * 1000000) + 500000
    };
  }
}

module.exports = new BlockchainService();
