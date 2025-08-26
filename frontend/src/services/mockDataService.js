// Mock Data Service for Demo Users
// This service generates realistic mock data for each user role and persists it in localStorage

import { faker } from '@faker-js/faker';

// Stock symbols for realistic data
const STOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'CRM',
  'ORCL', 'INTU', 'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU', 'KLAC', 'LRCX'
];

// Carbon credit project types
const CARBON_PROJECT_TYPES = [
  'Renewable Energy', 'Forest Conservation', 'Methane Capture', 'Energy Efficiency',
  'Sustainable Agriculture', 'Ocean Conservation', 'Waste Management', 'Clean Transportation'
];

// Generate realistic stock data
const generateStockData = (count = 10) => {
  return STOCK_SYMBOLS.slice(0, count).map((symbol, index) => {
    const basePrice = faker.number.float({ min: 50, max: 500, precision: 0.01 });
    const change = faker.number.float({ min: -20, max: 20, precision: 0.01 });
    const changePercent = (change / basePrice) * 100;
    
    return {
      id: index + 1,
      symbol,
      name: faker.company.name(),
      price: basePrice,
      change,
      changePercent: changePercent.toFixed(2),
      volume: faker.number.int({ min: 1000000, max: 100000000 }),
      marketCap: faker.number.int({ min: 1000000000, max: 1000000000000 }),
      pe: faker.number.float({ min: 10, max: 50, precision: 0.1 }),
      dividend: faker.number.float({ min: 0, max: 5, precision: 0.01 }),
      sector: faker.helpers.arrayElement(['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer']),
      lastUpdated: faker.date.recent().toISOString()
    };
  });
};

// Generate portfolio data
const generatePortfolioData = (userId) => {
  const stocks = generateStockData(8);
  const carbonCredits = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    projectName: faker.company.name(),
    type: faker.helpers.arrayElement(CARBON_PROJECT_TYPES),
    credits: faker.number.int({ min: 100, max: 1000 }),
    price: faker.number.float({ min: 15, max: 45, precision: 0.01 }),
    totalValue: 0, // Will be calculated
    location: faker.location.country(),
    verificationStatus: faker.helpers.arrayElement(['Verified', 'Pending', 'Under Review']),
    expiryDate: faker.date.future().toISOString()
  }));

  // Calculate total values
  carbonCredits.forEach(credit => {
    credit.totalValue = credit.credits * credit.price;
  });

  const totalStockValue = stocks.reduce((sum, stock) => sum + stock.price, 0);
  const totalCarbonValue = carbonCredits.reduce((sum, credit) => sum + credit.totalValue, 0);

  return {
    stocks,
    carbonCredits,
    summary: {
      totalValue: totalStockValue + totalCarbonValue,
      stockValue: totalStockValue,
      carbonValue: totalCarbonValue,
      totalReturn: faker.number.float({ min: -5, max: 25, precision: 0.1 }),
      monthlyReturn: faker.number.float({ min: -2, max: 8, precision: 0.1 }),
      carbonOffset: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
      esgScore: faker.number.int({ min: 70, max: 95 })
    }
  };
};

// Generate company ESG data
const generateCompanyESGData = (userId) => {
  return {
    esgScore: faker.number.int({ min: 65, max: 95 }),
    carbonFootprint: {
      scope1: faker.number.int({ min: 1000, max: 50000 }),
      scope2: faker.number.int({ min: 5000, max: 100000 }),
      scope3: faker.number.int({ min: 10000, max: 200000 }),
      total: 0 // Will be calculated
    },
    sustainabilityProjects: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: faker.company.catchPhrase(),
      type: faker.helpers.arrayElement(['Energy Efficiency', 'Waste Reduction', 'Water Conservation', 'Renewable Energy']),
      status: faker.helpers.arrayElement(['Active', 'Completed', 'Planning']),
      investment: faker.number.int({ min: 100000, max: 2000000 }),
      carbonReduction: faker.number.int({ min: 100, max: 5000 }),
      startDate: faker.date.past().toISOString(),
      completionDate: faker.date.future().toISOString()
    })),
    compliance: {
      status: faker.helpers.arrayElement(['Compliant', 'Under Review', 'Warning']),
      lastAudit: faker.date.recent().toISOString(),
      nextAudit: faker.date.future().toISOString(),
      pendingActions: faker.number.int({ min: 0, max: 5 }),
      completedActions: faker.number.int({ min: 10, max: 30 })
    },
    reports: Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      title: `${faker.date.month()} ${faker.date.year()} ESG Report`,
      type: faker.helpers.arrayElement(['ESG', 'Sustainability', 'Carbon Footprint', 'Compliance']),
      status: faker.helpers.arrayElement(['Published', 'Draft', 'Under Review']),
      date: faker.date.recent().toISOString(),
      downloads: faker.number.int({ min: 0, max: 100 })
    }))
  };
};

