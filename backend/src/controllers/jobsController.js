import JobSearch from '../models/JobSearch.js';
import User from '../models/User.js';
import GroqAIService from '../services/groqAIService.js';
import JobSourceManager from '../services/jobSources/JobSourceManager.js';

// Create new job search
export const createJobSearch = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      query, 
      filters = {}, 
      preferences = {},
      type = 'manual'
    } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Create job search record
    const jobSearch = new JobSearch({
      userId,
      query: query.trim(),
      filters: {
        location: filters.location || null,
        experienceLevel: filters.experienceLevel || null,
        jobType: filters.jobType || 'full-time',
        salaryRange: filters.salaryRange || null,
        remote: filters.remote || false,
        companySize: filters.companySize || null,
        industry: filters.industry || null,
        ...filters
      },
      preferences: {
        keywords: preferences.keywords || [],
        excludedKeywords: preferences.excludedKeywords || [],
        preferredCompanies: preferences.preferredCompanies || [],
        dealBreakers: preferences.dealBreakers || [],
        ...preferences
      },
      type,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    await jobSearch.save();

    // Update user usage
    const user = await User.findById(userId);
    await user.updateUsageStats('job_search_created');

    res.status(201).json({
      success: true,
      message: 'Job search created successfully',
      data: { jobSearch }
    });

  } catch (error) {
    console.error('Create job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job search'
    });
  }
};

// Get job searches for user
export const getJobSearches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type, status } = req.query;

    const filter = { userId };
    if (type) {
      filter.type = type;
    }
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const jobSearches = await JobSearch.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalSearches = await JobSearch.countDocuments(filter);

    res.json({
      success: true,
      data: {
        jobSearches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalSearches,
          pages: Math.ceil(totalSearches / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get job searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job searches'
    });
  }
};

// Get specific job search
export const getJobSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user.userId;

    const jobSearch = await JobSearch.findOne({
      _id: searchId,
      userId
    });

    if (!jobSearch) {
      return res.status(404).json({
        success: false,
        message: 'Job search not found'
      });
    }

    res.json({
      success: true,
      data: { jobSearch }
    });

  } catch (error) {
    console.error('Get job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job search'
    });
  }
};

// Update job search
export const updateJobSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.userId;
    delete updates.createdAt;
    delete updates.analytics;

    const jobSearch = await JobSearch.findOneAndUpdate(
      { _id: searchId, userId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!jobSearch) {
      return res.status(404).json({
        success: false,
        message: 'Job search not found'
      });
    }

    res.json({
      success: true,
      message: 'Job search updated successfully',
      data: { jobSearch }
    });

  } catch (error) {
    console.error('Update job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job search'
    });
  }
};

// Delete job search
export const deleteJobSearch = async (req, res) => {
  try {
    const { searchId } = req.params;
    const userId = req.user.userId;

    const jobSearch = await JobSearch.findOneAndDelete({
      _id: searchId,
      userId
    });

    if (!jobSearch) {
      return res.status(404).json({
        success: false,
        message: 'Job search not found'
      });
    }

    res.json({
      success: true,
      message: 'Job search deleted successfully'
    });

  } catch (error) {
    console.error('Delete job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job search'
    });
  }
};

