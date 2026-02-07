import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  TextField,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  School,
  Work,
  Star,
  Lightbulb,
  Assessment,
  Timeline,
  KeyboardArrowDown,
  CheckCircle,
  RadioButtonUnchecked,
  EmojiEvents,
  Business,
  People,
  Code,
  Brush,
  Calculate,
  Science,
  Gavel,
  LocalHospital,
  Store,
  ArrowBack
} from '@mui/icons-material';
import { useBotContext } from '../BotRouter';

const CareerAdvisor = () => {
  const { goToMain } = useBotContext();
  const [activeTab, setActiveTab] = useState(0);
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState({
    interests: [],
    skills: {},
    values: [],
    experience: '',
    education: '',
    goals: [],
    workStyle: '',
    industries: []
  });
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const interestCategories = [
    { id: 'technology', label: 'Technology & Programming', icon: <Code /> },
    { id: 'creative', label: 'Creative & Design', icon: <Brush /> },
    { id: 'business', label: 'Business & Management', icon: <Business /> },
    { id: 'healthcare', label: 'Healthcare & Medicine', icon: <LocalHospital /> },
    { id: 'education', label: 'Education & Training', icon: <School /> },
    { id: 'science', label: 'Science & Research', icon: <Science /> },
    { id: 'legal', label: 'Legal & Law', icon: <Gavel /> },
    { id: 'sales', label: 'Sales & Marketing', icon: <Store /> },
    { id: 'finance', label: 'Finance & Accounting', icon: <Calculate /> },
    { id: 'social', label: 'Social Work & Community', icon: <People /> }
  ];

  const skillAreas = [
    'Communication',
    'Leadership',
    'Problem Solving',
    'Technical Skills',
    'Creativity',
    'Analysis',
    'Organization',
    'Teamwork',
    'Time Management',
    'Strategic Thinking'
  ];

  const workValues = [
    'Work-Life Balance',
    'High Salary',
    'Job Security',
    'Career Growth',
    'Making a Difference',
    'Creative Freedom',
    'Flexible Schedule',
    'Travel Opportunities',
    'Team Collaboration',
    'Independent Work'
  ];

  const careerGoals = [
    'Become a Leader/Manager',
    'Become a Technical Expert',
    'Start My Own Business',
    'Work for a Big Corporation',
    'Work for a Startup',
    'Make a Social Impact',
    'Achieve Financial Freedom',
    'Have Creative Freedom',
    'Travel the World',
    'Maintain Work-Life Balance'
  ];

  const mockCareerSuggestions = [
    {
      title: 'Software Engineering Manager',
      match: 92,
      salaryRange: '$120k - $180k',
      growth: 'High',
      description: 'Lead technical teams while maintaining hands-on coding involvement',
      skills: ['Leadership', 'Technical Skills', 'Communication'],
      path: ['Senior Developer', 'Tech Lead', 'Engineering Manager'],
      companies: ['Google', 'Microsoft', 'Meta', 'Amazon']
    },
    {
      title: 'Product Manager',
      match: 87,
      salaryRange: '$100k - $160k',
      growth: 'High',
      description: 'Define product strategy and work with cross-functional teams',
      skills: ['Strategic Thinking', 'Communication', 'Analysis'],
      path: ['Associate PM', 'Product Manager', 'Senior PM'],
      companies: ['Apple', 'Spotify', 'Airbnb', 'Uber']
    },
    {
      title: 'UX Design Lead',
      match: 83,
      salaryRange: '$90k - $140k',
      growth: 'Medium',
      description: 'Lead design teams to create user-centered digital experiences',
      skills: ['Creativity', 'Leadership', 'Problem Solving'],
      path: ['UX Designer', 'Senior Designer', 'Design Lead'],
      companies: ['Adobe', 'Figma', 'Shopify', 'Netflix']
    }
  ];

  const skillGaps = [
    {
      skill: 'Data Analysis',
      current: 3,
      target: 7,
      priority: 'High',
      resources: ['Coursera SQL Course', 'Python for Data Analysis', 'Tableau Certification']
    },
    {
      skill: 'Public Speaking',
      current: 4,
      target: 8,
      priority: 'Medium',
      resources: ['Toastmasters', 'TED Talk Training', 'Communication Workshop']
    },
    {
      skill: 'Project Management',
      current: 6,
      target: 8,
      priority: 'Medium',
      resources: ['PMP Certification', 'Agile Training', 'SCRUM Master Course']
    }
  ];

  const handleAssessmentChange = (field, value) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillRating = (skill, rating) => {
    setAssessmentData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [skill]: rating
      }
    }));
  };

  const completeAssessment = async () => {
    setAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setResults({
      careerSuggestions: mockCareerSuggestions,
      skillGaps: skillGaps,
      personalityProfile: {
        type: 'Strategic Leader',
        description: 'You enjoy leading teams and thinking strategically about complex problems.',
        strengths: ['Leadership', 'Strategic Thinking', 'Communication'],
        workStyle: 'Collaborative with autonomy'
      }
    });
    
    setAnalyzing(false);
    setActiveTab(1);
  };

  const getMatchColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const renderAssessmentStep = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              What are your main interests?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select all areas that genuinely interest you
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {interestCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: assessmentData.interests.includes(category.id) ? 2 : 1,
                      borderColor: assessmentData.interests.includes(category.id) ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => {
                      const updated = assessmentData.interests.includes(category.id)
                        ? assessmentData.interests.filter(i => i !== category.id)
                        : [...assessmentData.interests, category.id];
                      handleAssessmentChange('interests', updated);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      {category.icon}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {category.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Rate your skills (1-10)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Be honest about your current skill levels
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {skillAreas.map((skill) => (
                <Grid item xs={12} md={6} key={skill}>
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      {skill}
                    </Typography>
                    <Slider
                      value={assessmentData.skills[skill] || 5}
                      onChange={(_, value) => handleSkillRating(skill, value)}
                      valueLabelDisplay="auto"
                      step={1}
                      marks
                      min={1}
                      max={10}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              What do you value most in a career?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select your top priorities (choose up to 5)
            </Typography>
            
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {workValues.map((value) => (
                <Grid item xs={12} sm={6} key={value}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={assessmentData.values.includes(value)}
                        onChange={(e) => {
                          if (e.target.checked && assessmentData.values.length >= 5) return;
                          const updated = e.target.checked
                            ? [...assessmentData.values, value]
                            : assessmentData.values.filter(v => v !== value);
                          handleAssessmentChange('values', updated);
                        }}
                        disabled={!assessmentData.values.includes(value) && assessmentData.values.length >= 5}
                      />
                    }
                    label={value}
                  />
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="caption" color="text.secondary">
              Selected: {assessmentData.values.length}/5
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Experience Level
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={assessmentData.experience}
                  onChange={(e) => handleAssessmentChange('experience', e.target.value)}
                >
                  <FormControlLabel value="entry" control={<Radio />} label="Entry Level (0-2 years)" />
                  <FormControlLabel value="mid" control={<Radio />} label="Mid Level (3-5 years)" />
                  <FormControlLabel value="senior" control={<Radio />} label="Senior Level (6-10 years)" />
                  <FormControlLabel value="executive" control={<Radio />} label="Executive Level (10+ years)" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Education Level
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={assessmentData.education}
                  onChange={(e) => handleAssessmentChange('education', e.target.value)}
                >
                  <FormControlLabel value="highschool" control={<Radio />} label="High School" />
                  <FormControlLabel value="bachelors" control={<Radio />} label="Bachelor's Degree" />
                  <FormControlLabel value="masters" control={<Radio />} label="Master's Degree" />
                  <FormControlLabel value="phd" control={<Radio />} label="PhD/Doctorate" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Career Goals
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              What are your long-term career aspirations?
            </Typography>
            
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {careerGoals.map((goal) => (
                <Grid item xs={12} sm={6} key={goal}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={assessmentData.goals.includes(goal)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...assessmentData.goals, goal]
                            : assessmentData.goals.filter(g => g !== goal);
                          handleAssessmentChange('goals', updated);
                        }}
                      />
                    }
                    label={goal}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  const renderAssessmentTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Career Assessment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Take our comprehensive assessment to discover careers that match your interests, skills, and values.
        </Typography>
      </Paper>

      <Stepper activeStep={assessmentStep} orientation="vertical">
        {['Interests', 'Skills', 'Values', 'Background', 'Goals'].map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              <Paper sx={{ p: 3, mb: 2 }}>
                {renderAssessmentStep(index)}
              </Paper>
              
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (index === 4) {
                      completeAssessment();
                    } else {
                      setAssessmentStep(index + 1);
                    }
                  }}
                  sx={{ mt: 1, mr: 1 }}
                  disabled={
                    (index === 0 && assessmentData.interests.length === 0) ||
                    (index === 2 && assessmentData.values.length === 0) ||
                    (index === 3 && (!assessmentData.experience || !assessmentData.education))
                  }
                >
                  {index === 4 ? (analyzing ? 'Analyzing...' : 'Complete Assessment') : 'Continue'}
                </Button>
                {index > 0 && (
                  <Button
                    onClick={() => setAssessmentStep(index - 1)}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );

  const renderResultsTab = () => {
    if (!results) {
      return (
        <Alert severity="info">
          Complete the career assessment to see your personalized results.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* Personality Profile */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Career Profile: {results.personalityProfile.type}
              </Typography>
              <Typography variant="body1" paragraph>
                {results.personalityProfile.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {results.personalityProfile.strengths.map((strength) => (
                  <Chip key={strength} label={strength} color="primary" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Career Suggestions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recommended Career Paths
          </Typography>
          
          <Grid container spacing={2}>
            {results.careerSuggestions.map((career, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {career.title}
                      </Typography>
                      <Badge
                        badgeContent={`${career.match}%`}
                        color={getMatchColor(career.match)}
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem', fontWeight: 'bold' } }}
                      >
                        <Star color={getMatchColor(career.match)} />
                      </Badge>
                    </Box>

                    <Typography variant="body2" paragraph>
                      {career.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Salary:</strong> {career.salaryRange}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Growth:</strong> {career.growth}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Key Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {career.skills.map((skill) => (
                        <Chip key={skill} label={skill} size="small" />
                      ))}
                    </Box>

                    <Accordion>
                      <AccordionSummary expandIcon={<KeyboardArrowDown />}>
                        <Typography variant="body2">Career Path</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {career.path.map((step, stepIndex) => (
                            <ListItem key={stepIndex}>
                              <ListItemIcon>
                                <Typography variant="body2" color="primary">
                                  {stepIndex + 1}.
                                </Typography>
                              </ListItemIcon>
                              <ListItemText primary={step} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<KeyboardArrowDown />}>
                        <Typography variant="body2">Top Companies</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {career.companies.map((company) => (
                            <Chip key={company} label={company} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const renderSkillsTab = () => {
    if (!results) {
      return (
        <Alert severity="info">
          Complete the career assessment to see your skill gap analysis.
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
          Skill Development Plan
        </Typography>
        
        <Grid container spacing={3}>
          {results.skillGaps.map((gap, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{gap.skill}</Typography>
                    <Chip
                      label={gap.priority}
                      color={gap.priority === 'High' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" gutterBottom>
                    Current Level: {gap.current}/10
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(gap.current / 10) * 100}
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />

                  <Typography variant="body2" gutterBottom>
                    Target Level: {gap.target}/10
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(gap.target / 10) * 100}
                    color="success"
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />

                  <Typography variant="subtitle2" gutterBottom>
                    Recommended Resources:
                  </Typography>
                  <List dense>
                    {gap.resources.map((resource, resourceIndex) => (
                      <ListItem key={resourceIndex} disableGutters>
                        <ListItemIcon>
                          <CheckCircle color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={resource} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

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
          <Lightbulb color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Career Advisor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discover your ideal career path with AI-powered guidance
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Assessment" />
          <Tab label="Career Matches" disabled={!results} />
          <Tab label="Skill Development" disabled={!results} />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 && renderAssessmentTab()}
        {activeTab === 1 && renderResultsTab()}
        {activeTab === 2 && renderSkillsTab()}
      </Box>
    </Box>
  );
};

export default CareerAdvisor;