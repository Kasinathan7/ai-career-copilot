import React, { useState, useCallback } from 'react';
import api from '../../services/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField
} from '@mui/material';
import {
  CloudUpload,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  TrendingUp,
  TrendingDown,
  KeyboardArrowDown,
  Search,
  FilePresent,
  Analytics,
  ArrowBack
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useBotContext } from '../BotRouter';

const ATSScorer = () => {
  const { goToMain } = useBotContext();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError('Please upload a resume file');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('resume', uploadedFile);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      const response = await api.post(
  '/resumes/analyze-upload',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }
);

console.log('✅ Analysis complete:', response.data);

if (response.data.success && response.data.data.analysis) {
  setResults(response.data.data.analysis);
} else {
  throw new Error('Invalid response format');
}

      console.log('✅ Analysis complete:', data);

      if (data.success && data.data.analysis) {
        setResults(data.data.analysis);
      } else {
        throw new window.Error('Invalid response format');
      }

    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Failed to analyze resume: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateOptimizedPDF = async () => {
    if (!uploadedFile) {
      setError('Please upload a resume file');
      return;
    }

    setGeneratingPDF(true);
    setError('');
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('resume', uploadedFile);
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }

      console.log('🚀 Generating ATS-optimized PDF...');

      
      const response = await api.post(
  '/resumes/generate-ats-pdf',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    responseType: 'blob'
  }
);

// Axios gives blob directly
const blob = response.data;
const url = window.URL.createObjectURL(blob);

setDownloadUrl(url);