// Save job posting
export const saveJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      jobId, 
      title, 
      company, 
      location, 
      description, 
      url, 
      source, 
      salary,
      notes = '',
      priority = 'medium' 
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({
        success: false,
        message: 'Job title and company are required'
      });
    }

    // Find or create a general saved jobs search
    let jobSearch = await JobSearch.findOne({
      userId,
      type: 'saved_jobs'
    });

    if (!jobSearch) {
      jobSearch = new JobSearch({
        userId,
        query: 'Saved Jobs',
        type: 'saved_jobs',
        status: 'active'
      });
      await jobSearch.save();
    }

    // Check if job already saved
    const existingJob = jobSearch.results.find(
      job => job.externalId === jobId || 
      (job.title === title && job.company === company)
    );

    if (existingJob) {
      return res.status(400).json({
        success: false,
        message: 'Job already saved'
      });
    }

    // Add job to saved results
    const savedJob = {
      externalId: jobId || `manual_${Date.now()}`,
      title,
      company,
      location: location || null,
      description: description || '',
      url: url || null,
      source: source || 'manual',
      salary: salary || null,
      postedDate: new Date(),
      savedAt: new Date(),
      notes,
      priority,
      status: 'saved',
      applicationStatus: 'not_applied'
    };

    jobSearch.results.push(savedJob);
    jobSearch.analytics.totalResults = jobSearch.results.length;
    jobSearch.analytics.lastUpdated = new Date();

    await jobSearch.save();

    // Update user usage
    const user = await User.findById(userId);
    await user.updateUsageStats('job_saved');

    res.status(201).json({
      success: true,
      message: 'Job saved successfully',
      data: { 
        savedJob,
        searchId: jobSearch._id 
      }
    });

  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save job'
    });
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 20, 
      priority, 
      applicationStatus, 
      search 
    } = req.query;

    // Find saved jobs search
    const jobSearch = await JobSearch.findOne({
      userId,
      type: 'saved_jobs'
    });

    if (!jobSearch) {
      return res.json({
        success: true,
        data: {
          jobs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }

    // Filter saved jobs
    let filteredJobs = jobSearch.results;

    if (priority) {
      filteredJobs = filteredJobs.filter(job => job.priority === priority);
    }

    if (applicationStatus) {
      filteredJobs = filteredJobs.filter(job => job.applicationStatus === applicationStatus);
    }

    if (search) {
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by savedAt (newest first)
    filteredJobs.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        jobs: paginatedJobs,
        searchId: jobSearch._id,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredJobs.length,
          pages: Math.ceil(filteredJobs.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve saved jobs'
    });
  }
};

// Update saved job
export const updateSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const jobSearch = await JobSearch.findOne({
      userId,
      type: 'saved_jobs'
    });

    if (!jobSearch) {
      return res.status(404).json({
        success: false,
        message: 'No saved jobs found'
      });
    }

    const jobIndex = jobSearch.results.findIndex(
      job => job._id.toString() === jobId || job.externalId === jobId
    );

    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
    }

    // Update job fields
    const allowedUpdates = [
      'notes', 'priority', 'applicationStatus', 'applicationDate',
      'interviewDate', 'followUpDate', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        jobSearch.results[jobIndex][field] = updates[field];
      }
    });

    jobSearch.results[jobIndex].updatedAt = new Date();
    await jobSearch.save();

    res.json({
      success: true,
      message: 'Saved job updated successfully',
      data: { job: jobSearch.results[jobIndex] }
    });

  } catch (error) {
    console.error('Update saved job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saved job'
    });
  }
};

// Remove saved job
export const removeSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    const jobSearch = await JobSearch.findOne({
      userId,
      type: 'saved_jobs'
    });

    if (!jobSearch) {
      return res.status(404).json({
        success: false,
        message: 'No saved jobs found'
      });
    }

    const jobIndex = jobSearch.results.findIndex(
      job => job._id.toString() === jobId || job.externalId === jobId
    );

    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
    }

    jobSearch.results.splice(jobIndex, 1);
    jobSearch.analytics.totalResults = jobSearch.results.length;
    jobSearch.analytics.lastUpdated = new Date();

    await jobSearch.save();

    res.json({
      success: true,
      message: 'Saved job removed successfully'
    });

  } catch (error) {
    console.error('Remove saved job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved job'
    });
  }
};

