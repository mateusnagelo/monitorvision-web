import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Chip, Grid, LinearProgress, Paper, Stack, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import DownloadDoneIcon from '@mui/icons-material/DownloadDone'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import BugReportIcon from '@mui/icons-material/BugReport'
import AssessmentIcon from '@mui/icons-material/Assessment'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FactCheckIcon from '@mui/icons-material/FactCheck'

export default function Dashboard() {
  const navigate = useNavigate()
  const [downloads, setDownloads] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [validations, setValidations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem('monitorVision.downloads') || '[]')
      const l = JSON.parse(localStorage.getItem('monitorVision.logs') || '[]')
      const v = JSON.parse(localStorage.getItem('monitorVision.xmlValidations') || '[]')
      setDownloads(Array.isArray(d) ? d : [])
      setLogs(Array.isArray(l) ? l : [])
      setValidations(Array.isArray(v) ? v : [])
    } catch {
      setDownloads([])
      setLogs([])
      setValidations([])
    } finally {
      setLoading(false)
    }
  }, [])

  const metrics = useMemo(() => {
    const totalDownloads = downloads.length
    const successfulDownloads = downloads.filter(d => d.success).length
    const failedDownloads = totalDownloads - successfulDownloads
    const lastDownload = downloads[downloads.length - 1] || null

    const totalQueries = logs.length
    const successfulQueries = logs.filter(l => l.success).length
    const failedQueries = totalQueries - successfulQueries
    const lastQuery = logs[logs.length - 1] || null

    const totalValidations = validations.length
    const successfulValidations = validations.filter(v => v.success).length
    const failedValidations = totalValidations - successfulValidations
    const lastValidation = validations[validations.length - 1] || null

    return {
      totalDownloads,
      successfulDownloads,
      failedDownloads,
      lastDownload,
      totalQueries,
      successfulQueries,
      failedQueries,
      lastQuery,
      totalValidations,
      successfulValidations,
      failedValidations,
      lastValidation,
    }
  }, [downloads, logs, validations])

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Downloads: {metrics.totalDownloads} · Consultas: {metrics.totalQueries} · Validações: {metrics.totalValidations}
          </Typography>
        </Stack>
      </Paper>

      {loading ? (
        <Typography variant="body2" color="text.secondary">Carregando…</Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={700}>Downloads IBPT</Typography>
              <Typography variant="body2">Total: {metrics.totalDownloads}</Typography>
              <Typography variant="body2">Sucesso: {metrics.successfulDownloads}</Typography>
              <Typography variant="body2">Falha: {metrics.failedDownloads}</Typography>
              <Typography variant="body2" color="text.secondary">Último: {metrics.lastDownload ? `${metrics.lastDownload?.filename ?? 'arquivo.csv'} (${new Date(metrics.lastDownload.timestamp).toLocaleString()})` : '—'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => navigate('/ibptax')}>IBPTax</Button>
                <Button size="small" variant="outlined" onClick={() => navigate('/ibptax')}>Repetir</Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={700}>Consultas CNPJ</Typography>
              <Typography variant="body2">Total: {metrics.totalQueries}</Typography>
              <Typography variant="body2">Sucesso: {metrics.successfulQueries}</Typography>
              <Typography variant="body2">Falha: {metrics.failedQueries}</Typography>
              <Typography variant="body2" color="text.secondary">Última: {metrics.lastQuery ? `${metrics.lastQuery.cnpj} (${new Date(metrics.lastQuery.timestamp).toLocaleString()})` : '—'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => navigate('/clientes')}>Clientes</Button>
                <Button size="small" variant="outlined" onClick={() => navigate('/cnpj')}>Nova consulta</Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={700}>Validações XML</Typography>
              <Typography variant="body2">Total: {metrics.totalValidations}</Typography>
              <Typography variant="body2">Sucesso: {metrics.successfulValidations}</Typography>
              <Typography variant="body2">Falha: {metrics.failedValidations}</Typography>
              <Typography variant="body2" color="text.secondary">Última: {metrics.lastValidation ? `${metrics.lastValidation?.filename ?? 'XML'} (${new Date(metrics.lastValidation.timestamp).toLocaleString()})` : '—'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => window.open('https://www.sefaz.rs.gov.br/nfe/nfe-val.aspx', '_blank')}>Sefaz RS</Button>
                <Button size="small" variant="outlined" onClick={() => navigate('/xml')}>Validar XML</Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Stack>
  )
}