// Generate regulator monitoring data
const generateRegulatorData = (userId) => {
  return {
    complianceEvents: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      entity: faker.company.name(),
      event: faker.helpers.arrayElement([
        'Carbon Credit Verification Required',
        'ESG Report Overdue',
        'Compliance Audit Required',
        'Environmental Impact Assessment Due',
        'Carbon Footprint Report Missing',
        'Sustainability Metrics Update Required',
        'Regulatory Filing Overdue',
        'Compliance Review Scheduled'
      ]),
      severity: faker.helpers.arrayElement(['high', 'medium', 'low']),
      date: faker.date.recent().toISOString(),
      status: faker.helpers.arrayElement(['pending', 'investigating', 'resolved', 'escalated']),
      deadline: faker.date.future().toISOString()
    })),
    monitoredEntities: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: faker.company.name(),
      type: faker.helpers.arrayElement(['Technology', 'Energy', 'Manufacturing', 'Finance', 'Healthcare', 'Transportation']),
      complianceScore: faker.number.int({ min: 45, max: 98 }),
      lastAudit: faker.date.recent().toISOString(),
      status: faker.helpers.arrayElement(['compliant', 'warning', 'non-compliant', 'monitored'])
    })),
    regulatoryReports: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      title: faker.helpers.arrayElement([
        'Q4 2024 Compliance Summary',
        'Carbon Market Regulation Analysis',
        'ESG Standards Review',
        'Environmental Compliance Report',
        'Sustainability Framework Update'
      ]),
      type: faker.helpers.arrayElement(['Quarterly', 'Annual', 'Special', 'Compliance', 'Regulatory']),
      status: faker.helpers.arrayElement(['published', 'draft', 'under review', 'pending approval']),
      date: faker.date.recent().toISOString(),
      entitiesCovered: faker.number.int({ min: 0, max: 100 })
    }))
  };
};

// Generate NGO impact data
const generateNGOData = (userId) => {
  return {
    impactProjects: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: faker.company.catchPhrase(),
      location: faker.location.city(),
      status: faker.helpers.arrayElement(['active', 'planning', 'completed', 'on-hold']),
      progress: faker.number.int({ min: 10, max: 100 }),
      target: faker.number.int({ min: 100, max: 10000 }),
      achieved: 0, // Will be calculated based on progress
      startDate: faker.date.past().toISOString(),
      endDate: faker.date.future().toISOString(),
      description: faker.lorem.sentence(),
      budget: faker.number.int({ min: 50000, max: 1000000 }),
      beneficiaries: faker.number.int({ min: 100, max: 10000 })
    })),
    environmentalData: [
      {
        id: 1,
        metric: 'CO2 Reduction',
        value: faker.number.int({ min: 1000, max: 10000 }).toString(),
        unit: 'tons',
        change: `+${faker.number.int({ min: 5, max: 25})}%`,
        trend: 'up'
      },
      {
        id: 2,
        metric: 'Trees Planted',
        value: faker.number.int({ min: 5000, max: 50000 }).toString(),
        unit: 'trees',
        change: `+${faker.number.int({ min: 3, max: 15})}%`,
        trend: 'up'
      },
      {
        id: 3,
        metric: 'Energy Saved',
        value: faker.number.int({ min: 20000, max: 200000 }).toString(),
        unit: 'kWh',
        change: `+${faker.number.int({ min: 8, max: 20})}%`,
        trend: 'up'
      },
      {
        id: 4,
        metric: 'Water Conserved',
        value: faker.number.int({ min: 1000, max: 10000 }).toString(),
        unit: 'liters',
        change: `+${faker.number.int({ min: 10, max: 30})}%`,
        trend: 'up'
      }
    ],
    socialMetrics: {
      communitiesReached: faker.number.int({ min: 15, max: 50 }),
      volunteersEngaged: faker.number.int({ min: 200, max: 1000 }),
      partnerships: faker.number.int({ min: 8, max: 25 }),
      fundingSecured: faker.number.int({ min: 100000, max: 500000 }),
      beneficiaries: faker.number.int({ min: 5000, max: 25000 }),
      volunteerHours: faker.number.int({ min: 5000, max: 25000 })
    }
  };
};

