const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateNfeData } = require('./pdfGenerator.tsx');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.text({ type: 'application/xml' }));

app.post('/generate-pdf', (req, res) => {
  try {
    const xmlContent = req.body;
    if (!xmlContent) {
      return res.status(400).send('Corpo da requisição está vazio.');
    }

    const nfeData = generateNfeData(xmlContent);

    if (nfeData) {
      res.json(nfeData);
    } else {
      res.status(500).send('Falha ao gerar os dados da NFe.');
    }
  } catch (error) {
    console.error("Erro na API de geração de dados da NFe:", error);
    res.status(500).send('Erro interno do servidor.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});