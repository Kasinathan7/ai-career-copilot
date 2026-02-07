import BaseJobSource from './BaseJobSource.js';

/**
 * GitHub Jobs integration
 * Note: GitHub Jobs was deprecated in 2021, but this serves as an example
 * For production, replace with active job boards like Indeed, LinkedIn, etc.
 */
class GitHubJobSource extends BaseJobSource {
  constructor(config = {}) {
    super({
      baseURL: 'https://jobs.github.com',
      ...config
    });
  }

  /**
   * Build search parameters for GitHub Jobs API
   * @param {Object} criteria - Search criteria
   * @returns {Object} API search parameters
   */
  buildSearchParams(criteria) {
    const params = {};
    
    if (criteria.keywords) {
      params.description = criteria.keywords.join(' ');
    }
    
    if (criteria.location) {
      params.location = criteria.location;
    }
    
    if (criteria.fullTime !== undefined) {
      params.full_time = criteria.fullTime;
    }
    
    return params;
  }

  /**
   * Search for jobs on GitHub Jobs
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchJobs(criteria) {
    try {
      const params = this.buildSearchParams(criteria);
      
      const data = await this.makeRequest({
        method: 'GET',
        url: `${this.config.baseURL}/positions.json`,
        params
      });

      const normalizedJobs = data.map(job => this.normalizeJobData(job));

      return {
        success: true,
        source: this.sourceName,
        total: normalizedJobs.length,
        jobs: normalizedJobs,
        pagination: {
          page: 1,
          limit: normalizedJobs.length,
          hasMore: false
        },
        metadata: {
          searchCriteria: criteria,
          fetchedAt: new Date()
        }
      };

    } catch (error) {
      console.error('GitHub Jobs search error:', error);
      return {
        success: false,
        source: this.sourceName,
        error: error.message,
        jobs: [],
        total: 0
      };
    }
  }

  /**
   * Get job details by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job details
   */
  async getJobDetails(jobId) {
    try {
      const data = await this.makeRequest({
        method: 'GET',
        url: `${this.config.baseURL}/positions/${jobId}.json`
      });

      return {
        success: true,
        source: this.sourceName,
        job: this.normalizeJobData(data)
      };

    } catch (error) {
      console.error('GitHub Jobs detail error:', error);
      return {
        success: false,
        source: this.sourceName,
        error: error.message,
        job: null
      };
    }
  }

  /**
   * Normalize GitHub Jobs data
   * @param {Object} rawJob - Raw job data from GitHub
   * @returns {Object} Normalized job data
   */
  normalizeJobData(rawJob) {
    return {
      ...super.normalizeJobData(rawJob),
      id: rawJob.id,
      title: rawJob.title,
      company: rawJob.company,
      location: rawJob.location,
      description: rawJob.description,
      employmentType: rawJob.type,
      postedDate: this.normalizeDate(rawJob.created_at),
      url: rawJob.url,
      companyUrl: rawJob.company_url,
      companyLogo: rawJob.company_logo
    };
  }

  /**
   * Test GitHub Jobs API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      await this.makeRequest({
        method: 'GET',
        url: `${this.config.baseURL}/positions.json`,
        params: { description: 'test', limit: 1 }
      });
      return true;
    } catch (error) {
      console.error('GitHub Jobs connection test failed:', error);
      return false;
    }
  }
}

export default GitHubJobSource;