import { Paper, Stack, Typography, Box, Button, Alert, CircularProgress, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';
import { Visibility } from '@mui/icons-material';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pdf } from '@react-pdf/renderer';
import DanfeReactPDF from '@/components/DanfeReactPDF';

interface ConvertedFile {
  fileName: string;
  data: any;
  pdfBlob: Blob;
}

const generatePdf = async (nfeData: any) => {
  try {
    const blob = await pdf(<DanfeReactPDF data={nfeData} />).toBlob();
    return blob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

export default function XMLConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    if (fileRejections.length > 0) {
      setError(`Limite de 100 arquivos excedido ou tipo de arquivo inválido. Apenas arquivos .xml são permitidos.`);
      return;
    }
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 100));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'] },
    maxFiles: 100,
  });

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const handleConvert = async () => {
    setIsConverting(true);
    setError(null);
    setConvertedFiles([]);
    const processedFiles: ConvertedFile[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const xmlString = await file.text();
        const response = await fetch('http://localhost:3001/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
          },
          body: xmlString,
        });

        if (response.ok) {
          const nfeData = await response.json();
          const pdfBlob = await generatePdf(nfeData);
          if (pdfBlob) {
            processedFiles.push({ fileName: file.name, data: nfeData, pdfBlob });
          } else {
            errors.push(`Falha ao gerar o PDF para o arquivo: ${file.name}.`);
          }
        } else {
          const errorText = await response.text();
          errors.push(`Falha ao processar o arquivo: ${file.name}. ${errorText}`);
        }
      } catch (e: any) {
        errors.push(`Erro ao processar o arquivo ${file.name}: ${e.message}`);
        console.error("Error processing file:", file.name, e);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setConvertedFiles(processedFiles);
    setIsConverting(false);
  };

  const handlePreview = (pdfBlob: Blob) => {
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    convertedFiles.forEach(file => {
      zip.file(`${file.fileName.replace('.xml', '.pdf')}`, file.pdfBlob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'documentos.zip');
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" className="gradient-text">Conversor de XML (NFe/CTe) para PDF</Typography>
      <Paper sx={{ p: 2 }}>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed grey',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'transparent',
          }}
        >
          <input {...getInputProps()} />
          {
            isDragActive ?
              <Typography>Solte os arquivos aqui ...</Typography> :
              <Typography>Arraste e solte até 100 arquivos XML aqui, ou clique para selecionar.</Typography>
          }
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {files.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Arquivos Selecionados ({files.length}/100):</Typography>
            <Stack spacing={1} sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
              {files.map((file, i) => (
                <Paper key={i} sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{file.name}</Typography>
                  <Button size="small" onClick={() => handleRemoveFile(file)}>Remover</Button>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
        <Button variant="contained" sx={{ mt: 2 }} disabled={files.length === 0 || isConverting} onClick={handleConvert}>
          {isConverting ? <CircularProgress size={24} /> : "Converter para PDF"}
        </Button>

        {convertedFiles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Arquivos Convertidos:</Typography>
            <Button variant="outlined" sx={{ my: 2 }} onClick={handleDownloadAll}>
              Baixar Todos (ZIP)
            </Button>
            <List>
              {convertedFiles.map((file, i) => (
                <ListItem key={i} secondaryAction={
                  <IconButton edge="end" aria-label="preview" onClick={() => handlePreview(file.pdfBlob)}>
                    <Visibility />
                  </IconButton>
                }>
                  <ListItemText
                    primary={file.fileName}
                    secondary={`Emitente: ${file.data.emit.xNome} | Destinatário: ${file.data.dest.xNome}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}