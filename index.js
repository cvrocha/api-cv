import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import 'dotenv/config'; // Carrega .env antes de qualquer coisa

dotenv.config();

// ↓↓↓ Mantenha APENAS ESTA declaração do openai ↓↓↓
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verifique se a chave existe
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY não encontrada no ambiente!");
  process.exit(1); // Encerra o servidor se não houver chave
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rota GET (existente)
app.get('/', (req, res) => {
  res.send('API rodando 🚀');
});

// Nova rota POST para o chat
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Messages are required!' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    res.json(response.choices[0].message);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});