import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// Use a porta do Railway ou 8080 como fallback
const port = process.env.PORT || 8080;

// Configuração mínima necessária
app.use(cors());
app.use(express.json());

// Rota GET básica para teste
app.get('/', (_, res) => {
  res.json({
    status: 'online',
    message: 'API funcionando',
    endpoints: {
      POST: '/chat'
    }
  });
});

// Rota POST principal
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      }
    );

    res.json(response.data.choices[0].message);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Inicie o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`URL para teste: https://[SEU-APP].up.railway.app/chat`);
});