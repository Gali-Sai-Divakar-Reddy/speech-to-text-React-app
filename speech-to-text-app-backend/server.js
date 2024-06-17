import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createClient } from "@deepgram/sdk";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Initialize Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Route to handle LLM request
app.post('/api/llm', async (req, res) => {
  const { text } = req.body;

  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama3-8b-8192" // Use the appropriate model name
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    ["human", text]
  ]);

  const chain = prompt.pipe(model);

  try {
    const response = await chain.invoke({ input: text });
    res.json({ response: response.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch response from LLM' });
  }
});


// Route to handle TTS request
app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
  
    try {
      const response = await deepgram.speak.request(
        { text },
        {
          model: "aura-asteria-en",
          encoding: "linear16",
          container: "wav",
        }
      );
  
      const stream = await response.getStream();
      const headers = await response.getHeaders();
  
      if (stream) {
        const buffer = await getAudioBuffer(stream);
        res.set({
          'Content-Type': 'audio/wav',
          ...headers,
        });
        res.send(buffer);
      } else {
        res.status(500).json({ error: 'Error generating audio' });
      }
    } catch (error) {
      console.error("Deepgram API request failed:", error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to fetch audio from TTS service' });
    }
  });
  
  // Helper function to convert stream to audio buffer
  const getAudioBuffer = async (response) => {
    const reader = response.getReader();
    const chunks = [];
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      chunks.push(value);
    }
  
    const dataArray = chunks.reduce(
      (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
      new Uint8Array(0)
    );
  
    return Buffer.from(dataArray.buffer);
  };
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
