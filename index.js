import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
const port = process.env.PORT || 3000;

// 🔐 Garante que a variável está definida
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('A variável OPENAI_API_KEY não foi definida. Configure no Railway ou arquivo .env.');
}

const openai = new OpenAI({ apiKey });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API rodando com OpenAI!' });
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
    res.json({ reply });
  } catch (error) {
    console.error('Erro ao chamar a OpenAI:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
