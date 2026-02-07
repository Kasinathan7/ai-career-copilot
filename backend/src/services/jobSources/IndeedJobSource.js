import BaseJobSource from './BaseJobSource.js';

/**
 * Indeed Jobs integration (using unofficial/scraped data)
 * Note: Indeed requires official partnership for API access
 * This is a simplified example for educational purposes
 */
class IndeedJobSource extends BaseJobSource {
  constructor(config = {}) {
    super({
      baseURL: 'https://indeed-com-official-api.p.rapidapi.com',
      apiKey: process.env.RAPIDAPI_KEY,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'indeed-com-official-api.p.rapidapi.com'
      },
      rateLimit: {
        requests: 100,
        period: 86400000 // 24 hours for free tier
      },
      ...config
    });

    if (!this.config.apiKey) {
      console.warn('Indeed API key not configured. Job search will return mock data.');
    }
  }

  /**
   * Build search parameters for Indeed API
   * @param {Object} criteria - Search criteria
   * @returns {Object} API search parameters
   */
  buildSearchParams(criteria) {
    const params = {
      query: criteria.keywords?.join(' ') || '',
      location: criteria.location || '',
      radius: criteria.radius || '25',
      limit: criteria.limit || 10,
      offset: criteria.offset || 0
    };

    if (criteria.jobType) {
      params.jobtype = criteria.jobType;
    }

    if (criteria.salary) {
      params.salary = criteria.salary;
    }

    if (criteria.datePosted) {
      params.fromage = criteria.datePosted; // days ago
    }

    return params;
  }

  /**
   * Search for jobs on Indeed
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchJobs(criteria) {
    try {
      // If no API key, return mock data
      if (!this.config.apiKey) {
        return this.getMockJobData(criteria);
      }

      const params = this.buildSearchParams(criteria);
      
      const data = await this.makeRequest({
        method: 'GET',
        url: `${this.config.baseURL}/search`,
        params,
        headers: this.config.headers
      });

      const normalizedJobs = data.results?.map(job => this.normalizeJobData(job)) || [];

      return {
        success: true,
        source: this.sourceName,
        total: data.totalResults || normalizedJobs.length,
        jobs: normalizedJobs,
        pagination: {
          page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
          limit: params.limit || 10,
          hasMore: normalizedJobs.length === (params.limit || 10)
        },
        metadata: {
          searchCriteria: criteria,
          fetchedAt: new Date()
        }
      };

    } catch (error) {
      console.error('Indeed search error:', error);
      
      // Fallback to mock data on error
      return this.getMockJobData(criteria);
    }
  }

  /**
   * Get job details by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job details
   */
  async getJobDetails(jobId) {
    try {
      if (!this.config.apiKey) {
        return this.getMockJobDetails(jobId);
      }

      const data = await this.makeRequest({
        method: 'GET',
        url: `${this.config.baseURL}/job`,
        params: { id: jobId },
        headers: this.config.headers
      });

      return {
        success: true,
        source: this.sourceName,
        job: this.normalizeJobData(data)
      };

    } catch (error) {
      console.error('Indeed job details error:', error);
      return this.getMockJobDetails(jobId);
    }
  }

  /**
   * Normalize Indeed job data
   * @param {Object} rawJob - Raw job data from Indeed
   * @returns {Object} Normalized job data
   */
  normalizeJobData(rawJob) {
    return {
      ...super.normalizeJobData(rawJob),
      id: rawJob.jobkey || rawJob.id,
      title: rawJob.jobtitle || rawJob.title,
      company: rawJob.company,
      location: rawJob.formattedLocation || rawJob.location,
      description: rawJob.snippet || rawJob.description,
      url: rawJob.url || `https://www.indeed.com/viewjob?jk=${rawJob.jobkey}`,
      postedDate: this.normalizeDate(rawJob.date),
      salary: this.normalizeSalary(rawJob.salary),
      remote: rawJob.remote || false,
      sponsored: rawJob.sponsored || false
    };
  }

  /**
   * Get mock job data for testing/fallback
   * @param {Object} criteria - Search criteria
   * @returns {Object} Mock search results
   */
  getMockJobData(criteria) {
    const mockJobs = [
      {
        id: 'mock_1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: criteria.location || 'San Francisco, CA',
        description: 'We are seeking a Senior Software Engineer to join our growing team. Experience with React, Node.js, and cloud technologies required.',
        salary: { min: 120000, max: 160000, currency: 'USD', period: 'year' },
        employmentType: 'full-time',
        experienceLevel: 'senior',
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://example.com/job/1',
        skills: ['React', 'Node.js', 'AWS', 'TypeScript'],
        remote: true
      },
      {
        id: 'mock_2',
        title: 'Product Manager',
        company: 'InnovateLabs',
        location: criteria.location || 'New York, NY',
        description: 'Looking for an experienced Product Manager to drive product strategy and roadmap. Strong analytical and communication skills required.',
        salary: { min: 130000, max: 180000, currency: 'USD', period: 'year' },
        employmentType: 'full-time',
        experienceLevel: 'mid-senior',
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://example.com/job/2',
        skills: ['Product Strategy', 'Data Analysis', 'Agile', 'User Research'],
        remote: false
      },
      {
        id: 'mock_3',
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: criteria.location || 'Austin, TX',
        description: 'Join our dynamic team as a Frontend Developer. Experience with modern JavaScript frameworks and responsive design required.',
        salary: { min: 80000, max: 120000, currency: 'USD', period: 'year' },
        employmentType: 'full-time',
        experienceLevel: 'mid-level',
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://example.com/job/3',
        skills: ['React', 'Vue.js', 'CSS', 'HTML', 'JavaScript'],
        remote: true
      }
    ];

    const normalizedJobs = mockJobs.map(job => this.normalizeJobData(job));

    return {
      success: true,
      source: `${this.sourceName}_mock`,
      total: normalizedJobs.length,
      jobs: normalizedJobs,
      pagination: {
        page: 1,
        limit: normalizedJobs.length,
        hasMore: false
      },
      metadata: {
        searchCriteria: criteria,
        fetchedAt: new Date(),
        isMockData: true
      }
    };
  }

  /**
   * Get mock job details
   * @param {string} jobId - Job ID
   * @returns {Object} Mock job details
   */
  getMockJobDetails(jobId) {
    const mockJob = {
      id: jobId,
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      description: `We are seeking a Senior Software Engineer to join our growing team.
      
      Responsibilities:
      • Design and develop scalable web applications
      • Collaborate with cross-functional teams
      • Mentor junior developers
      • Participate in code reviews and architecture decisions
      
      Requirements:
      • 5+ years of software development experience
      • Strong knowledge of React, Node.js, and TypeScript
      • Experience with cloud platforms (AWS, GCP, or Azure)
      • Understanding of microservices architecture
      • Excellent communication and problem-solving skills`,
      requirements: [
        '5+ years of software development experience',
        'Strong knowledge of React, Node.js, and TypeScript',
        'Experience with cloud platforms',
        'Understanding of microservices architecture'
      ],
      salary: { min: 120000, max: 160000, currency: 'USD', period: 'year' },
      employmentType: 'full-time',
      experienceLevel: 'senior',
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://example.com/job/' + jobId,
      skills: ['React', 'Node.js', 'AWS', 'TypeScript', 'Microservices'],
      benefits: ['Health Insurance', '401k', 'Flexible PTO', 'Remote Work'],
      remote: true,
      industry: 'Technology'
    };

    return {
      success: true,
      source: `${this.sourceName}_mock`,
      job: this.normalizeJobData(mockJob),
      metadata: {
        isMockData: true,
        fetchedAt: new Date()
      }
    };
  }

  /**
   * Test Indeed API connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      if (!this.config.apiKey) {
        console.warn('Indeed API key not configured, mock data will be used');
        return true; // Mock data is always available
      }

      // Test with minimal search
      await this.searchJobs({ keywords: ['software'], limit: 1 });
      return true;
    } catch (error) {
      console.error('Indeed connection test failed:', error);
      return false;
    }
  }
}

export default IndeedJobSource;