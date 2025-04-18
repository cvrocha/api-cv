import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'API rodando com OpenAI!' });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem ausente' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    });

    const reply = completion.choices[0].message.content;
    res.json({ status: 'success', reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar a mensagem' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