// Main function to generate and store mock data for a user
export const generateMockDataForUser = (userId, role) => {
  const storageKey = `mockData_${userId}`;
  
  let mockData = {
    userId,
    role,
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  // Generate role-specific data
  switch (role) {
    case 'investor':
      mockData.portfolio = generatePortfolioData(userId);
      mockData.marketInsights = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        title: faker.company.catchPhrase(),
        summary: faker.lorem.sentence(),
        impact: faker.helpers.arrayElement(['positive', 'negative', 'neutral']),
        date: faker.date.recent().toISOString()
      }));
      mockData.alerts = Array.from({ length: 4 }, (_, i) => ({
        id: i + 1,
        type: faker.helpers.arrayElement(['opportunity', 'market', 'portfolio', 'carbon']),
        message: faker.lorem.sentence(),
        read: faker.datatype.boolean(),
        date: faker.date.recent().toISOString()
      }));
      break;

    case 'company':
      mockData.esg = generateCompanyESGData(userId);
      mockData.investorMessages = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        from: faker.company.name(),
        subject: faker.company.catchPhrase(),
        message: faker.lorem.paragraph(),
        date: faker.date.recent().toISOString(),
        read: faker.datatype.boolean()
      }));
      break;

    case 'regulator':
      mockData.regulatory = generateRegulatorData(userId);
      break;

    case 'ngo':
      mockData.ngo = generateNGOData(userId);
      break;

    default:
      console.warn(`Unknown role: ${role}`);
      return null;
  }

  // Store in localStorage
  try {
    localStorage.setItem(storageKey, JSON.stringify(mockData));
    return mockData;
  } catch (error) {
    console.error('Failed to store mock data:', error);
    return mockData;
  }
};

// Function to retrieve mock data for a user
export const getMockDataForUser = (userId, role) => {
  const storageKey = `mockData_${userId}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      // Check if data is for the same role
      if (data.role === role) {
        return data;
      }
    }
    
    // Generate new data if none exists or role changed
    return generateMockDataForUser(userId, role);
  } catch (error) {
    console.error('Failed to retrieve mock data:', error);
    return generateMockDataForUser(userId, role);
  }
};

// Function to update specific mock data
export const updateMockData = (userId, updates) => {
  const storageKey = `mockData_${userId}`;
  
  try {
    const existing = localStorage.getItem(storageKey);
    const data = existing ? JSON.parse(existing) : {};
    
    const updatedData = {
      ...data,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error('Failed to update mock data:', error);
    return null;
  }
};

// Function to clear all mock data
export const clearAllMockData = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('mockData_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('All mock data cleared');
  } catch (error) {
    console.error('Failed to clear mock data:', error);
  }
};

// Function to get mock data summary for admin
export const getMockDataSummary = () => {
  try {
    const keys = Object.keys(localStorage);
    const mockDataKeys = keys.filter(key => key.startsWith('mockData_'));
    
    return mockDataKeys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return {
          userId: data.userId,
          role: data.role,
          generatedAt: data.generatedAt,
          lastUpdated: data.lastUpdated
        };
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to get mock data summary:', error);
    return [];
  }
};
