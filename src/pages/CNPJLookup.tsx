import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography, InputAdornment, CircularProgress, Snackbar, Divider } from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'
import { useConfig } from '../context/ConfigContext'
import { fetchCNPJ } from '../services/cnpj'

function formatCNPJ(input: string) {
  // Remove tudo que não é dígito e limita a 14 dígitos
  const digits = input.replace(/\D/g, '').slice(0, 14)
  return digits
}

function maskCNPJ(input: any) {
  const digits = String(input ?? '').replace(/\D/g, '').slice(0, 14)
  if (digits.length !== 14) return digits
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`
}

function buildPdfFilename(data: any, digits: string) {
  const nome = (data?.nome || data?.razao_social || data?.name || '').trim()
  const safeNome = nome ? nome.replace(/[^a-zA-Z0-9_\- ]/g, '').slice(0, 40).replace(/\s+/g, '_') : 'consulta'
  return `ConsultaCNPJ_${maskCNPJ(digits)}_${safeNome}.pdf`
}

function extractFields(raw: any) {
  const est = raw?.estabelecimento ?? {}

  const naturezaRaw = raw?.natureza_juridica
  const natureza =
    typeof naturezaRaw === 'string'
      ? naturezaRaw
      : naturezaRaw?.descricao ?? naturezaRaw?.nome ?? ''

  const atividade = est?.atividade_principal
  const cnae =
    typeof atividade === 'string'
      ? atividade
      : atividade?.descricao ?? atividade?.id ?? (raw?.cnae_fiscal ?? raw?.cnae_principal ?? raw?.cnae ?? '')

  const situacaoRaw = est?.situacao_cadastral
  const situacao =
    typeof situacaoRaw === 'string' ? situacaoRaw : (situacaoRaw?.descricao ?? raw?.situacao ?? raw?.status ?? '')

  const cidadeRaw = est?.cidade
  const municipio =
    typeof cidadeRaw === 'string' ? cidadeRaw : (cidadeRaw?.nome ?? raw?.municipio ?? raw?.cidade ?? raw?.city ?? '')

  const estadoRaw = est?.estado
  const uf = typeof estadoRaw === 'string' ? estadoRaw : (estadoRaw?.sigla ?? est?.uf ?? raw?.uf ?? raw?.estado ?? raw?.state ?? '')

  // Novos campos solicitados
  const dataSituacaoRaw = est?.data_situacao_cadastral ?? raw?.data_situacao ?? raw?.situacao_data ?? ''
  const dataSituacaoCadastral =
    typeof dataSituacaoRaw === 'string' ? dataSituacaoRaw : (dataSituacaoRaw?.data ?? dataSituacaoRaw?.date ?? '')

  const simplesRaw = raw?.simples ?? est?.simples
  const simplesStatus = typeof simplesRaw === 'string' ? simplesRaw : (simplesRaw?.situacao ?? simplesRaw?.status ?? '')
  const meiRaw = raw?.mei ?? est?.mei
  const meiStatus = typeof meiRaw === 'string' ? meiRaw : (meiRaw?.situacao ?? meiRaw?.status ?? '')
  const regimeTributario = raw?.regime_tributario ?? est?.regime_tributario ?? [
    simplesStatus && `Simples Nacional: ${simplesStatus}`,
    meiStatus && `MEI: ${meiStatus}`,
  ].filter(Boolean).join(' | ')

  const ies = est?.inscricoes_estaduais ?? raw?.inscricoes_estaduais
  let inscricaoEstadual = est?.inscricao_estadual ?? raw?.inscricao_estadual ?? ''
  if (Array.isArray(ies) && ies.length) {
    const preferred = ies.find((x: any) => {
      const situ = x?.situacao ?? x?.status
      const sigla = x?.estado?.sigla ?? x?.uf ?? x?.estado
      return (String(situ || '').toLowerCase().includes('ativo') || String(situ || '').toLowerCase().includes('apto')) || sigla === uf
    }) ?? ies[0]
    inscricaoEstadual = preferred?.inscricao_estadual ?? preferred?.inscricao ?? inscricaoEstadual
  }

  return {
    cnpj: String(raw?.cnpj ?? est?.cnpj ?? raw?.CNPJ ?? raw?.document ?? raw?.id ?? ''),
    nome: raw?.razao_social ?? raw?.nome ?? raw?.name ?? '',
    fantasia: est?.nome_fantasia ?? raw?.fantasia ?? raw?.nome_fantasia ?? raw?.trade_name ?? '',
    abertura: est?.data_inicio_atividade ?? raw?.abertura ?? raw?.data_abertura ?? raw?.opened_at ?? '',
    situacao,
    dataSituacaoCadastral,
    natureza,
    regimeTributario,
    cnae,
    inscricaoEstadual,
    endereco: {
      logradouro: est?.logradouro ?? raw?.logradouro ?? raw?.street ?? '',
      numero: est?.numero ?? raw?.numero ?? raw?.number ?? '',
      complemento: est?.complemento ?? raw?.complemento ?? raw?.complement ?? '',
      bairro: est?.bairro ?? raw?.bairro ?? raw?.district ?? '',
      cep: est?.cep ?? raw?.cep ?? raw?.postal_code ?? raw?.zip ?? '',
      municipio,
      uf,
    }
  }
}

// Utilitários para obter informações da máquina e registrar logs
async function getMachineInfo() {
  let computer = 'Unknown'
  try {
    const hostOverride = (window as any).__HOSTNAME__
    const nav: any = navigator
    computer = String(hostOverride ?? nav.platform ?? nav.userAgent ?? 'Unknown')
  } catch {}

  let ip = 'Unknown'
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    if (res.ok) {
      const j = await res.json()
      ip = String(j?.ip ?? ip)
    }
  } catch {}

  return { computer, ip }
}

function appendLog(entry: { timestamp: string; cnpj: string; empresa: string | null; computer: string; ip: string; success: boolean; error: string | null }) {
  const key = 'monitorVision.logs'
  let list: any[] = []
  try {
    const raw = localStorage.getItem(key)
    list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) list = []
  } catch { list = [] }

  list.push(entry)
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {}
}

async function generatePdf(raw: any, digits: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  const labelWidth = 120
  const valueX = margin + labelWidth
  const maxValueWidth = pageWidth - margin - valueX
  let y = margin
  const fields = extractFields(raw)

  const wrap = (text: any) => {
    const str = String(text ?? '')
    // Pré-quebra tokens muito longos para permitir wrap mesmo sem espaços
    const safe = str
      .split(/\n/) // manter quebras manuais
      .map(line => line
        .split(' ')
        .map(tok => tok.length > 40 ? tok.replace(/(.{40})/g, '$1\u200B') : tok)
        .join(' '))
      .join('\n')
    return doc.splitTextToSize(safe, maxValueWidth)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(18)
  doc.text('Consulta CNPJ', pageWidth / 2, y, { align: 'center' })
  y += 28

  doc.setDrawColor(230)
  doc.line(margin, y, pageWidth - margin, y)
  y += 20

  doc.setFontSize(12)
  const rows: Array<[string, string]> = [
    ['CNPJ', maskCNPJ(fields.cnpj || digits)],
    ['Razão Social', fields.nome || '-'],
    ['Nome Fantasia', fields.fantasia || '-'],
    ['Situação', fields.situacao || '-'],
    ['Abertura', fields.abertura || '-'],
    ['Natureza Jurídica', fields.natureza || '-'],
    ['CNAE Principal', fields.cnae || '-'],
    ['Endereço', `${fields.endereco.logradouro || ''}, ${fields.endereco.numero || ''} ${fields.endereco.complemento || ''}`.trim()],
    ['Bairro', fields.endereco.bairro || '-'],
    ['Município/UF', `${fields.endereco.municipio || ''}/${fields.endereco.uf || ''}`.replace(/^\/$/, '-')],
    ['CEP', fields.endereco.cep || '-'],
  ]

  const lineHeight = 16
  rows.forEach(([label, value]) => {
    // Label
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin, y)
    // Valor com wrap
    doc.setFont('helvetica', 'normal')
    const lines = wrap(value)
    doc.text(lines, valueX, y)
    const usedLines = Array.isArray(lines) ? lines.length : 1
    y += lineHeight * usedLines
  })

  y += 12
  doc.setDrawColor(230)
  doc.line(margin, y, pageWidth - margin, y)
  y += 24
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text('Gerado por Monitor VisionApp', pageWidth / 2, y, { align: 'center' })

  const filename = buildPdfFilename(raw, digits)
  doc.save(filename)
}

async function shareViaWhatsApp(raw: any, digits: string) {
  // Tenta compartilhar arquivo via Web Share API (se suportado)
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 40
    const maxWidth = pageWidth - margin * 2
    const fields = extractFields(raw)
    const wrap = (text: any) => {
      const str = String(text ?? '')
      const safe = str
        .split(/\n/)
        .map(line => line
          .split(' ')
          .map(tok => tok.length > 60 ? tok.replace(/(.{60})/g, '$1\u200B') : tok)
          .join(' '))
        .join('\n')
      return doc.splitTextToSize(safe, maxWidth)
    }

    doc.setFontSize(14)
    doc.text('Consulta CNPJ', margin, margin)
    const summary = `CNPJ: ${maskCNPJ(fields.cnpj || digits)}\nRazão Social: ${fields.nome || '-'}\nFantasia: ${fields.fantasia || '-'}\nSituação: ${fields.situacao || '-'}\nAbertura: ${fields.abertura || '-'}`
    doc.setFontSize(11)
    doc.text(wrap(summary), margin, margin + 30)

    const blob = doc.output('blob')
    const file = new File([blob], buildPdfFilename(raw, digits), { type: 'application/pdf' })

    // Verifica capacidade de compartilhar arquivos
    // @ts-ignore
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Consulta CNPJ' })
      return
    }
  } catch {}

  // Fallback: abre WhatsApp com texto pré-preenchido
  const f = extractFields(raw)
  const text = encodeURIComponent(
    `Consulta CNPJ\nCNPJ: ${maskCNPJ(f.cnpj || digits)}\nRazão Social: ${f.nome || '-'}\nFantasia: ${f.fantasia || '-'}\nSituação: ${f.situacao || '-'}\nAbertura: ${f.abertura || '-'}`
  )
  const waUrl = `https://wa.me/?text=${text}`
  window.open(waUrl, '_blank')
}