// Get job match analysis
export const getJobMatchAnalysis = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;
    const { resumeId } = req.query;

    // Find the saved job
    const jobSearch = await JobSearch.findOne({
      userId,
      type: 'saved_jobs'
    });

    if (!jobSearch) {
      return res.status(404).json({
        success: false,
        message: 'No saved jobs found'
      });
    }

    const job = jobSearch.results.find(
      job => job._id.toString() === jobId || job.externalId === jobId
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
    }

    // Get user profile and resume data
    const user = await User.findById(userId)
      .populate('resumes');

    let resumeData = null;
    if (resumeId) {
      resumeData = user.resumes.find(r => r._id.toString() === resumeId);
    } else if (user.resumes.length > 0) {
      // Use most recent resume
      resumeData = user.resumes[user.resumes.length - 1];
    }

    // Generate match analysis using AI
    const analysisPrompt = `
      Analyze the match between this candidate's profile and the job posting.
      
      Job Details:
      - Title: ${job.title}
      - Company: ${job.company}
      - Description: ${job.description}
      - Location: ${job.location}
      
      Candidate Profile:
      - Resume: ${resumeData ? JSON.stringify(resumeData.content) : 'No resume provided'}
      - Preferences: ${JSON.stringify(user.profile.preferences)}
      
      Provide analysis in JSON format with:
      - matchScore (0-100)
      - strengths (array of matching points)
      - gaps (array of missing qualifications)
      - recommendations (array of improvement suggestions)
      - salaryAlignment (analysis if salary info available)
      - cultureMatch (assessment based on available info)
      - applicationStrategy (recommended approach)
    `;

    const matchAnalysis = await GroqAIService.generateCompletion([
      { role: 'system', content: 'You are an expert career advisor and job matching specialist.' },
      { role: 'user', content: analysisPrompt }
    ], {
      temperature: 0.4,
      maxTokens: 1000
    });

    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(matchAnalysis.content);
    } catch (error) {
      parsedAnalysis = {
        matchScore: 75,
        strengths: ['Good overall profile match'],
        gaps: ['Some skill development opportunities'],
        recommendations: ['Consider highlighting relevant experience'],
        salaryAlignment: 'Unable to assess without salary information',
        cultureMatch: 'Research company culture for better alignment',
        applicationStrategy: 'Tailor your application to highlight relevant skills'
      };
    }

    // Update user usage
    await user.updateUsageStats('job_match_analysis');

    res.json({
      success: true,
      data: {
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        matchAnalysis: {
          ...parsedAnalysis,
          analyzedAt: new Date(),
          resumeUsed: resumeData ? resumeData._id : null
        }
      }
    });

  } catch (error) {
    console.error('Job match analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze job match'
    });
  }
};

// Get job search analytics
export const getJobSearchAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = '30d' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const analytics = await JobSearch.aggregate([
      { $match: { userId: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          totalJobsSaved: { $sum: { $size: '$results' } },
          avgJobsPerSearch: { $avg: { $size: '$results' } },
          searchTypes: { $push: '$type' },
          statuses: { $push: '$status' }
        }
      }
    ]);

    // Get saved jobs analytics
    const savedJobsSearch = await JobSearch.findOne({
      userId,
      type: 'saved_jobs'
    });

    let savedJobsAnalytics = {
      totalSaved: 0,
      applicationStatuses: {},
      priorities: {},
      avgDaysSaved: 0
    };

    if (savedJobsSearch && savedJobsSearch.results.length > 0) {
      const jobs = savedJobsSearch.results;
      savedJobsAnalytics.totalSaved = jobs.length;

      // Count application statuses
      savedJobsAnalytics.applicationStatuses = jobs.reduce((acc, job) => {
        acc[job.applicationStatus] = (acc[job.applicationStatus] || 0) + 1;
        return acc;
      }, {});

      // Count priorities
      savedJobsAnalytics.priorities = jobs.reduce((acc, job) => {
        acc[job.priority] = (acc[job.priority] || 0) + 1;
        return acc;
      }, {});

      // Calculate average days saved
      const totalDays = jobs.reduce((acc, job) => {
        const daysSaved = Math.floor((now - new Date(job.savedAt)) / (1000 * 60 * 60 * 24));
        return acc + daysSaved;
      }, 0);
      savedJobsAnalytics.avgDaysSaved = Math.round(totalDays / jobs.length);
    }

    const result = analytics[0] || {
      totalSearches: 0,
      totalJobsSaved: 0,
      avgJobsPerSearch: 0,
      searchTypes: [],
      statuses: []
    };

    res.json({
      success: true,
      data: {
        timeframe,
        summary: {
          totalSearches: result.totalSearches,
          totalJobsSaved: result.totalJobsSaved,
          avgJobsPerSearch: Math.round(result.avgJobsPerSearch || 0)
        },
        savedJobs: savedJobsAnalytics,
        trends: {
          searchTypes: result.searchTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}),
          searchStatuses: result.statuses.reduce((acc, status) => {
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    console.error('Job search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve job search analytics'
    });
  }
};