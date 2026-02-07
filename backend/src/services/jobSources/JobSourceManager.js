import GitHubJobSource from './GitHubJobSource.js';
import IndeedJobSource from './IndeedJobSource.js';

/**
 * Job Source Manager
 * Coordinates multiple job sources and provides unified search interface
 */
class JobSourceManager {
  constructor() {
    this.sources = new Map();
    this.defaultSources = ['indeed', 'github'];
    this.initialized = false;
  }

  /**
   * Initialize job sources
   * @param {Object} config - Configuration for sources
   */
  async initialize(config = {}) {
    try {
      // Initialize Indeed source
      this.sources.set('indeed', new IndeedJobSource(config.indeed || {}));
      
      // Initialize GitHub source
      this.sources.set('github', new GitHubJobSource(config.github || {}));
      
      console.log('Job sources initialized:', Array.from(this.sources.keys()));
      this.initialized = true;
      
      // Test connections
      await this.testAllConnections();
      
    } catch (error) {
      console.error('Failed to initialize job sources:', error);
      throw error;
    }
  }

  /**
   * Search jobs across multiple sources
   * @param {Object} criteria - Search criteria
   * @param {Array} sources - Specific sources to search (optional)
   * @returns {Promise<Object>} Aggregated search results
   */
  async searchJobs(criteria, sources = null) {
    if (!this.initialized) {
      throw new Error('Job sources not initialized. Call initialize() first.');
    }

    const searchSources = sources || this.defaultSources;
    const results = {
      success: true,
      total: 0,
      jobs: [],
      sources: {},
      aggregated: true,
      metadata: {
        searchCriteria: criteria,
        sourcesSearched: searchSources,
        fetchedAt: new Date()
      }
    };

    const searchPromises = searchSources.map(async (sourceName) => {
      const source = this.sources.get(sourceName);
      if (!source) {
        console.warn(`Source '${sourceName}' not found`);
        return null;
      }

      try {
        const sourceResult = await source.searchJobs(criteria);
        return { sourceName, result: sourceResult };
      } catch (error) {
        console.error(`Search failed for source '${sourceName}':`, error);
        return {
          sourceName,
          result: {
            success: false,
            error: error.message,
            jobs: [],
            total: 0
          }
        };
      }
    });

    const sourceResults = await Promise.allSettled(searchPromises);

    // Process results from each source
    for (const promiseResult of sourceResults) {
      if (promiseResult.status === 'fulfilled' && promiseResult.value) {
        const { sourceName, result } = promiseResult.value;
        
        results.sources[sourceName] = {
          success: result.success,
          total: result.total,
          jobCount: result.jobs?.length || 0,
          error: result.error || null
        };

        if (result.success && result.jobs) {
          // Add source identifier to each job
          const jobsWithSource = result.jobs.map(job => ({
            ...job,
            sourceDetails: {
              source: sourceName,
              originalId: job.id,
              fetchedAt: result.metadata?.fetchedAt || new Date()
            }
          }));

          results.jobs.push(...jobsWithSource);
          results.total += result.total;
        }
      }
    }

    // Remove duplicates and sort by relevance/date
    results.jobs = this.deduplicateJobs(results.jobs);
    results.jobs = this.sortJobs(results.jobs, criteria);
    
    // Update total after deduplication
    results.total = results.jobs.length;

    return results;
  }

  /**
   * Get job details from specific source
   * @param {string} jobId - Job ID
   * @param {string} sourceName - Source name
   * @returns {Promise<Object>} Job details
   */
  async getJobDetails(jobId, sourceName) {
    if (!this.initialized) {
      throw new Error('Job sources not initialized');
    }

    const source = this.sources.get(sourceName);
    if (!source) {
      throw new Error(`Source '${sourceName}' not found`);
    }

    try {
      const result = await source.getJobDetails(jobId);
      
      if (result.success && result.job) {
        result.job.sourceDetails = {
          source: sourceName,
          originalId: jobId,
          fetchedAt: new Date()
        };
      }
      
      return result;
    } catch (error) {
      console.error(`Get job details failed for '${sourceName}':`, error);
      return {
        success: false,
        error: error.message,
        job: null
      };
    }
  }

