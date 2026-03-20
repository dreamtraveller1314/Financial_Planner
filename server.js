require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(cors());

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error("ERROR: No API Key found! Check Render Environment Variables.");
}

const groq = new Groq({ apiKey });

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a financial advisor. Reply ONLY with raw JSON." },
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile", 
      response_format: { type: "json_object" } 
    });

    res.json({ reply: chatCompletion.choices[0].message.content });

  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ error: "Failed to connect to Groq" });
  }
});

app.listen(3000, () => console.log('running on http://localhost:3000'));