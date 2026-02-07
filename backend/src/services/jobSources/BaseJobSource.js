import axios from 'axios';

/**
 * Base class for job source integrations
 * Provides common functionality for API rate limiting, error handling, and data normalization
 */
class BaseJobSource {
  constructor(config = {}) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        requests: 60,
        period: 60000 // 1 minute
      },
      ...config
    };
    
    this.requestCount = 0;
    this.rateLimitReset = Date.now() + this.config.rateLimit.period;
    this.lastRequestTime = 0;
    
    // Initialize axios instance
    this.axios = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'AI-Resume-Assistant/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check and enforce rate limiting
   * @returns {Promise<void>}
   */
  async enforceRateLimit() {
    const now = Date.now();
    
    // Reset rate limit counter if period has passed
    if (now >= this.rateLimitReset) {
      this.requestCount = 0;
      this.rateLimitReset = now + this.config.rateLimit.period;
    }
    
    // Check if rate limit exceeded
    if (this.requestCount >= this.config.rateLimit.requests) {
      const waitTime = this.rateLimitReset - now;
      console.warn(`Rate limit exceeded, waiting ${waitTime}ms`);
      await this.delay(waitTime);
      this.requestCount = 0;
      this.rateLimitReset = Date.now() + this.config.rateLimit.period;
    }
    
    // Ensure minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = Math.floor(this.config.rateLimit.period / this.config.rateLimit.requests);
    
    if (timeSinceLastRequest < minDelay) {
      await this.delay(minDelay - timeSinceLastRequest);
    }
    
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Make HTTP request with retry logic and error handling
   * @param {Object} requestConfig - Axios request configuration
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(requestConfig) {
    await this.enforceRateLimit();
    
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.axios(requestConfig);
        return response.data;
      } catch (error) {
        lastError = error;
        console.warn(`Request attempt ${attempt} failed:`, error.message);
        
        // Don't retry on client errors (4xx)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }
    
    throw new Error(`Request failed after ${this.config.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Normalize job data to standard format
   * @param {Object} rawJob - Raw job data from source
   * @returns {Object} Normalized job data
   */
  normalizeJobData(rawJob) {
    return {
      id: rawJob.id || rawJob.jobId || null,
      title: rawJob.title || rawJob.jobTitle || '',
      company: rawJob.company || rawJob.companyName || '',
      location: rawJob.location || rawJob.jobLocation || '',
      description: rawJob.description || rawJob.jobDescription || '',
      requirements: rawJob.requirements || rawJob.jobRequirements || [],
      salary: this.normalizeSalary(rawJob.salary || rawJob.salaryRange),
      employmentType: rawJob.employmentType || rawJob.jobType || 'full-time',
      experienceLevel: rawJob.experienceLevel || rawJob.seniorityLevel || '',
      postedDate: this.normalizeDate(rawJob.postedDate || rawJob.datePosted),
      url: rawJob.url || rawJob.jobUrl || rawJob.link || '',
      source: this.sourceName,
      remote: rawJob.remote || rawJob.isRemote || false,
      skills: rawJob.skills || rawJob.requiredSkills || [],
      benefits: rawJob.benefits || [],
      industry: rawJob.industry || rawJob.companyIndustry || '',
      metadata: {
        originalData: rawJob,
        fetchedAt: new Date(),
        normalized: true
      }
    };
  }

  /**
   * Normalize salary information
   * @param {*} salary - Raw salary data
   * @returns {Object|null} Normalized salary object
   */
  normalizeSalary(salary) {
    if (!salary) return null;
    
    if (typeof salary === 'string') {
      return {
        raw: salary,
        currency: 'USD', // Default
        period: 'year' // Default
      };
    }
    
    if (typeof salary === 'object') {
      return {
        min: salary.min || salary.minimum || null,
        max: salary.max || salary.maximum || null,
        currency: salary.currency || 'USD',
        period: salary.period || 'year',
        raw: salary.raw || `${salary.min || ''}-${salary.max || ''}`
      };
    }
    
    return null;
  }

  /**
   * Normalize date to ISO string
   * @param {*} date - Raw date data
   * @returns {string|null} ISO date string
   */
  normalizeDate(date) {
    if (!date) return null;
    
    try {
      return new Date(date).toISOString();
    } catch (error) {
      console.warn('Failed to normalize date:', date);
      return null;
    }
  }

  /**
   * Build search parameters for API request
   * @param {Object} criteria - Search criteria
   * @returns {Object} API-specific search parameters
   */
  buildSearchParams(criteria) {
    // Override in subclasses
    return {};
  }

  /**
   * Search for jobs (must be implemented by subclasses)
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchJobs(criteria) {
    throw new Error('searchJobs method must be implemented by subclass');
  }

  /**
   * Get job details by ID (must be implemented by subclasses)
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job details
   */
  async getJobDetails(jobId) {
    throw new Error('getJobDetails method must be implemented by subclass');
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      // Override in subclasses with appropriate test endpoint
      return true;
    } catch (error) {
      console.error(`${this.sourceName} connection test failed:`, error);
      return false;
    }
  }

  /**
   * Get source name
   * @returns {string} Source name
   */
  get sourceName() {
    return this.constructor.name.replace('JobSource', '').toLowerCase();
  }

  /**
   * Get source statistics
   * @returns {Object} Source statistics
   */
  getStats() {
    return {
      sourceName: this.sourceName,
      requestCount: this.requestCount,
      rateLimitReset: new Date(this.rateLimitReset),
      lastRequestTime: new Date(this.lastRequestTime),
      config: {
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts,
        rateLimit: this.config.rateLimit
      }
    };
  }
}

export default BaseJobSource;