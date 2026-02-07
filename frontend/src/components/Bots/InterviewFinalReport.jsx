// file: frontend/src/components/Bots/InterviewFinalReport.jsx

import React from 'react';
import { Paper, Typography, Stack, Divider } from '@mui/material';

const InterviewFinalReport = ({ report }) => {
  if (!report) return null;

  return (
    <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Interview Report
      </Typography>

      <Stack spacing={1}>
        <Typography><b>Overall Score:</b> {report.overallScore}</Typography>
        <Typography><b>Communication:</b> {report.communicationRating}/10</Typography>
        <Typography><b>Confidence:</b> {report.confidenceRating}/10</Typography>

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle1"><b>Strengths</b></Typography>
        {report.strengths?.length ? (
          <ul>
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2">No major strengths identified.</Typography>
        )}

        <Typography variant="subtitle1"><b>Weaknesses</b></Typography>
        {report.weaknesses?.length ? (
          <ul>
            {report.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2">No major weaknesses identified.</Typography>
        )}

        <Typography variant="subtitle1"><b>Suggestions</b></Typography>
        {report.suggestions?.length ? (
          <ul>
            {report.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2">No suggestions available.</Typography>
        )}

        <Divider sx={{ my: 1 }} />

        <Typography variant="caption" color="text.secondary">
          AI Model: {report.aiModel}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Generated at: {new Date(report.generatedAt).toLocaleString()}
        </Typography>
      </Stack>
    </Paper>
  );
};

export default InterviewFinalReport;
