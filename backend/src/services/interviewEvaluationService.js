import groqAIService from './groqAIService.js';

function normalizeScore(v) {
  if (v <= 1) return v * 100;
  if (v <= 10) return v * 10;
  return v;
}
export async function evaluateAnswer({ question, answer, behaviorMetrics }) {
  const faceInfo = behaviorMetrics
    ? `\nFacial behavior:\n${JSON.stringify(behaviorMetrics, null, 2)}`
    : '';

  const messages = [
    {
      role: 'system',
      content: `You are an interview performance evaluator.

Evaluate ONLY how well the candidate answered this question in this interview.

Focus on:
- clarity of the answer
- relevance to the question
- level of detail
- structure
- communication quality

DO NOT evaluate the person's personality, character, or long-term abilities.

Return ONLY valid JSON.

JSON schema:
{
  "score": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[],
  "communicationRating": number,
  "confidenceRating": number
}`
    },
    {
      role: 'user',
      content: `Question:\n${question}\n\nAnswer:\n${answer}\n${faceInfo}`
    }
  ];

  try {
    const result = await groqAIService.generateCompletion(messages, {
      temperature: 0.3,
      maxTokens: 500
    });

    const raw = result.content;
    console.log("GROQ RAW:", raw);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      parsed = JSON.parse(match[0]);
    }

    return parsed;

  } catch (err) {
    console.error("AI evaluation failed:", err.message);

    return {
      score: 50,
      strengths: [],
      weaknesses: ["AI evaluation failed"],
      suggestions: ["Try answering more clearly"],
      communicationRating: 5,
      confidenceRating: 5
    };
  }
}

export async function generateFinalReport(answers = []) {

  const hasSpeech = answers.some(a => a.transcript && a.transcript !== '[NO ANSWER]');
  const avgAnswerLength =
    answers.reduce((s, a) => s + (a.transcript?.length || 0), 0) / answers.length;

  const shortAnswerPenalty = avgAnswerLength < 40 ? 3 : 0;

  const aggregatedMetrics = {};
  let frames = 0;

  for (const a of answers) {
    if (typeof a.behaviorMetrics?.confidence === 'number') {
      for (const [k, v] of Object.entries(a.behaviorMetrics)) {
        if (typeof v === 'number' && !isNaN(v)) {
          aggregatedMetrics[k] = (aggregatedMetrics[k] || 0) + v;
        }
      }
      frames++;
    }
  }

  if (frames > 0) {
    for (const k of Object.keys(aggregatedMetrics)) {
      aggregatedMetrics[k] /= frames;
    }
  }

  const clamp10 = v => Math.min(10, Math.max(0, Math.round(v * 10)));

 const faceConfidenceScore = clamp10(
  (aggregatedMetrics.eyeContact || 0) * 5 +
  (aggregatedMetrics.neutral || 0) * 3 +
  (aggregatedMetrics.happy || 0) * 2
);


  // ✅ FIXED nervousness formula
  let nervousnessControl = clamp10(
  10 -
  (
    (aggregatedMetrics.nervous || 0) * 5 +
    (aggregatedMetrics.surprised || 0) * 3 +
    (aggregatedMetrics.sad || 0) * 2 +
    (aggregatedMetrics.angry || 0) * 2
  )
);
nervousnessControl = Math.min(10, Math.max(3, nervousnessControl));


  if (nervousnessControl !== null) {
    nervousnessControl = Math.min(10, Math.max(3, nervousnessControl));
  }

  const facialScores = {
  faceConfidence: faceConfidenceScore,
  eyeContact: clamp10(aggregatedMetrics.eyeContact || 0),
  nervousnessControl,
  neutralStability: clamp10(aggregatedMetrics.neutral || 0)
};


  if (facialScores.faceConfidence !== null &&
      facialScores.neutralStability >= 8 &&
      facialScores.faceConfidence > 3) {
    facialScores.faceConfidence -= 2;
  }

  const facialAnalysis = {
    eyeContact: facialScores.eyeContact >= 8
      ? "Maintained strong and consistent eye contact."
      : "Eye contact could be improved.",

    confidence: facialScores.faceConfidence >= 8
      ? "Displayed strong facial confidence."
      : "Facial confidence was moderate.",

    nervousness: facialScores.nervousnessControl >= 7
      ? "Very low signs of nervousness."
      : "Some nervousness detected.",

    expressions: facialScores.neutralStability >= 7
      ? "Mostly calm and neutral expressions."
      : "Expressions fluctuated noticeably."
  };

  const validAI = answers
    .map(a => a.aiEvaluation)
    .filter(e =>
      e &&
      typeof e.score === 'number' &&
      !e.weaknesses?.includes("AI evaluation failed")
    );

  let report;

  if (validAI.length > 0) {

    const avgRaw = (key) =>
      validAI.reduce((s, a) => s + normalizeScore(Number(a[key]) || 0), 0) / validAI.length;

    const aiScore = avgRaw('score');
    const aiComm = avgRaw('communicationRating');
    const aiConf = avgRaw('confidenceRating');

    const faceConfidence = Math.max(0, (facialScores.faceConfidence || 0) - shortAnswerPenalty);
    const eyeContact = Math.max(0, facialScores.eyeContact - shortAnswerPenalty);

    const hasFace = frames > 5;

    const finalScore =
      (aiScore * 0.7) +
      (hasFace ? faceConfidence * 2 : 0) +
      (hasFace ? eyeContact : 0);

    report = {
      overallScore: Math.round(hasSpeech ? finalScore : aiScore * 0.2),
      communicationRating: Math.round(
        hasSpeech && avgAnswerLength > 40 ? aiComm / 10 : Math.min(3, aiComm / 20)
      ),
      confidenceRating: Math.round(
        hasFace ? Math.max(aiConf / 10, faceConfidence) : aiConf / 10
      ),
      strengths: unique(validAI.flatMap(a => a.strengths || [])),
      weaknesses: unique(validAI.flatMap(a => a.weaknesses || [])),
      suggestions: unique(validAI.flatMap(a => a.suggestions || []))
    };

  } else {
    report = {
      overallScore: 0,
      communicationRating: 0,
      confidenceRating: 0,
      strengths: [],
      weaknesses: ["No valid answers"],
      suggestions: ["Please answer the questions verbally"]
    };
  }

  const answerEvaluation = {
    clarity: report.communicationRating >= 7 ? "Clear" :
             report.communicationRating >= 4 ? "Moderate" : "Poor",

    relevance: report.overallScore >= 60 ? "Relevant" :
               report.overallScore >= 40 ? "Partial" : "Low",

    detailLevel: report.overallScore >= 65 ? "Detailed" :
                 report.overallScore >= 40 ? "Basic" : "Insufficient",

    structure: report.communicationRating >= 7 ? "Well structured" :
               report.communicationRating >= 4 ? "Some structure" : "Unstructured"
  };

  return {
    ...report,
    facialScores,
    facialAnalysis,
    behaviorMetrics: aggregatedMetrics,
    answerEvaluation
  };
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}
