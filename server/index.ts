const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
import { generateNfeData } from './pdfGenerator';
import { DistribuicaoDFe } from 'node-mde';
import fs from 'fs';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'application/xml' }));

app.post('/api/nfe-data', async (req, res) => {
  const { accessKeys } = req.body;

  if (!accessKeys || !Array.isArray(accessKeys)) {
    return res.status(400).json({ error: 'Nenhuma chave de acesso fornecida.' });
  }

  try {
    // TODO: Substitua com o caminho real para o seu certificado .pfx e a senha
    const pfx = fs.readFileSync('./caminho/para/seu/certificado.pfx');
    const passphrase = 'sua_senha';

    const distribuicao = new DistribuicaoDFe({
      pfx,
      passphrase,
      cnpj: 'SEU_CNPJ_AQUI', // TODO: Substitua pelo CNPJ do titular do certificado
      cUFAutor: '41', // TODO: Ajuste para a UF correta
      tpAmb: '2', // 1 para Produção, 2 para Homologação
    });

    const nfeDataPromises = accessKeys.map(async (key) => {
      const consulta = await distribuicao.consultaChNFe(key);

      if (consulta.error) {
        console.error(`Erro ao consultar a chave ${key}:`, consulta.error);
        return null;
      }

      if (consulta.data?.docZip?.[0]?.xml) {
        const xml = consulta.data.docZip[0].xml;
        const nfeData = await generateNfeData(xml);
        return nfeData;
      }

      return null;
    });

    const results = (await Promise.all(nfeDataPromises)).filter(Boolean);
    res.json(results);
  } catch (error) {
    console.error('Erro ao processar as chaves de acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/generate-pdf', async (req, res) => {
  try {
    const xmlContent = req.body;
    if (!xmlContent) {
      return res.status(400).send('Corpo da requisição está vazio.');
    }

    const nfeData = await generateNfeData(xmlContent);

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