import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // 🔐 Carrega variáveis do .env

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://claude.site'
}));
app.use(express.json());

// 🔗 Teste da API
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API rodando com OpenAI!'
  });
});

// 🤖 Chat com OpenAI
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem ausente' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Você é um assistente útil.' },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices[0].message.content;

    res.json({
      status: 'success',
      reply
    });

  } catch (error) {
    console.error('Erro ao consultar OpenAI:', error);
    res.status(500).json({ error: 'Erro ao acessar a IA' });
  }
});

// ❌ Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não existe' });
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