  /**
   * Test connections to all sources
   * @returns {Promise<Object>} Connection test results
   */
  async testAllConnections() {
    const results = {};
    
    for (const [sourceName, source] of this.sources.entries()) {
      try {
        results[sourceName] = {
          connected: await source.testConnection(),
          lastTested: new Date()
        };
      } catch (error) {
        results[sourceName] = {
          connected: false,
          error: error.message,
          lastTested: new Date()
        };
      }
    }
    
    console.log('Connection test results:', results);
    return results;
  }

  /**
   * Remove duplicate jobs based on title and company
   * @param {Array} jobs - Array of jobs
   * @returns {Array} Deduplicated jobs
   */
  deduplicateJobs(jobs) {
    const seen = new Set();
    const uniqueJobs = [];
    
    for (const job of jobs) {
      const key = `${job.title?.toLowerCase()}_${job.company?.toLowerCase()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }
    
    return uniqueJobs;
  }

  /**
   * Sort jobs by relevance and date
   * @param {Array} jobs - Array of jobs
   * @param {Object} criteria - Search criteria for relevance scoring
   * @returns {Array} Sorted jobs
   */
  sortJobs(jobs, criteria) {
    return jobs.sort((a, b) => {
      // Calculate relevance scores
      const scoreA = this.calculateRelevanceScore(a, criteria);
      const scoreB = this.calculateRelevanceScore(b, criteria);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }
      
      // If same relevance, sort by date (newer first)
      const dateA = new Date(a.postedDate || 0);
      const dateB = new Date(b.postedDate || 0);
      return dateB - dateA;
    });
  }

  /**
   * Calculate relevance score for a job
   * @param {Object} job - Job object
   * @param {Object} criteria - Search criteria
   * @returns {number} Relevance score (0-100)
   */
  calculateRelevanceScore(job, criteria) {
    let score = 0;
    
    // Keyword matching in title (highest weight)
    if (criteria.keywords && job.title) {
      const titleMatches = criteria.keywords.filter(keyword => 
        job.title.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += (titleMatches / criteria.keywords.length) * 40;
    }
    
    // Keyword matching in description
    if (criteria.keywords && job.description) {
      const descMatches = criteria.keywords.filter(keyword => 
        job.description.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      score += (descMatches / criteria.keywords.length) * 20;
    }
    
    // Skills matching
    if (criteria.skills && job.skills) {
      const skillMatches = criteria.skills.filter(skill => 
        job.skills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ).length;
      if (criteria.skills.length > 0) {
        score += (skillMatches / criteria.skills.length) * 25;
      }
    }
    
    // Location preference
    if (criteria.location && job.location) {
      if (job.location.toLowerCase().includes(criteria.location.toLowerCase())) {
        score += 10;
      }
    }
    
    // Remote preference
    if (criteria.remote && job.remote) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Get statistics for all sources
   * @returns {Object} Source statistics
   */
  getSourceStats() {
    const stats = {};
    
    for (const [sourceName, source] of this.sources.entries()) {
      stats[sourceName] = source.getStats();
    }
    
    return {
      initialized: this.initialized,
      sourceCount: this.sources.size,
      defaultSources: this.defaultSources,
      sources: stats
    };
  }

  /**
   * Add a custom job source
   * @param {string} name - Source name
   * @param {BaseJobSource} source - Source instance
   */
  addSource(name, source) {
    this.sources.set(name, source);
    console.log(`Added custom job source: ${name}`);
  }

  /**
   * Remove a job source
   * @param {string} name - Source name
   */
  removeSource(name) {
    if (this.sources.delete(name)) {
      console.log(`Removed job source: ${name}`);
    }
  }

  /**
   * Get available source names
   * @returns {Array} Array of source names
   */
  getAvailableSources() {
    return Array.from(this.sources.keys());
  }
}

export default new JobSourceManager();