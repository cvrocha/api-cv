import express from 'express';
import cors from 'cors';
import axios from 'axios';

// Inicialização segura
const app = express();
const port = process.env.PORT || 3000;

// Configuração minimalista de CORS
app.use(cors());
app.use(express.json());

// Endpoint único e testado
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

// Rota health check simplificada
app.get('/health', (_, res) => {
  res.sendStatus(200);
});

// Única rota POST - versão ultra simplificada
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const response = await axios.post(DEEPSEEK_API, {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    res.json(response.data.choices[0].message);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Inicialização segura
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Test endpoint: POST http://localhost:${port}/chat`);
});