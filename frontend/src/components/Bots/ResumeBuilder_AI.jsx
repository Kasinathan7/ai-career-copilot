import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Edit,
  CheckCircle,
  AutoFixHigh,
  Download,
  ArrowBack,
  RefreshOutlined,
  ExpandMore,
  Language,
  EmojiEvents,
  Work,
  Code,
  Person,
  Email,
  Phone,
  LocationOn,
  BusinessCenter,
  Business
} from '@mui/icons-material';
import { useBotContext } from '../BotRouter';
import axios from 'axios';

const ResumeBuilder_AI = () => {
  const { goToMain } = useBotContext();
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [generatedResume, setGeneratedResume] = useState(null);

  const [formData, setFormData] = useState({
    aboutMe: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    targetRole: '',
    yearsExperience: '',
    industry: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGenerateResume = async () => {
    if (!formData.aboutMe || formData.aboutMe.trim().length < 50) {
      setError('Please provide at least 50 characters about yourself');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5002/api/v1/resumes/generate-from-text', formData);
      
      if (response.data.success) {
        setGeneratedResume(response.data.data.resume);
        setStep(2);
      } else {
        setError(response.data.message || 'Failed to generate resume');
      }
    } catch (err) {
      console.error('Generate resume error:', err);
      setError(err.response?.data?.message || 'Failed to generate resume. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedResume) return;

    try {
      const response = await axios.post('http://localhost:5002/api/v1/resumes/generate-pdf', 
        { resumeData: generatedResume },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedResume.personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download PDF. Please try again.');
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setGeneratedResume(null);
    setFormData({
      aboutMe: '',
      name: '',
      email: '',
      phone: '',
      location: '',
      targetRole: '',
      yearsExperience: '',
      industry: ''
    });
    setError('');
  };

  const renderInputForm = () => (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Tell us about yourself
          </Typography>

          <Stack spacing={3}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="About You *"
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleInputChange}
              placeholder="Tell us about your work experience, skills, education, achievements, projects, and career goals..."
              helperText={`${formData.aboutMe.length} characters (minimum 50 required)`}
              error={formData.aboutMe.length > 0 && formData.aboutMe.length < 50}
            />

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
              Personal Information (Optional)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="John Doe"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="john@example.com"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="+1 (555) 123-4567"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="San Francisco, CA"
                />
              </Grid>
            </Grid>

            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>
              Target Position (Optional)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target Role"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessCenter fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Software Engineer"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleInputChange}
                  placeholder="5"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Technology, Healthcare, Finance, etc."
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              startIcon={<AutoFixHigh />}
              onClick={handleGenerateResume}
              disabled={processing || formData.aboutMe.length < 50}
              sx={{ mt: 2 }}
            >
              {processing ? 'Generating Resume...' : 'Generate Professional Resume'}
            </Button>

            {processing && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Our AI is crafting your professional resume...
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );

  const renderResumePreview = () => (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                Resume Generated!
              </Typography>

              <Typography variant="body2" color="text.secondary" paragraph>
                Your professional resume has been created with AI-powered optimization.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Download />}
                  onClick={handleDownloadPDF}
                  size="large"
                >
                  Download PDF
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RefreshOutlined />}
                  onClick={handleStartOver}
                >
                  Create Another Resume
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Resume Preview
              </Typography>

              <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid', borderColor: 'divider' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                  {generatedResume.personalInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {generatedResume.personalInfo.email} | {generatedResume.personalInfo.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {generatedResume.personalInfo.location}
                </Typography>
              </Box>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Professional Summary
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {generatedResume.summary}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {generatedResume.experience && generatedResume.experience.length > 0 && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work fontSize="small" />
                      Experience
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {generatedResume.experience.map((exp, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {exp.position} | {exp.company}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.startDate} - {exp.endDate}
                        </Typography>
                        <List dense sx={{ pl: 2 }}>
                          {exp.achievements.map((achievement, idx) => (
                            <ListItem key={idx} sx={{ pl: 0, py: 0.5, display: 'list-item' }}>
                              <Typography variant="body2">{achievement}</Typography>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}

              {generatedResume.skills && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Code fontSize="small" />
                      Skills
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {generatedResume.skills.technical && generatedResume.skills.technical.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                            Technical Skills
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {generatedResume.skills.technical.map((skill, index) => (
                              <Chip key={index} label={skill} size="small" variant="outlined" color="primary" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {generatedResume.education && generatedResume.education.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Education
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {generatedResume.education.map((edu, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {edu.institution}
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ 
        p: 2, 
        borderRadius: 0, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        background: (t) => (t.palette.mode === 'dark' ? 'rgba(26, 29, 26, 0.95)' : 'rgba(255,255,255,0.95)'),
        backdropFilter: 'saturate(180%) blur(8px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={goToMain}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 1.5 }}
          >
            Back to Chat
          </Button>
          <Edit color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Resume Builder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Describe yourself and let AI create a professional resume
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {step === 1 && renderInputForm()}
        {step === 2 && generatedResume && renderResumePreview()}
      </Box>
    </Box>
  );
};

export default ResumeBuilder_AI;
