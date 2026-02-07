// File: src/services/groqService.js
import axios from 'axios';

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
    console.log('✅ Groq Service initialized');
    console.log(`   🤖 Default model: ${this.model}`);
  }

  /**
   * Send chat messages to Groq API and get a response
   * @param {Array} messages - [{role: 'user'|'system', content: '...'}]
   * @param {Object} options - {temperature, max_tokens, model, ...}
   * @returns {String} content - AI response text
   */
  async chat(messages, options = {}) {
    try {
      const payload = {
        model: options.model || this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        ...options
      };

      const response = await axios.post(this.baseURL, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (err) {
      console.error('❌ Groq chat error:', err.response?.data || err.message);
      throw err;
    }
  }

  // ================================
  // ✅ ADDED FOR LIVE INTERVIEW MODULE
  // ================================
  /**
   * Evaluate interview answers and return structured report
   * Used by interviewSessionController.finalizeSession()
   */
  async evaluateInterview(answers = []) {
    const transcriptBlock = answers
      .map((a, i) => `Q${i + 1}: ${a.answerText || a.transcript || ''}`)
      .join('\n');

    const prompt = `
You are an interview evaluator.

Analyze the candidate answers and return STRICT JSON in this format:

{
  "score": number (0-100),
  "communicationRating": number (0-10),
  "confidenceRating": number (0-10),
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}

Answers:
${transcriptBlock}
`;

    const content = await this.chat(
      [
        { role: 'system', content: 'You are a JSON-only API. Do not add explanations.' },
        { role: 'user', content: prompt }
      ],
      { temperature: 0.2 }
    );

    try {
      return JSON.parse(content);
    } catch (err) {
      console.error('❌ Failed to parse Groq JSON:', content);

      // Safe fallback
      return {
        score: 50,
        communicationRating: 5,
        confidenceRating: 5,
        strengths: ['Unable to parse AI response'],
        weaknesses: ['AI response format error'],
        suggestions: ['Retry the interview']
      };
    }
  }
}

// Export a singleton instance
export default new GroqService();
