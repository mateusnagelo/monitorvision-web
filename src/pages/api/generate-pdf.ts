import { generatePdf } from '../../services/pdfGenerator';

export const POST = async ({ request }) => {
  try {
    const xmlContent = await request.text();
    if (!xmlContent) {
      return new Response('Corpo da requisição está vazio.', { status: 400 });
    }

    const pdfBlob = await generatePdf(xmlContent);

    if (pdfBlob) {
      return new Response(pdfBlob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
    } else {
      return new Response('Falha ao gerar o PDF.', { status: 500 });
    }
  } catch (error) {
    console.error("Erro na API de geração de PDF:", error);
    return new Response('Erro interno do servidor.', { status: 500 });
  }
};