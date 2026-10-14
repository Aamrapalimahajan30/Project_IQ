require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function list() {
  const apiKey = process.env.GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key not found.");
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Since SDK v0.16.0 might not have a direct listModels, let's use listModels if available
    // or call the REST endpoint via fetch using the key
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("AVAILABLE MODELS LIST:");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

list();
