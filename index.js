const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/analisar-curriculo", async (req, res) => {
  try {
    const { texto } = req.body;

    const prompt = `Analise o currículo abaixo com base em regras de ATS (Applicant Tracking System). Aponte erros, pontuação ATS (0 a 100), e sugestões de melhoria:
    
    Currículo:
    ${texto}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({
      resposta: completion.data.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao processar a solicitação.");
  }
});

app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
