import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Nova rota de debug
app.get('/debug', (req, res) => {
  res.json({
    status: 'online',
    deepseek_status: 'Usando API pública (sem token)',
    timestamp: new Date().toISOString()
  });
});

// Rota POST atualizada
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 segundos
      }
    );

    res.json({ 
      reply: response.data.choices[0].message.content,
      usage: response.data.usage
    });
  } catch (error) {
    console.error('DeepSeek Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'API Error',
      details: error.response?.data || error.message,
      tip: 'Tente novamente em alguns minutos ou verifique os logs'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('DeepSeek integration (public API)');
});