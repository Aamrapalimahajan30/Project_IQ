require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in .env file.");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // List of models to test
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-pro'
  ];

  for (const modelName of models) {
    console.log(`Testing model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello!");
      console.log(`SUCCESS [${modelName}]:`, result.response.text().trim());
      console.log(`Use this model name: '${modelName}'`);
      break; // Exit loop on first success!
    } catch (err) {
      console.log(`FAILED [${modelName}]:`, err.message);
    }
  }
}

test();
