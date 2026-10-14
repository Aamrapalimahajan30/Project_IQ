const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODELS_FALLBACK_SEQUENCE = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-pro-latest'
];

const safeJsonParse = (text) => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    throw new Error('Malformed AI response. Failed to parse valid JSON payload.');
  }
};

/**
 * Executes a prompt using user preferences with fallback support across multiple Gemini models.
 * Handles timeouts, rate limits (429), and service outages (503).
 */
const generateContentWithFallback = async (prompt, userSettings = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  }

  const preferredModel = userSettings.aiModel || 'gemini-3.5-flash-lite';
  const temperature = typeof userSettings.aiTemperature === 'number' ? userSettings.aiTemperature : 0.2;

  // Rearrange sequence to try preferred model first
  const modelsToTry = [
    preferredModel,
    ...MODELS_FALLBACK_SEQUENCE.filter(m => m !== preferredModel)
  ];

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of modelsToTry) {
    // 3 attempts per model (1 initial + 2 retries) with a 2-second delay
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AI-Service] Calling ${modelName} (Attempt ${attempt}/3)...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (!responseText) {
          throw new Error('Received empty response from Gemini API.');
        }

        const switched = modelName !== preferredModel;
        return {
          text: responseText,
          usedModel: modelName,
          switched
        };
      } catch (err) {
        lastError = err;
        console.warn(
          `[AI-Service] Model ${modelName} Attempt ${attempt} failed: ${err.message}`
        );

        if (attempt < 3) {
          console.log(`[AI-Service] Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    console.warn(`[AI-Service] Model ${modelName} failed all attempts. Swapping to next fallback...`);
  }

  console.error('[AI-Service] All fallback models failed. Final error details:', lastError);
  throw new Error('The AI analysis service is temporarily unavailable or experiencing high demand. Please try again shortly.');
};

/**
 * Runs fallback content generation and validates JSON schema output.
 */
const generateJSONContentWithFallback = async (prompt, userSettings = {}) => {
  const result = await generateContentWithFallback(prompt, userSettings);
  try {
    const parsed = safeJsonParse(result.text);
    return {
      data: parsed,
      usedModel: result.usedModel,
      switched: result.switched
    };
  } catch (err) {
    // If JSON parsing failed, try once more with a clearer instruction to output JSON
    console.warn(`[AI-Service] JSON parsing failed. Retrying prompt with strict formatting...`);
    const retryPrompt = `${prompt}\n\nSTRICT JSON DIRECTIVE: You MUST return a valid JSON payload matching the requested format. Avoid markdown formatting blocks.`;
    const secondResult = await generateContentWithFallback(retryPrompt, userSettings);
    const parsed = safeJsonParse(secondResult.text);
    return {
      data: parsed,
      usedModel: secondResult.usedModel,
      switched: secondResult.switched
    };
  }
};

module.exports = {
  generateContentWithFallback,
  generateJSONContentWithFallback,
  safeJsonParse
};
