import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API rodando 🚀');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
