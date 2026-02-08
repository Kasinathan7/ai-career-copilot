import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api/base';
  
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Autocomplete,
  IconButton,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Link
} from '@mui/material';
import {
  Search,
  FilterList,
  Work,
  LocationOn,
  AttachMoney,
  Business,
  Schedule,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Share,
  Delete,
  Visibility,
  Send as ApplyIcon,
  ArrowBack,
  OpenInNew,
  Psychology
} from '@mui/icons-material';
import { useBotContext } from '../BotRouter';
import axios from 'axios';
import toast from 'react-hot-toast';

const JobFinder = () => {
  const { goToMain } = useBotContext();
  const [activeTab, setActiveTab] = useState(0);
  const [searchCriteria, setSearchCriteria] = useState({
    keywords: '',
    location: '',
    jobType: '',
    experience: '',
    salaryMin: 0,
    salaryMax: 200000,
    remote: false,
    company: ''
  });
  
  const [jobResults, setJobResults] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];
  const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Design', 'Sales'];

  // Mock job data - replace with actual API calls
  const mockJobs = [
    {
      id: 1,
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: { min: 120000, max: 160000 },
      remote: true,
      posted: '2 days ago',
      description: 'We are looking for a Senior React Developer to join our dynamic team...',
      requirements: ['5+ years React experience', 'TypeScript', 'Node.js', 'AWS'],
      benefits: ['Health Insurance', '401k', 'Remote Work', 'Stock Options'],
      matchScore: 92,
      companyLogo: 'TC'
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Austin, TX',
      type: 'Full-time',
      salary: { min: 90000, max: 130000 },
      remote: false,
      posted: '1 week ago',
      description: 'Join our fast-growing startup as a Full Stack Engineer...',
      requirements: ['3+ years experience', 'React', 'Python', 'PostgreSQL'],
      benefits: ['Equity', 'Flexible Hours', 'Learning Budget'],
      matchScore: 85,
      companyLogo: 'SX'
    },
    {
      id: 3,
      title: 'Frontend Developer',
      company: 'DesignStudio',
      location: 'New York, NY',
      type: 'Contract',
      salary: { min: 80, max: 120 },
      remote: true,
      posted: '3 days ago',
      description: 'Looking for a talented Frontend Developer to work on exciting projects...',
      requirements: ['React', 'CSS/SASS', 'JavaScript', 'Figma'],
      benefits: ['Flexible Schedule', 'Creative Environment'],
      matchScore: 78,
      companyLogo: 'DS'
    }
  ];

  useEffect(() => {
    // Load saved data from localStorage
    const saved = localStorage.getItem('savedJobs');
    if (saved) setSavedJobs(JSON.parse(saved));
    
    const applied = localStorage.getItem('appliedJobs');
    if (applied) setAppliedJobs(new Set(JSON.parse(applied)));
    
    const history = localStorage.getItem('searchHistory');
    if (history) setSearchHistory(JSON.parse(history));
  }, []);

  const handleSearch = async () => {
    if (!searchCriteria.keywords && !searchCriteria.location) {
      toast.error('Please enter keywords or location to search');
      return;
    }

    setLoading(true);
    
    try {
      // Call Gemini AI job search endpoint
      const response = await axios.post(
  `${API_BASE_URL}/external-jobs/search-ai`,
  {
    keywords: searchCriteria.keywords,
    location: searchCriteria.location,
    jobType: searchCriteria.jobType,
    experienceLevel: searchCriteria.experience,
    remote: searchCriteria.remote,
    salaryMin: searchCriteria.salaryMin,
    salaryMax: searchCriteria.salaryMax,
    limit: 10
  }
);


      if (response.data.success) {
        const jobs = response.data.data.jobs.map((job, index) => ({
          id: Date.now() + index,
          title: job.title || 'Untitled Position',
          company: job.company || 'Company Name Not Available',
          location: job.location || 'Location not specified',
          type: job.type || 'Full-time',
          salary: job.salary || { min: null, max: null, currency: 'USD' },
          remote: job.remote || false,
          posted: job.posted || 'Recently',
          description: job.description || 'No description available',
          requirements: Array.isArray(job.requirements) ? job.requirements : [],
          benefits: Array.isArray(job.benefits) ? job.benefits : [],
          matchScore: job.matchScore || 85,
          companyLogo: (job.company || 'UN').substring(0, 2).toUpperCase(),
          source: job.source || 'Unknown',
          url: job.url || ''
        }));

        setJobResults(jobs);
        toast.success(`Found ${jobs.length} jobs using AI!`);
      } else {
        toast.error('Failed to find jobs. Please try again.');
        setJobResults([]);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      toast.error('Failed to search jobs. Please try again.');
      setJobResults([]);
    } finally {
      setLoading(false);
    }

    // Add to search history
    const newSearch = {
      id: Date.now(),
      criteria: { ...searchCriteria },
      resultsCount: jobResults.length,
      date: new Date().toLocaleDateString()
    };
    const updatedHistory = [newSearch, ...searchHistory.slice(0, 9)];
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const toggleSaveJob = (job) => {
    let updated;
    if (savedJobs.find(saved => saved.id === job.id)) {
      updated = savedJobs.filter(saved => saved.id !== job.id);
    } else {
      updated = [job, ...savedJobs];
    }
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const handleApply = (jobId) => {
    const updated = new Set([...appliedJobs, jobId]);
    setAppliedJobs(updated);
    localStorage.setItem('appliedJobs', JSON.stringify([...updated]));
  };

  const getMatchColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) {
      return 'Salary not specified';
    }
    if (salary.min && salary.max) {
      if (salary.min === salary.max) {
        return `$${salary.min.toLocaleString()}`;
      }
      return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
    }
    if (salary.min) {
      return `From $${salary.min.toLocaleString()}`;
    }
    if (salary.max) {
      return `Up to $${salary.max.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  const renderSearchTab = () => (
    <Grid container spacing={3}>
      {/* Search Filters */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Psychology color="primary" />
              AI Job Search
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI - Searches the latest jobs from across the internet
            </Typography>
            
            <TextField
              fullWidth
              label="Keywords (Required)"
              value={searchCriteria.keywords}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g., React Developer, Product Manager"
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Location (Recommended)"
              value={searchCriteria.location}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., San Francisco, CA or Remote"
              sx={{ mb: 2 }}
              helperText="City, state, or 'Remote' for remote jobs"
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={searchCriteria.jobType}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, jobType: e.target.value }))}
              >
                <MenuItem value="">Any</MenuItem>
                {jobTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={searchCriteria.experience}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, experience: e.target.value }))}
              >
                <MenuItem value="">Any</MenuItem>
                {experienceLevels.map(level => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" gutterBottom>
              Salary Range: ${searchCriteria.salaryMin.toLocaleString()} - ${searchCriteria.salaryMax.toLocaleString()}
            </Typography>
            <Slider
              value={[searchCriteria.salaryMin, searchCriteria.salaryMax]}
              onChange={(_, newValue) => setSearchCriteria(prev => ({ 
                ...prev, 
                salaryMin: newValue[0], 
                salaryMax: newValue[1] 
              }))}
              valueLabelDisplay="auto"
              min={0}
              max={300000}
              step={5000}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={searchCriteria.remote}
                  onChange={(e) => setSearchCriteria(prev => ({ ...prev, remote: e.target.checked }))}
                />
              }
              label="Remote work only"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Company"
              value={searchCriteria.company}
              onChange={(e) => setSearchCriteria(prev => ({ ...prev, company: e.target.value }))}
              placeholder="e.g., Google"
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Psychology />}
              onClick={handleSearch}
              disabled={loading || (!searchCriteria.keywords && !searchCriteria.location)}
              size="large"
              sx={{ mt: 1 }}
            >
              {loading ? 'Searching with AI...' : 'Search Jobs with AI'}
            </Button>
            {(!searchCriteria.keywords && !searchCriteria.location) && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Please enter keywords or location
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Job Results */}
      <Grid item xs={12} md={8}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI Job Results {jobResults.length > 0 && `(${jobResults.length} found)`}
          </Typography>
          {jobResults.length > 0 && (
            <Button startIcon={<Search />} onClick={handleSearch} disabled={loading} variant="outlined">
              New Search
            </Button>
          )}
        </Box>

        {jobResults.length === 0 && !loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ready to Find Your Next Job with AI?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Gemini AI will search the latest job postings from across the internet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ✨ Real-time job search from multiple sources<br/>
              🤖 AI-powered matching and recommendations<br/>
              🔗 Direct links to apply
            </Typography>
          </Paper>
        ) : loading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              AI is searching the internet for jobs...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take a moment as we search across multiple job boards
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {jobResults.map((job) => (
              <Card key={job.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {job.companyLogo}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {job.title}
                        </Typography>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          {job.company}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          <Chip
                            icon={<LocationOn />}
                            label={job.location}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={job.type}
                            size="small"
                            variant="outlined"
                          />
                          {job.remote && (
                            <Chip
                              label="Remote"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatSalary(job.salary)} • Posted {job.posted}
                          {job.source && (
                            <>
                              {' • '}
                              <Chip 
                                label={job.source} 
                                size="small" 
                                variant="outlined" 
                                sx={{ ml: 0.5, height: 20 }}
                              />
                            </>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Badge
                        badgeContent={`${job.matchScore}%`}
                        color={getMatchColor(job.matchScore)}
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', fontWeight: 'bold' } }}
                      >
                        <Star color={getMatchColor(job.matchScore)} />
                      </Badge>
                      <Typography variant="caption" color="text.secondary">
                        Match
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {job.description.substring(0, 150)}...
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {job.requirements.slice(0, 3).map((req, index) => (
                      <Chip key={index} label={req} size="small" />
                    ))}
                    {job.requirements.length > 3 && (
                      <Chip label={`+${job.requirements.length - 3} more`} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  {job.url && (
                    <Button
                      variant="contained"
                      startIcon={<OpenInNew />}
                      onClick={() => window.open(job.url, '_blank')}
                      color="primary"
                    >
                      View & Apply
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => {
                      setSelectedJob(job);
                      setShowJobDetails(true);
                    }}
                  >
                    Details
                  </Button>
                  <IconButton
                    onClick={() => toggleSaveJob(job)}
                    color={savedJobs.find(saved => saved.id === job.id) ? 'primary' : 'default'}
                  >
                    {savedJobs.find(saved => saved.id === job.id) ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Grid>
    </Grid>
  );

  const renderSavedTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Saved Jobs ({savedJobs.length})
      </Typography>
      
      {savedJobs.length === 0 ? (
        <Alert severity="info">
          No saved jobs yet. Save jobs from the search results to access them here.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {savedJobs.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => toggleSaveJob(job)}
                      color="primary"
                    >
                      <Bookmark />
                    </IconButton>
                  </Box>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {job.company}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {job.location} • {formatSalary(job.salary)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ApplyIcon />}
                      onClick={() => handleApply(job.id)}
                      disabled={appliedJobs.has(job.id)}
                    >
                      {appliedJobs.has(job.id) ? 'Applied' : 'Apply'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Launch />}
                      onClick={() => {
                        setSelectedJob(job);
                        setShowJobDetails(true);
                      }}
                    >
                      Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderApplicationsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Applied Jobs ({appliedJobs.size})
      </Typography>
      
      {appliedJobs.size === 0 ? (
        <Alert severity="info">
          No applications yet. Apply to jobs to track them here.
        </Alert>
      ) : (
        <List>
          {jobResults.concat(savedJobs)
            .filter((job, index, arr) => arr.findIndex(j => j.id === job.id) === index)
            .filter(job => appliedJobs.has(job.id))
            .map((job) => (
              <Card key={job.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">{job.title}</Typography>
                      <Typography variant="subtitle1" color="primary">{job.company}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Applied • Status: Under Review
                      </Typography>
                    </Box>
                    <Chip label="Applied" color="success" />
                  </Box>
                </CardContent>
              </Card>
            ))}
        </List>
      )}
    </Box>
  );

  const renderHistoryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Search History
      </Typography>
      
      {searchHistory.length === 0 ? (
        <Alert severity="info">
          No search history yet. Your previous searches will appear here.
        </Alert>
      ) : (
        <List>
          {searchHistory.map((search) => (
            <Card key={search.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {search.criteria.keywords || 'All Jobs'} 
                      {search.criteria.location && ` in ${search.criteria.location}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {search.resultsCount} results • {search.date}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSearchCriteria(search.criteria);
                      setActiveTab(0);
                    }}
                  >
                    Repeat Search
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider',
        background: (t) => (t.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255,255,255,0.8)'),
        backdropFilter: 'saturate(180%) blur(8px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={goToMain}
            variant="outlined"
            size="small"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Back to Chat
          </Button>
          <Psychology color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              AI Job Finder
            </Typography>
            <Typography variant="body2" color="text.secondary">
               Search real jobs from the internet
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Search" />
          <Tab label={`Saved (${savedJobs.length})`} />
          <Tab label={`Applications (${appliedJobs.size})`} />
          <Tab label="History" />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 && renderSearchTab()}
        {activeTab === 1 && renderSavedTab()}
        {activeTab === 2 && renderApplicationsTab()}
        {activeTab === 3 && renderHistoryTab()}
      </Box>

      {/* Job Details Dialog */}
      <Dialog
        open={showJobDetails}
        onClose={() => setShowJobDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {selectedJob.companyLogo}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedJob.title}</Typography>
                  <Typography variant="subtitle1" color="primary">
                    {selectedJob.company}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>Job Description</Typography>
                  <Typography variant="body1" paragraph>
                    {selectedJob.description}
                  </Typography>

                  <Typography variant="h6" gutterBottom>Requirements</Typography>
                  <List dense>
                    {selectedJob.requirements.map((req, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${req}`} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom>Benefits</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedJob.benefits.map((benefit, index) => (
                      <Chip key={index} label={benefit} variant="outlined" />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Job Details</Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Location:</strong> {selectedJob.location}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Type:</strong> {selectedJob.type}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Salary:</strong> {formatSalary(selectedJob.salary)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Remote:</strong> {selectedJob.remote ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Posted:</strong> {selectedJob.posted}
                    </Typography>
                    {selectedJob.source && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Source:</strong> {selectedJob.source}
                      </Typography>
                    )}
                    <Typography variant="body2" gutterBottom>
                      <strong>Match Score:</strong> {selectedJob.matchScore}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowJobDetails(false)}>Close</Button>
              <Button
                variant="outlined"
                startIcon={savedJobs.find(saved => saved.id === selectedJob.id) ? <Bookmark /> : <BookmarkBorder />}
                onClick={() => toggleSaveJob(selectedJob)}
              >
                {savedJobs.find(saved => saved.id === selectedJob.id) ? 'Saved' : 'Save Job'}
              </Button>
              {selectedJob.url && (
                <Button
                  variant="contained"
                  startIcon={<OpenInNew />}
                  onClick={() => window.open(selectedJob.url, '_blank', 'noopener,noreferrer')}
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                >
                  View & Apply
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default JobFinder;