import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de status
app.get('/', (req, res) => {
  res.json({
    message: 'API rodando com DeepSeek!',
    status: 'online',
    provider: 'DeepSeek (gratuito)'
  });
});

// Rota de chat com DeepSeek
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem ausente.' });
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Não precisa de Authorization header (gratuito)
        }
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Erro no DeepSeek:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Erro ao processar sua mensagem',
      details: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log('DeepSeek configurado (gratuito, sem token)');
});