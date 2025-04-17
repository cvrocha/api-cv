import express from 'express';
import dotenv from 'dotenv';

dotenv.config(); // <- Isso carrega as variáveis do .env

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post('/mensagem', (req, res) => {
  const { nome, mensagem } = req.body;

  // Aqui você pode usar a OPENAI_KEY com fetch ou axios pra mandar a msg pra API
  console.log(`Chave da API: ${OPENAI_KEY}`); // só teste

  res.json({ resposta: `Mensagem recebida de ${nome}: "${mensagem}"` });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
