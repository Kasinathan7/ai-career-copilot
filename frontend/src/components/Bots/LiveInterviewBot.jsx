import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Paper, Stack, LinearProgress } from '@mui/material';
import api from '../../services/api';
import { useBotContext } from '../BotRouter';

import {
  loadFaceModels,
  startFaceAnalysis,
  stopFaceAnalysis,
  resetFaceMetrics,
  getFaceMetrics
} from '../../utils/faceAnalysisHelper';

import LiveInterviewReport from './LiveInterviewReport';

const QUESTION_TIME_SECONDS = 10;
const REPORT_POLL_INTERVAL = 2000;
const REPORT_POLL_MAX_TRIES = 15;

const LiveInterviewBot = ({ onBackToChat }) => {
  const { goToMain } = useBotContext();

  const initializedRef = useRef(false);
  const pollingStartedRef = useRef(false);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const submittingRef = useRef(false);
  const sessionIdRef = useRef(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [question, setQuestion] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    if (initializedRef.current) return;
    initializedRef.current = true;

    init();

    return cleanup;
  }, [hasStarted]);

  const extractSession = (res) => res?.data?.data || res?.data;

  const init = async () => {
    await loadFaceModels();
    await startCamera();
    await createSession();
  };

  const cleanup = () => {
    stopRecognition();
    stopTimer();
    stopFaceAnalysis();
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: true
    });

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
  };

  const waitForVideoReady = () =>
    new Promise(resolve => {
      const check = () => {
        if (videoRef.current && videoRef.current.readyState >= 3) resolve();
        else setTimeout(check, 200);
      };
      check();
    });

  const createSession = async () => {
    const res = await api.post('/interview/sessions');
    const session = extractSession(res);
    sessionIdRef.current = session.sessionId;
    fetchNextQuestion(session.sessionId);
  };

  const fetchNextQuestion = async (sid) => {
    if (!sid) return;

    setLoading(true);

    try {
      const res = await api.post(`/interview/sessions/${sid}/questions`);

      if (res.data?.completed === true) {
        await handleCompletion(sid);
        return;
      }

      const q = res.data?.data || res.data;
      if (!q?.questionId) {
        await handleCompletion(sid);
        return;
      }

      stopRecognition();
      stopTimer();
      stopFaceAnalysis();
      resetFaceMetrics();

      setQuestion(q.question);
      setQuestionId(q.questionId);
      setTranscript('');
      submittingRef.current = false;

      startTimer();
      startRecognition();

      await waitForVideoReady();

      setTimeout(() => {
        startFaceAnalysis(videoRef.current);
      }, 500);

    } finally {
      setLoading(false);
    }
  };

  const handleCompletion = async (sid) => {
    stopRecognition();
    stopTimer();
    stopFaceAnalysis();
    stopCamera();

    setQuestion('');
    setQuestionId('');

    await pollFinalReport(sid);
    setCompleted(true);
  };

  const pollFinalReport = async (sid) => {
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    for (let i = 0; i < REPORT_POLL_MAX_TRIES; i++) {
      const res = await api.get(`/interview/sessions/${sid}`);
      const session = extractSession(res);
      const report = session?.finalReport;

      if (report && typeof report.overallScore === 'number') {
        setFinalReport(report);
        return;
      }

      await new Promise(r => setTimeout(r, REPORT_POLL_INTERVAL));
    }
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(QUESTION_TIME_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          submitAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
      }
      if (finalText) setTranscript(p => (p + finalText).trim());
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const submitAnswer = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const sid = sessionIdRef.current;
    if (!sid || !questionId) {
      submittingRef.current = false;
      return;
    }

    stopRecognition();
    stopTimer();

    const safeTranscript = transcript.trim() || '[NO ANSWER]';
    await new Promise(r => setTimeout(r, 800));

    let behaviorMetrics = {};
    try {
      behaviorMetrics = getFaceMetrics();
    } catch {}

    stopFaceAnalysis();

    try {
      await api.post(`/interview/sessions/${sid}/answers`, {
        questionId,
        transcript: safeTranscript,
        answerText: safeTranscript,
        durationSeconds: QUESTION_TIME_SECONDS,
        behaviorMetrics
      });
    } catch (err) {
      console.warn('Submission failed:', err.message);
    }

    submittingRef.current = false;
    fetchNextQuestion(sid);
  };

  /* ------------------ UI STATES ------------------ */

  if (!hasStarted) {
    return (
      <Paper sx={{ p: 4, height: '100%' }}>
        <Stack spacing={3}>
          <Typography variant="h5">Live Mock Interview</Typography>

          <Typography>
            This module simulates a real interview experience.
            You will be asked multiple questions.
            Your voice responses and facial expressions will be analyzed.
          </Typography>

          <Typography>
            Please ensure:
            • Camera permission is allowed  
            • Microphone is working  
            • Good lighting  
            • Quiet environment
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => setHasStarted(true)}
          >
            Start Interview
          </Button>
        </Stack>
      </Paper>
    );
  }

  if (completed) {
  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
        <LiveInterviewReport report={finalReport} />
        
      </Box>
    </Box>
  );
}


  return (
    <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Stack spacing={2}>
        <Button size="small" onClick={goToMain}>
  ← Back to Chat
</Button>

        <Typography variant="h6">Live Virtual Interview</Typography>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="640"
          height="480"
          style={{
            width: '100%',
            maxWidth: '640px',
            height: 'auto',
            aspectRatio: '4 / 3',
            objectFit: 'contain',
            backgroundColor: '#000',
            transform: 'scaleX(-1)'
          }}
        />

        {loading && <LinearProgress />}

        <Typography>Question: {question}</Typography>

        <Typography>
          Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </Typography>

        <Typography variant="caption">
          {listening ? 'Listening...' : 'Microphone idle'}
        </Typography>

        <Box sx={{ border: '1px solid #ccc', minHeight: 80, p: 1 }}>
          <Typography variant="caption">{transcript}</Typography>
        </Box>

        <Button variant="contained" onClick={submitAnswer} disabled={!questionId}>
          Submit Answer
        </Button>
      </Stack>
    </Paper>
  );
};

export default LiveInterviewBot;