// Auto-download
const link = document.createElement('a');
link.href = url;
link.download = `ats-optimized-resume-${Date.now()}.pdf`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

      
      console.log('✅ ATS-optimized PDF downloaded!');
      
      setResults({
        success: true,
        message: 'Your ATS-optimized resume has been generated and downloaded!',
        pdfGenerated: true
      });

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(`Failed to generate PDF: ${err.message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle color="success" />;
    if (score >= 60) return <Warning color="warning" />;
    return <Error color="error" />;
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
          <Analytics color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              ATS Scorer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyze your resume's ATS compatibility and get optimization suggestions
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={3}>
          {/* File Upload Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upload Resume
                </Typography>
                
                <Paper
                  {...getRootProps()}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'divider',
                    bgcolor: isDragActive ? 'action.hover' : 'background.default',
                    cursor: 'pointer',
                    mb: 2,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input {...getInputProps()} />
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" gutterBottom>
                    {isDragActive ? 'Drop your resume here...' : 'Drag & drop your resume or click to browse'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supports PDF, DOC, DOCX, TXT (max 10MB)
                  </Typography>
                </Paper>

                {uploadedFile && (
                  <Alert severity="success" icon={<FilePresent />}>
                    <Typography variant="body2">
                      <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </Typography>
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Job Description Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Job Description (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Paste the job description for more accurate ATS analysis
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description here for targeted analysis..."
                  variant="outlined"
                />

                <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
                  
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleAnalyze}
                    disabled={!uploadedFile || analyzing}
                    startIcon={analyzing ? <CircularProgress size={20} /> : <Search />}
                    sx={{ px: 4 }}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Resume'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Section */}
          {results && results.pdfGenerated && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Alert severity="success" icon={<CheckCircle />}>
                    <Typography variant="h6" gutterBottom>
                      🎉 Success! Your ATS-Optimized Resume is Ready
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Your resume has been parsed by AI, optimized for ATS systems, and converted to a professional PDF format.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      ✅ All information extracted from your PDF<br />
                      ✅ Optimized with relevant keywords<br />
                      ✅ Formatted for maximum ATS compatibility<br />
                      ✅ Professional layout and structure
                      {jobDescription && <><br />✅ Tailored for the specific job description</>}
                    </Typography>
                    {downloadUrl && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<FilePresent />}
                          href={downloadUrl}
                          download={`ats-optimized-resume-${Date.now()}.pdf`}
                        >
                          Download Again
                        </Button>
                      </Box>
                    )}
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          )}

          {results && !results.pdfGenerated && (
            <>
              {/* Overall Score */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ATS Compatibility Score
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {getScoreIcon(results.overall)}
                      <Typography variant="h3" color={`${getScoreColor(results.overall)}.main`}>
                        {results.overall}%
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={results.overall}
                          color={getScoreColor(results.overall)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      {Object.entries(results.breakdown).map(([category, score]) => (
                        <Grid item xs={6} md={3} key={category}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {category}
                            </Typography>
                            <Typography variant="h6" color={`${getScoreColor(score)}.main`}>
                              {score}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={score}
                              color={getScoreColor(score)}
                              sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Keyword Analysis */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Keyword Analysis
                    </Typography>
                    
                    <List dense>
                      {results.keywordMatches?.map((keyword, index) => (
                        <ListItem key={index} disableGutters sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <ListItemIcon>
                              {keyword.found ? 
                                <CheckCircle color="success" fontSize="small" /> : 
                                <Error color="error" fontSize="small" />
                              }
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {keyword.keyword}
                                  </Typography>
                                  {keyword.importance && (
                                    <Chip 
                                      label={keyword.importance} 
                                      size="small" 
                                      color={
                                        keyword.importance === 'critical' ? 'error' :
                                        keyword.importance === 'high' ? 'warning' : 'default'
                                      }
                                    />
                                  )}
                                </Box>
                              }
                              secondary={keyword.found ? `Found ${keyword.frequency} times` : 'Not found'}
                            />
                          </Box>
                          {keyword.context && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 5, mt: 0.5 }}>
                              {keyword.context}
                            </Typography>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Section Analysis */}
              {results.sectionAnalysis && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Section-by-Section Analysis
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {Object.entries(results.sectionAnalysis).map(([section, data]) => (
                          <Grid item xs={12} md={6} key={section}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                                  {section.replace(/([A-Z])/g, ' $1').trim()}
                                </Typography>
                                <Chip 
                                  label={`${data.score}%`} 
                                  color={getScoreColor(data.score)}
                                  size="small"
                                />
                              </Box>
                              
                              {data.issues && data.issues.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                                    Issues:
                                  </Typography>
                                  {data.issues.map((issue, idx) => (
                                    <Typography key={idx} variant="caption" display="block" color="text.secondary">
                                      • {issue}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              
                              {data.recommendations && data.recommendations.length > 0 && (
                                <Box>
                                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                                    Recommendations:
                                  </Typography>
                                  {data.recommendations.map((rec, idx) => (
                                    <Typography key={idx} variant="caption" display="block" color="text.secondary">
                                      • {rec}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* ATS Compatibility & Impact Analysis */}
              <Grid item xs={12} md={6}>
                {results.atsCompatibility && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        ATS Compatibility Details
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Parseability</Typography>
                          <Chip 
                            label={results.atsCompatibility.parseability} 
                            size="small"
                            color={
                              results.atsCompatibility.parseability === 'excellent' ? 'success' :
                              results.atsCompatibility.parseability === 'good' ? 'info' :
                              results.atsCompatibility.parseability === 'fair' ? 'warning' : 'error'
                            }
                          />
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={results.atsCompatibility.score} 
                          color={getScoreColor(results.atsCompatibility.score)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      {results.atsCompatibility.formatIssues && results.atsCompatibility.formatIssues.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            Format Issues:
                          </Typography>
                          <List dense>
                            {results.atsCompatibility.formatIssues.map((issue, idx) => (
                              <ListItem key={idx} disableGutters>
                                <ListItemIcon>
                                  <Warning color="warning" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={issue}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {results.atsCompatibility.recommendations && results.atsCompatibility.recommendations.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Recommendations:
                          </Typography>
                          <List dense>
                            {results.atsCompatibility.recommendations.map((rec, idx) => (
                              <ListItem key={idx} disableGutters>
                                <ListItemIcon>
                                  <CheckCircle color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={rec}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {results.impactAnalysis && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Impact & Achievement Analysis
                      </Typography>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Typography variant="h4" color="primary">
                              {results.impactAnalysis.quantifiedAchievements}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Quantified Achievements
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                            <Chip 
                              label={results.impactAnalysis.actionVerbUsage} 
                              color={
                                results.impactAnalysis.actionVerbUsage === 'excellent' ? 'success' :
                                results.impactAnalysis.actionVerbUsage === 'good' ? 'info' :
                                results.impactAnalysis.actionVerbUsage === 'fair' ? 'warning' : 'error'
                              }
                            />
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                              Action Verb Usage
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Result Orientation: {results.impactAnalysis.resultOrientation}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={results.impactAnalysis.resultOrientation} 
                          color={getScoreColor(results.impactAnalysis.resultOrientation)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      {results.impactAnalysis.specificExamples && results.impactAnalysis.specificExamples.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="success.main" gutterBottom>
                            Strong Examples:
                          </Typography>
                          {results.impactAnalysis.specificExamples.map((example, idx) => (
                            <Typography key={idx} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                              • {example}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      {results.impactAnalysis.missingMetrics && results.impactAnalysis.missingMetrics.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="warning.main" gutterBottom>
                            Missing Metrics:
                          </Typography>
                          {results.impactAnalysis.missingMetrics.map((metric, idx) => (
                            <Typography key={idx} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                              • {metric}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>

              {/* Suggestions */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Improvement Suggestions
                    </Typography>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<KeyboardArrowDown />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp color="success" />
                          <Typography>Strengths ({results.strengths.length})</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {results.strengths.map((strength, index) => (
                            <ListItem key={index} disableGutters>
                              <ListItemIcon>
                                <CheckCircle color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={strength} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<KeyboardArrowDown />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingDown color="warning" />
                          <Typography>Areas for Improvement ({results.improvements.length})</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {results.improvements.map((improvement, index) => (
                            <ListItem key={index} disableGutters>
                              <ListItemIcon>
                                <Warning color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={improvement} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<KeyboardArrowDown />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Assignment color="info" />
                          <Typography>Action Items ({results.suggestions.length})</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {results.suggestions.map((suggestion, index) => (
                            <ListItem key={index} disableGutters>
                              <ListItemIcon>
                                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                  {index + 1}.
                                </Typography>
                              </ListItemIcon>
                              <ListItemText primary={suggestion} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default ATSScorer;