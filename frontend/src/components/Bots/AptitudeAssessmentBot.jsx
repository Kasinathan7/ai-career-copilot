import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress
} from '@mui/material';
import { useBotContext } from '../BotRouter';

const API_BASE = 'http://localhost:5002/api/v1';

const AptitudeAssessmentBot = () => {
  const { goToMain } = useBotContext();

  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/aptitude/start`);

      console.log('START SESSION RAW RESPONSE:', response.data);

      const payload = response.data;
      if (!payload || !payload.sessionId) {
        throw new Error('Invalid session response');
      }

      setSessionId(payload.sessionId);
    } catch (err) {
      console.error('❌ startSession failed:', err);
      setError('Failed to start assessment session.');
    } finally {
      setLoading(false);
    }
  };

  const loadNext = async (sid) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API_BASE}/aptitude/next/${sid}`);
      const payload = res.data;

      if (!payload || !payload.data) {
        throw new Error('Invalid question response');
      }

      setQuestion(payload.data);
      setSelected(null);
      setFeedback(null);
    } catch (err) {
      console.error('❌ loadNext failed:', err);
      setError('Failed to load next question.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) loadNext(sessionId);
  }, [sessionId]);

  const submit = async () => {
    try {
      const res = await axios.post(`${API_BASE}/aptitude/answer`, {
        sessionId,
        questionId: question.questionId,
        selectedIndex: selected
      });

      const result = res.data;

      if (
        typeof result.correct !== 'boolean' ||
        typeof result.score !== 'number' ||
        typeof result.total !== 'number'
      ) {
        throw new Error('Invalid submit response');
      }

      setFeedback(result);

      if (result.total >= 10) {
        const endRes = await axios.post(`${API_BASE}/aptitude/end/${sessionId}`);
        setSummary(endRes.data.data);
        setFinished(true);
      }
    } catch (err) {
      console.error('❌ submit failed:', err);
      setError('Failed to submit answer.');
    }
  };

  if (loading && !question && !finished) {
    return (
      <Box p={3} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} onClick={goToMain}>
          Back to Chat
        </Button>
      </Box>
    );
  }

  if (finished && summary) {
    const total = summary.totalQuestions;
    const score = summary.score;
    const accuracy = Math.round((score / total) * 100);

    return (
      <Box p={3}>
        <Typography variant="h5">Assessment Complete</Typography>
        <Typography sx={{ mt: 1 }}>
          Score: {score} / {total}
        </Typography>
        <Typography>Accuracy: {accuracy}%</Typography>
        <Typography>Difficulty Reached: {summary.difficulty}</Typography>

        <Box mt={2}>
          <Typography>
            Logical: {summary.topicStats.logical.correct} / {summary.topicStats.logical.asked}
          </Typography>
          <Typography>
            Quantitative: {summary.topicStats.quantitative.correct} / {summary.topicStats.quantitative.asked}
          </Typography>
          <Typography>
            Verbal: {summary.topicStats.verbal.correct} / {summary.topicStats.verbal.asked}
          </Typography>
        </Box>

        <Button sx={{ mt: 2 }} onClick={goToMain}>
          Back to Chat
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Button onClick={goToMain}>← Back to Chat</Button>

      {question && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="subtitle2">
            Difficulty: {question.difficulty}
          </Typography>

          <Typography variant="h6" sx={{ mt: 1 }}>
            {question.question}
          </Typography>

          <RadioGroup
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {question.options.map((opt, idx) => (
              <FormControlLabel
                key={idx}
                value={idx}
                control={<Radio />}
                label={opt}
              />
            ))}
          </RadioGroup>

          {!feedback && (
            <Button
              variant="contained"
              onClick={submit}
              disabled={selected === null}
            >
              Submit
            </Button>
          )}

          {feedback && (
            <>
              <Typography sx={{ mt: 2 }}>
                {feedback.correct ? 'Correct ✅' : 'Wrong ❌'}
              </Typography>
              <Typography variant="body2">{feedback.explanation}</Typography>

              <Button sx={{ mt: 2 }} onClick={() => loadNext(sessionId)}>
                Next Question
              </Button>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AptitudeAssessmentBot;