export default function CNPJLookup() {
  const { config } = useConfig()
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' })

  // ... existing code...
  const handleSearch = async () => {
    const digits = formatCNPJ(cnpj)
    if (digits.length !== 14) {
      setError('Informe um CNPJ com 14 dígitos.')
      setData(null)
      // Logar consulta inválida
      const { computer, ip } = await getMachineInfo()
      appendLog({ timestamp: new Date().toISOString(), cnpj: cnpj, empresa: null, computer, ip, success: false, error: 'CNPJ inválido' })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCNPJ(config.cnpjApiBase, digits)
      setData(result)
      // Logar sucesso
      const { computer, ip } = await getMachineInfo()
      const f = extractFields(result)
      appendLog({ timestamp: new Date().toISOString(), cnpj: digits, empresa: f?.nome || f?.fantasia || null, computer, ip, success: true, error: null })
    } catch (e: any) {
      setError(e?.message || 'Falha ao consultar CNPJ')
      setData(null)
      // Logar erro
      const { computer, ip } = await getMachineInfo()
      appendLog({ timestamp: new Date().toISOString(), cnpj: digits, empresa: null, computer, ip, success: false, error: String(e?.message || e) })
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterClient = () => {
    if (!data) return
    const f = extractFields(data)
    const key = 'clients'
    let list: any[] = []
    try {
      list = JSON.parse(localStorage.getItem(key) || '[]')
      if (!Array.isArray(list)) list = []
    } catch { list = [] }

    const exists = list.some((c) => String(c?.cnpj) === String(f.cnpj))
    if (exists) {
      setSnack({ open: true, message: 'Cliente já cadastrado para este CNPJ.', severity: 'warning' })
      return
    }

    const client = {
      cnpj: f.cnpj,
      nome: f.nome,
      fantasia: f.fantasia,
      inscricaoEstadual: f.inscricaoEstadual,
      regimeTributario: f.regimeTributario,
      situacao: f.situacao,
      dataSituacaoCadastral: f.dataSituacaoCadastral,
      municipio: f.endereco.municipio,
      uf: f.endereco.uf,
      criadoEm: new Date().toISOString(),
    }
    list.push(client)
    localStorage.setItem(key, JSON.stringify(list))
    setSnack({ open: true, message: 'Cliente cadastrado com sucesso!', severity: 'success' })
  }

  const digits = formatCNPJ(cnpj)
  const f = data ? extractFields(data) : null

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%)', color: '#fff' }}>
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={700}>Consulta CNPJ</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>Pesquise informações atualizadas de empresas com um visual clean e opções de exportação.</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="CNPJ"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="Digite o CNPJ"
            inputProps={{ inputMode: 'numeric' }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button variant="contained" onClick={handleSearch} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
            {loading ? 'Consultando...' : 'Consultar'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {data && (
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }} elevation={3}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
              <Typography variant="h6" color="primary.main" fontWeight={700}>Resultado da consulta</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => generatePdf(data, digits)}>Salvar PDF</Button>
                <Button variant="contained" color="success" startIcon={<WhatsAppIcon />} onClick={() => shareViaWhatsApp(data, digits)}>Enviar via WhatsApp</Button>
                <Button variant="contained" color="primary" onClick={handleRegisterClient}>Cadastrar Cliente</Button>
              </Stack>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="primary.main">CNPJ</Typography>
              <Typography variant="body1" component="strong" fontWeight={700}>{maskCNPJ((f?.cnpj) || digits)}</Typography>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="secondary.main">Razão Social</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.nome || '-'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="info.main">Nome Fantasia</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.fantasia || '-'}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="success.main">Situação</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.situacao || '-'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="warning.main">Situação Cadastral</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.situacao || '-'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="warning.main">Data da Situação Cadastral</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.dataSituacaoCadastral || '-'}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="info.main">Inscrição Estadual</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.inscricaoEstadual || '-'}</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" color="secondary.main">Regime Tributário</Typography>
                <Typography variant="body1" component="strong" fontWeight={700}>{f?.regimeTributario || '-'}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="primary.main">Endereço</Typography>
              <Typography variant="body1" component="strong" fontWeight={700}>{`${f?.endereco.logradouro || ''}, ${f?.endereco.numero || ''} ${f?.endereco.complemento || ''}`.trim()}</Typography>
              <Typography variant="body2" color="text.secondary">{`${f?.endereco.bairro || ''} - ${f?.endereco.municipio || ''}/${f?.endereco.uf || ''} - CEP ${f?.endereco.cep || ''}`}</Typography>
            </Stack>
          </Stack>
        </Paper>
      )}

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