// Report Service for Frontend
// Handles all report-related API calls and state management

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

class ReportService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/reports`;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token');
  }

  // Get headers for API requests
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all reports for the current user
  async getReports(options = {}) {
    try {
      const { limit = 50, offset = 0, type, category, status, format } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type }),
        ...(category && { category }),
        ...(status && { status }),
        ...(format && { format })
      });

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  // Get all reports (admin only)
  async getAllReports(options = {}) {
    try {
      const { limit = 100, offset = 0, type, category, status, user_id } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type }),
        ...(category && { category }),
        ...(status && { status }),
        ...(user_id && { user_id })
      });

      const response = await fetch(`${this.baseURL}/all?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching all reports:', error);
      throw error;
    }
  }

  // Get report by ID
  async getReportById(reportId) {
    try {
      const response = await fetch(`${this.baseURL}/${reportId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  // Create a new report
  async createReport(reportData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  // Generate a new report
  async generateReport(reportData) {
    try {
      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Update report
  async updateReport(reportId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/${reportId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  // Delete report
  async deleteReport(reportId) {
    try {
      const response = await fetch(`${this.baseURL}/${reportId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Download report
  async downloadReport(reportId) {
    try {
      const response = await fetch(`${this.baseURL}/${reportId}/download`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  // Search reports
  async searchReports(searchTerm, options = {}) {
    try {
      const { limit = 50, offset = 0, type, category } = options;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type && { type }),
        ...(category && { category })
      });

      const response = await fetch(`${this.baseURL}/search/${encodeURIComponent(searchTerm)}?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error searching reports:', error);
      throw error;
    }
  }

  // Get report statistics
  async getReportStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats/overview`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching report stats:', error);
      throw error;
    }
  }

  // Get popular report types (admin only)
  async getPopularReportTypes(limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/stats/popular-types?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching popular report types:', error);
      throw error;
    }
  }

  // Get report templates
  async getReportTemplates() {
    try {
      const response = await fetch(`${this.baseURL}/templates`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  // Mock data for development/testing
  getMockReports() {
    return [
      {
        id: 1,
        title: 'Portfolio Performance Summary',
        description: 'Monthly portfolio performance analysis with carbon credit impact',
        type: 'portfolio',
        category: 'investment',
        status: 'completed',
        format: 'pdf',
        file_path: '/reports/1.pdf',
        file_size: 245760,
        download_count: 12,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        generated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        title: 'ESG Compliance Report',
        description: 'Environmental, Social, and Governance compliance status',
        type: 'compliance',
        category: 'regulatory',
        status: 'completed',
        format: 'excel',
        file_path: '/reports/2.xlsx',
        file_size: 189440,
        download_count: 8,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        generated_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 3,
        title: 'Carbon Footprint Analysis',
        description: 'Detailed carbon emissions analysis and offset strategies',
        type: 'environmental',
        category: 'sustainability',
        status: 'processing',
        format: 'pdf',
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        title: 'Market Analysis Report',
        description: 'Comprehensive market trends and investment opportunities',
        type: 'market',
        category: 'analysis',
        status: 'draft',
        format: 'pdf',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }

  // Get status color
  getStatusColor(status) {
    const statusColorMap = {
      draft: 'gray',
      processing: 'yellow',
      completed: 'green',
      failed: 'red'
    };
    return statusColorMap[status] || 'gray';
  }

  // Get format icon
  getFormatIcon(format) {
    const formatIconMap = {
      pdf: '📄',
      excel: '📊',
      csv: '📋',
      json: '🔧'
    };
    return formatIconMap[format] || '📄';
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get report type options
  getReportTypeOptions() {
    return [
      { value: 'portfolio', label: 'Portfolio' },
      { value: 'compliance', label: 'Compliance' },
      { value: 'environmental', label: 'Environmental' },
      { value: 'market', label: 'Market Analysis' },
      { value: 'esg', label: 'ESG' },
      { value: 'carbon', label: 'Carbon Credits' },
      { value: 'financial', label: 'Financial' },
      { value: 'custom', label: 'Custom' }
    ];
  }

  // Get report category options
  getReportCategoryOptions() {
    return [
      { value: 'investment', label: 'Investment' },
      { value: 'regulatory', label: 'Regulatory' },
      { value: 'sustainability', label: 'Sustainability' },
      { value: 'analysis', label: 'Analysis' },
      { value: 'compliance', label: 'Compliance' },
      { value: 'reporting', label: 'Reporting' },
      { value: 'custom', label: 'Custom' }
    ];
  }

  // Get report format options
  getReportFormatOptions() {
    return [
      { value: 'pdf', label: 'PDF' },
      { value: 'excel', label: 'Excel' },
      { value: 'csv', label: 'CSV' },
      { value: 'json', label: 'JSON' }
    ];
  }
}

// Create singleton instance
const reportService = new ReportService();

export default reportService;
