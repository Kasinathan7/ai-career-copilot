import React from 'react';
import { Box, Typography, Paper, Divider, Stack, Button } from '@mui/material';
import { useBotContext } from '../BotRouter';
const ScoreRow = ({ label, value }) => (
  <Typography>
    {label}: {typeof value === 'number' ? value : 0}/10
  </Typography>
);

const BulletList = ({ items, emptyText = "None" }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <Typography>{emptyText}</Typography>;
  }

  return items.map((item, i) => (
    <Typography key={i}>• {item}</Typography>
  ));
};

const LiveInterviewReport = ({ report, onBack }) => {
    const { goToMain } = useBotContext();
  if (!report) return null;

  const {
    overallScore = 0,
    communicationRating = 0,
    confidenceRating = 0,
    strengths = [],
    weaknesses = [],
    suggestions = [],
    facialScores = null,
    facialAnalysis = null,
    answerEvaluation = null
  } = report;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>

        <Typography variant="h5">Interview Performance Report</Typography>
        <Divider />

        <Typography>Overall Score</Typography>
        <Typography variant="h6">{overallScore}/100</Typography>

        <Typography>Communication Rating</Typography>
        <Typography variant="h6">{communicationRating}/10</Typography>

        <Typography>Confidence Rating</Typography>
        <Typography variant="h6">{confidenceRating}/10</Typography>

        {facialScores && (
          <>
            <Divider />
            <Typography variant="h6">Facial Performance Scores</Typography>

            <ScoreRow label="Face Confidence" value={facialScores.faceConfidence} />
            <ScoreRow label="Eye Contact" value={facialScores.eyeContact} />
            <ScoreRow label="Nervousness Control" value={facialScores.nervousnessControl} />
            <ScoreRow label="Neutral Expression Stability" value={facialScores.neutralStability} />
          </>
        )}

        {facialAnalysis && (
          <>
            <Divider />
            <Typography variant="h6">Facial Behavior Analysis</Typography>
            <Typography>Eye Contact: {facialAnalysis.eyeContact || "N/A"}</Typography>
            <Typography>Confidence: {facialAnalysis.confidence || "N/A"}</Typography>
            <Typography>Expressions: {facialAnalysis.expressions || "N/A"}</Typography>
          </>
        )}

        {answerEvaluation && (
          <>
            <Divider />
            <Typography variant="h6">Answer Quality Evaluation</Typography>
            <Typography>Clarity: {answerEvaluation.clarity || "N/A"}</Typography>
            <Typography>Relevance: {answerEvaluation.relevance || "N/A"}</Typography>
            <Typography>Detail Level: {answerEvaluation.detailLevel || "N/A"}</Typography>
            <Typography>Structure: {answerEvaluation.structure || "N/A"}</Typography>
          </>
        )}

        <Divider />

        <Typography variant="h6">Strengths</Typography>
        <BulletList items={strengths} />

        <Typography variant="h6">Weaknesses</Typography>
        <BulletList items={weaknesses} />

        <Typography variant="h6">Suggestions</Typography>
        <BulletList items={suggestions} />

        <Divider />

        <Button
          variant="outlined"
          onClick={goToMain}
        >
          Back to Chat
        </Button>

      </Stack>
    </Paper>
  );
};

export default LiveInterviewReport;
