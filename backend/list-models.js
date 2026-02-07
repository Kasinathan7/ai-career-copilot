import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('🔍 Fetching available Gemini models...\n');
    
    // Try to list models
    const models = await genAI.listModels();
    
    console.log('✅ Available models:');
    for await (const model of models) {
      console.log(`\n📦 Model: ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.log('\n💡 Trying common model names...');
    
    // Try common model names
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log(`✅ ${modelName} - WORKS! Response: ${response.text().substring(0, 50)}...`);
        break;
      } catch (err) {
        console.log(`❌ ${modelName} - Failed: ${err.message.substring(0, 80)}`);
      }
    }
  }
}

listModels();
