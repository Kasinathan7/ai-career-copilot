import JobSourceManager from '../services/jobSources/JobSourceManager.js';
import { logger } from '../utils/logger.js';
import GroqAIService from '../services/groqAIService.js';

/**
 * Search for jobs using Groq AI
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const searchJobsWithAI = async (req, res) => {
  try {
    const {
      keywords = '',
      location = '',
      jobType = '',
      experienceLevel = '',
      remote = false,
      salaryMin = null,
      salaryMax = null,
      limit = 10
    } = req.body;

    if (!keywords && !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide keywords or location to search'
      });
    }

// Compose prompt for Groq AI job recommendations
const recommendationPrompt = `You are a job search assistant. Given the following criteria, suggest relevant job titles and companies. Criteria:
Keywords: ${keywords}
Location: ${location}
Job Type: ${jobType}
Experience Level: ${experienceLevel}
Remote: ${remote}
Salary Range: ${salaryMin || ''} - ${salaryMax || ''}
Return a JSON array of job recommendations with title, company, location, and a short description. Limit to ${limit} results.`;

const recommendationResult = await GroqAIService.generateCompletion([
  { role: 'system', content: recommendationPrompt }
], { maxTokens: 1000 });

    let jobs = [];
    try {
      jobs = JSON.parse(recommendationResult.content);

    } catch (e) {
      logger.warn('Could not parse Groq AI job search result as JSON. Returning raw text.');
      jobs = [{ title: 'See AI response', description: recommendationResult.content }];

    }

    // Build search query for AI
    let searchQuery = `Search for the latest job postings online for: ${keywords}`;
    if (location) searchQuery += ` in ${location}`;
    if (jobType) searchQuery += `, ${jobType} position`;
    if (experienceLevel) searchQuery += `, ${experienceLevel}`;
    if (remote) searchQuery += `, remote work`;
    if (salaryMin || salaryMax) {
      searchQuery += `, salary range ${salaryMin ? `from $${salaryMin}` : ''}${salaryMax ? ` to $${salaryMax}` : ''}`;
    }

    const jobSearchPrompt = `${searchQuery}


Find real, current job postings from the internet. Search job boards like LinkedIn, Indeed, Glassdoor, and company career pages.

Return EXACTLY ${limit} jobs in this JSON structure (must be valid JSON):
{
  "jobs": [
    {
      "title": "job title",
      "company": "company name",
      "location": "location",
      "type": "Full-time or Part-time or Contract or Internship",
      "experienceLevel": "Entry or Mid or Senior or Executive",
      "remote": true or false,
      "salary": {
        "min": number or null,
        "max": number or null,
        "currency": "USD"
      },
      "description": "brief job description",
      "requirements": ["requirement 1", "requirement 2"],
      "benefits": ["benefit 1", "benefit 2"],
      "posted": "2 days ago or 1 week ago",
      "source": "job board or company website name",
      "url": "direct link to job posting",
      "matchScore": number from 0-100
    }
  ],
  "totalFound": number,
  "searchDate": "current date",
  "searchQuery": "${searchQuery.replace(/"/g, '\\"')}"
}

CRITICAL REQUIREMENTS:
1. Only include REAL job postings currently available online
2. Include direct URLs to each job posting
3. Prioritize recent postings (within last 30 days)
4. Match the search criteria as closely as possible
5. Calculate matchScore based on criteria alignment
6. Return ONLY valid JSON, no markdown, no code blocks, no additional text`;

    logger.info('Searching jobs with Groq AI:', { keywords, location, jobType });

  const jobSearchResult = await GroqAIService.generateCompletion(
  [{ role: 'user', content: jobSearchPrompt }],
  { maxTokens: 2000 }
);

    let responseText = jobSearchResult.content.trim();


    // Clean up any markdown formatting if present (more aggressive cleaning)
    responseText = responseText
      .replace(/^```json\s*/i, '')  // Remove opening ```json
      .replace(/^```\s*/i, '')       // Remove opening ```
      .replace(/\s*```$/i, '')       // Remove closing ```
      .trim();

    let jobData;
    try {
      jobData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse AI response as JSON:', parseError);
      logger.error('Response text (first 1000 chars):', responseText.substring(0, 1000));
      throw new Error('AI returned invalid JSON format');
    }

    logger.info(`Found ${jobs.length} jobs via Groq AI`);

    res.json({
      success: true,
      data: {
        jobs: jobData.jobs,
        totalFound: jobData.totalFound || jobData.jobs.length,
        searchCriteria: {
          keywords,
          location,
          jobType,
          experienceLevel,
          remote,
          salaryMin,
          salaryMax
        },
        searchDate: jobData.searchDate || new Date().toISOString(),
        source: 'Groq AI'
      }
    });

  } catch (error) {
    logger.error('AI job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs with AI',
      error: error.message
    });
  }
};

/**
 * Initialize job sources on server startup
 */
export const initializeJobSources = async () => {
  try {
    const config = {
      indeed: {
        rateLimit: {
          requests: parseInt(process.env.INDEED_RATE_LIMIT_REQUESTS) || 100,
          period: parseInt(process.env.INDEED_RATE_LIMIT_PERIOD) || 86400000
        }
      },
      github: {
        rateLimit: {
          requests: parseInt(process.env.GITHUB_RATE_LIMIT_REQUESTS) || 60,
          period: parseInt(process.env.GITHUB_RATE_LIMIT_PERIOD) || 60000
        }
      }
    };

    await JobSourceManager.initialize(config);
    logger.info('Job sources initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize job sources:', error);
    // Don't throw - allow server to start with limited functionality
  }
};

/**
 * Search for jobs using external sources
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const searchExternalJobs = async (req, res) => {
  try {
    const {
      keywords = [],
      location = '',
      jobType = '',
      experienceLevel = '',
      remote = false,
      salaryMin = null,
      limit = 10,
      sources = null
    } = req.query;

    // Build search criteria
    const criteria = {
      keywords: Array.isArray(keywords) ? keywords : [keywords].filter(Boolean),
      location,
      jobType,
      experienceLevel,
      remote: remote === 'true',
      limit: parseInt(limit) || 10
    };

    if (salaryMin) {
      criteria.salaryMin = parseInt(salaryMin);
    }

    // Search jobs
    const results = await JobSourceManager.searchJobs(
      criteria, 
      sources ? sources.split(',') : null
    );

    res.json({
      success: true,
      data: {
        ...results,
        searchCriteria: criteria
      }
    });

  } catch (error) {
    console.error('External job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search external job sources',
      error: error.message
    });
  }
};

/**
 * Get job details from external source
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getExternalJobDetails = async (req, res) => {
  try {
    const { jobId, source } = req.params;

    if (!jobId || !source) {
      return res.status(400).json({
        success: false,
        message: 'Job ID and source are required'
      });
    }

    const result = await JobSourceManager.getJobDetails(jobId, source);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Job not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get external job details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job details',
      error: error.message
    });
  }
};

/**
 * Get job source statistics
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getJobSourceStats = async (req, res) => {
  try {
    const stats = JobSourceManager.getSourceStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get job source stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job source statistics',
      error: error.message
    });
  }
};

/**
 * Test job source connections
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const testJobSourceConnections = async (req, res) => {
  try {
    const results = await JobSourceManager.testAllConnections();
    
    res.json({
      success: true,
      data: {
        connectionTests: results,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Test job source connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test job source connections',
      error: error.message
    });
  }
};