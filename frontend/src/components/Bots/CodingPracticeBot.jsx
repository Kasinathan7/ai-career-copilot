// file: frontend/src/components/Bots/CodingPracticeBot.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import axios from 'axios';
import { useBotContext } from '../BotRouter';

const CodingPracticeBot = () => {
  const { goToMain } = useBotContext();

  const [problems, setProblems] = useState([]);
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadProblems = async () => {
    try {
      const res = await api.get('/coding/problems');

      console.log('CODING PROBLEMS RAW:', res.data);

      // ✅ Backend returns array directly
      if (!Array.isArray(res.data)) {
        throw new Error('Coding problems response is not an array');
      }

      const list = res.data;

      setProblems(list);

      if (list.length === 0) return;

      const first = list[0];

      setProblem(first);
      setLanguage('javascript');
      setCode(first.starterCode?.javascript || '// No starter code');
      setResult(null);
    } catch (err) {
      console.error('❌ Failed to load coding problems:', err);
    }
  };

  loadProblems();
}, []);




const selectProblem = (id) => {
  const p = problems.find((x) => x._id === id);
  if (!p) return;

  setProblem(p);
  setLanguage('javascript');
  setCode(p.starterCode?.javascript || '// No starter code');
  setResult(null);
};


  const runCode = async () => {
    setLoading(true);
    const res = await api.post('/coding/submit', {
      problemId: problem._id,
      language,
      code
    });
    if (res.data?.data) {
  setResult(res.data.data);
} else {
  setResult(res.data);
}

    setLoading(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
        <Button size="small" variant="outlined" onClick={goToMain}>
          ← Back to Chat
        </Button>
        <Typography variant="h6">Coding Practice</Typography>
      </Paper>

      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
       <Select
  fullWidth
  value={problem?._id ?? ''}
  displayEmpty
  onChange={(e) => selectProblem(e.target.value)}
>
  <MenuItem value="" disabled>
    Select a problem
  </MenuItem>

  {problems.map((p) => (
    <MenuItem key={p._id} value={p._id}>
      {p.title}
    </MenuItem>
  ))}
</Select>


        {problem && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography>{problem.description}</Typography>

            <Select
              size="small"
              sx={{ mt: 2 }}
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(problem.starterCode[e.target.value]);
              }}
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
            </Select>

            <TextField
              multiline
              minRows={10}
              fullWidth
              sx={{ mt: 2 }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <Button sx={{ mt: 2 }} variant="contained" onClick={runCode} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Run'}
            </Button>

            {result && (
              <Box sx={{ mt: 2 }}>
                <Typography>Total Tests: {result.totalTests}</Typography>
                <Typography>Passed: {result.passedTests}</Typography>
                <Typography>Failed: {result.failedTests}</Typography>
                <Typography>Passed All: {String(result.passedAll)}</Typography>

                {result.cases.map((c, idx) => (
                  <Box key={idx} sx={{ mt: 1, p: 1, border: '1px solid #ccc' }}>
                    <Typography variant="caption">
                      Input: {c.input} | Expected: {c.expected} | Actual: {String(c.actual)} | Passed: {String(c.passed)}
                    </Typography>
                    {c.error && <pre>{c.error}</pre>}
                  </Box>
                ))}

                {result.runtimeError && <pre>{result.runtimeError}</pre>}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CodingPracticeBot;
