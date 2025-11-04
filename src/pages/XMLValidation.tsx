import { useState } from 'react'
import { Paper, Stack, Typography, Button, Snackbar, Alert } from '@mui/material'

export default function XMLValidation() {
  const sefazUrl = 'https://www.sefaz.rs.gov.br/nfe/nfe-val.aspx'
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' })

  const appendXmlValidationEvent = (evt: { timestamp: number; filename?: string; size?: number; success: boolean; message?: string }) => {
    try {
      const key = 'monitorVision.xmlValidations'
      const raw = localStorage.getItem(key)
      const list = raw ? JSON.parse(raw) : []
      const next = Array.isArray(list) ? [...list, evt] : [evt]
      localStorage.setItem(key, JSON.stringify(next))
    } catch (e) {
      // fail silently
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
  }

  const handleOpenValidator = async () => {
    if (selectedFile) {
      try {
        const xmlText = await selectedFile.text()
        // Tenta copiar o conteúdo do XML para a área de transferência para facilitar a colagem no validador
        await navigator.clipboard.writeText(xmlText)
        setSnack({ open: true, message: 'XML copiado para a área de transferência. Cole no campo do validador da Sefaz RS.', severity: 'success' })
        appendXmlValidationEvent({ timestamp: Date.now(), filename: selectedFile.name, size: selectedFile.size, success: true, message: 'Conteúdo copiado para clipboard e validador aberto.' })
      } catch (err) {
        setSnack({ open: true, message: 'Não foi possível copiar automaticamente. O validador será aberto para você colar manualmente.', severity: 'error' })
        appendXmlValidationEvent({ timestamp: Date.now(), filename: selectedFile.name, size: selectedFile.size, success: false, message: 'Falha ao copiar para clipboard; validador aberto.' })
      }
    } else {
      appendXmlValidationEvent({ timestamp: Date.now(), success: false, message: 'Nenhum arquivo selecionado; validador aberto.' })
    }
    window.open(sefazUrl, '_blank', 'noopener')
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Validação XML</Typography>
          <Typography variant="body2">Selecione um arquivo XML e clique para abrir o validador oficial. Se possível, o conteúdo será copiado para facilitar a colagem.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <input type="file" accept=".xml" multiple={false} onChange={handleFileChange} />
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenValidator}
            >
              Abrir validador da Sefaz RS
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}