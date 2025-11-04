import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useConfig } from '../context/ConfigContext'
import { downloadIBPTCsv } from '../services/download'

export default function IBPTax() {
  const { config } = useConfig()
  const handleDownload = async () => {
    await downloadIBPTCsv(config.ibptCsvUrl, 'TabelaIBPTaxBA15.1.B')
    await downloadIBPTCsv(config.ibptCsvUrl, 'TabelaIBPTax15.1.B')
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h5" className="gradient-text">Tabela IBPTax</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" onClick={handleDownload}>Baixar CSVs IBPT (2 arquivos)</Button>
        </Stack>
      </Paper>
      <Alert severity="info">Mantemos a extensão original do arquivo, renomeando apenas a descrição.</Alert>
    </Stack>
  )
}