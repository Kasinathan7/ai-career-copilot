import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Psychology,
  PlayArrow,
  Stop,
  Refresh,
  AccessTime,
  QuestionAnswer,
  TrendingUp,
  Lightbulb,
  Assessment,
  Code,
  People,
  School,
  CheckCircle,
  Warning,
  Error,
  AutoAwesome,
  ArrowBack,
  Send
} from '@mui/icons-material';
import { useBotContext } from '../BotRouter';
import axios from 'axios';
import toast from 'react-hot-toast';

const InterviewCoach = () => {
  const { goToMain } = useBotContext();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedType, setSelectedType] = useState('behavioral');
  const [selectedLevel, setSelectedLevel] = useState('entry');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const timerRef = useRef(null);
  const answerStartTime = useRef(null);

  const interviewTypes = [
    { value: 'behavioral', label: 'Behavioral', icon: <People /> },
    { value: 'technical', label: 'Technical', icon: <Code /> },
    { value: 'situational', label: 'Situational', icon: <Assessment /> },
    { value: 'case-study', label: 'Case Study', icon: <School /> }
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-5 years)' },
    { value: 'senior', label: 'Senior Level (6+ years)' },
    { value: 'executive', label: 'Executive Level' }
  ];

  useEffect(() => {
    if (sessionActive && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else if (!sessionActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionActive]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateQuestion = async () => {
    setLoading(true);
    try {
      const response = await api.post('/interview/generate-question',  {
        type: selectedType,
        level: selectedLevel,
        role: targetRole || undefined,
        company: targetCompany || undefined
      });

      if (response.data.success) {
        setCurrentQuestion(response.data.data.question);
        answerStartTime.current = Date.now();
        toast.success('New question generated!');
      }
    } catch (error) {
      console.error('Error generating question:', error);
      toast.error('Failed to generate question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    await generateQuestion();
    setSessionActive(true);
    setTimeElapsed(0);
    setUserAnswer('');
    setFeedback(null);
  };

  const analyzeAnswer = async () => {
    if (!userAnswer.trim() || userAnswer.length < 50) {
      toast.error('Please provide at least 50 characters in your answer');
      return;
    }

    setSessionActive(false);
    setAnalyzing(true);
    setShowFeedback(true);

    const duration = Math.floor((Date.now() - answerStartTime.current) / 1000);

    try {
      const response = await api.post('/interview/analyze-answer', {
        question: currentQuestion,
        answer: userAnswer,
        type: selectedType,
        level: selectedLevel,
        duration
      });

      if (response.data.success) {
        const feedbackData = response.data.data.feedback;
        setFeedback(feedbackData);

        const newSession = {
          id: Date.now(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          type: selectedType,
          level: selectedLevel,
          question: currentQuestion,
          answer: userAnswer,
          duration,
          score: feedbackData.overallScore,
          feedback: feedbackData
        };
        setSessionHistory(prev => [newSession, ...prev]);

        toast.success('Feedback generated!');
      }
    } catch (error) {
      console.error('Error analyzing answer:', error);
      toast.error('Failed to analyze answer. Please try again.');
      setShowFeedback(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const nextQuestion = async () => {
    await generateQuestion();
    setUserAnswer('');
    setTimeElapsed(0);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle color="success" />;
    if (score >= 60) return <Warning color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const renderPracticeTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome color="primary" />
              Interview Setup
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Interview Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={sessionActive}
              >
                {interviewTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                disabled={sessionActive}
              >
                {experienceLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Target Role (Recommended)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={sessionActive}
              sx={{ mb: 2 }}
              placeholder="e.g., Software Engineer, Product Manager"
              helperText="Enter your target role for role-specific questions"
            />

            <TextField
              fullWidth
              label="Target Company (Optional)"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              disabled={sessionActive}
              sx={{ mb: 3 }}
              placeholder="e.g., Google, Microsoft"
            />

            {!sessionActive ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                onClick={startSession}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Start AI Practice'}
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
                  onClick={nextQuestion}
                  disabled={loading}
                >
                  Next Question
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<Send />}
                  onClick={analyzeAnswer}
                  disabled={!userAnswer.trim() || userAnswer.length < 50}
                >
                  Get AI Feedback
                </Button>
              </Box>
            )}

            {sessionActive && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Chip
                  icon={<AccessTime />}
                  label={`Time: ${formatTime(timeElapsed)}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ minHeight: 400 }}>
          <CardContent>
            {!sessionActive && !currentQuestion ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Ready to Practice with AI?
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Get AI-powered interview practice with Gemini
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ✨ Role-specific questions tailored to your position<br/>
                  🤖 Detailed AI-powered feedback and coaching<br/>
                  📊 Track your progress and improve over time
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mt: 2, fontStyle: 'italic' }}>
                  💡 Enter your target role for the most relevant questions!
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    AI-Generated Question
                    {targetRole && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      for {targetRole}
                    </Typography>}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={selectedType} size="small" variant="outlined" color="primary" />
                    <Chip label={selectedLevel} size="small" variant="outlined" />
                    {targetRole && <Chip label={targetRole} size="small" variant="outlined" color="secondary" />}
                  </Box>
                </Box>
                
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QuestionAnswer color="primary" />
                    Question:
                  </Typography>
                  <Typography variant="body1">
                    {currentQuestion || 'Loading...'}
                  </Typography>
                </Paper>

                <Typography variant="h6" gutterBottom>Your Answer:</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here...\n\n💡 Tip: Use the STAR method:\n   • Situation\n   • Task\n   • Action\n   • Result"
                  variant="outlined"
                  helperText={`${userAnswer.length} characters (min 50)`}
                  error={userAnswer.length > 0 && userAnswer.length < 50}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderHistoryTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Practice History</Typography>
        {sessionHistory.length > 0 && (
          <Chip label={`${sessionHistory.length} session${sessionHistory.length > 1 ? 's' : ''}`} color="primary" variant="outlined" />
        )}
      </Box>
      
      {sessionHistory.length === 0 ? (
        <Alert severity="info">No practice sessions yet. Start practicing!</Alert>
      ) : (
        <Grid container spacing={2}>
          {sessionHistory.map((session) => (
            <Grid item xs={12} key={session.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {session.type} Interview
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.date} • {session.time}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getScoreIcon(session.score)}
                      <Typography variant="h6" color={`${getScoreColor(session.score)}.main`}>
                        {session.score}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {session.question}
                  </Typography>
                  
                  <LinearProgress
                    variant="determinate"
                    value={session.score}
                    color={getScoreColor(session.score)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderTipsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
              Interview Tips
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText primary="Use STAR Method" secondary="Situation, Task, Action, Result" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText primary="Be Specific" secondary="Include numbers and measurable outcomes" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                <ListItemText primary="Show Growth" secondary="Demonstrate learning from challenges" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider',
        background: (t) => (t.palette.mode === 'dark' ? 'rgba(26, 29, 26, 0.95)' : 'rgba(255,255,255,0.95)'),
        backdropFilter: 'saturate(180%) blur(8px)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={goToMain} variant="outlined" size="small">
            Back
          </Button>
          <Psychology color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>AI Interview Coach</Typography>
            <Typography variant="body2" color="text.secondary"></Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Practice" />
          <Tab label="History" />
          <Tab label="Tips" />
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {activeTab === 0 && renderPracticeTab()}
        {activeTab === 1 && renderHistoryTab()}
        {activeTab === 2 && renderTipsTab()}
      </Box>

      <Dialog open={showFeedback} onClose={() => !analyzing && setShowFeedback(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI Interview Feedback</DialogTitle>
        <DialogContent>
          {analyzing ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Analyzing your response...</Typography>
            </Box>
          ) : feedback ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getScoreIcon(feedback.overallScore)}
                  <Typography variant="h4" color={`${getScoreColor(feedback.overallScore)}.main`}>
                    {feedback.overallScore}%
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  {Object.entries(feedback.breakdown).map(([category, score]) => (
                    <Grid item xs={6} md={4} key={category}>
                      <Typography variant="body2" color="text.secondary">{category}</Typography>
                      <LinearProgress variant="determinate" value={score} color={getScoreColor(score)} sx={{ height: 8, borderRadius: 4 }} />
                      <Typography variant="body2">{score}%</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="success.main">Strengths</Typography>
                <List dense>
                  {feedback.strengths.map((s, i) => (
                    <ListItem key={i}><ListItemText primary={s} /></ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="warning.main">Improvements</Typography>
                <List dense>
                  {feedback.improvements.map((s, i) => (
                    <ListItem key={i}><ListItemText primary={s} /></ListItem>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6">Suggestions</Typography>
                <List dense>
                  {feedback.suggestions.map((s, i) => (
                    <ListItem key={i}><ListItemText primary={`${i+1}. ${s}`} /></ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeedback(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setShowFeedback(false); startSession(); }}>
            Practice Again
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewCoach;
