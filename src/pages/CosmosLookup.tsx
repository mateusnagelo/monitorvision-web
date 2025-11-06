import { useState, useEffect } from 'react'
import { Alert, Box, Button, Divider, Grid, InputAdornment, Paper, Stack, TextField, Typography, CircularProgress, Chip, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import QrCodeIcon from '@mui/icons-material/QrCode'
import TableChart from '@mui/icons-material/TableChart'
import { useConfig } from '../context/ConfigContext'
import { appendCosmosLog, fetchByEAN, searchProducts } from '../services/cosmos'
import { fetchNCM } from '../services/ncm'
import { FileText, Copy, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'


import { ProductDetailModal } from '../components/ProductDetailModal'

// Hook de debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface UnifiedProduct {
  gtin: string;
  description: string;
  ncm: { code: string; description: string };
  source: 'Nome' | 'EAN' | 'NCM';
  originalProduct: any;
}

function cleanDigits(input: string) {
  return input.replace(/\D/g, '')
}

// Removido tipo e estado de tipo de busca; teremos dois campos: nome e EAN
export default function CosmosLookup() {
  const { config } = useConfig()
  // estados ajustados para dois campos
  const [nameQuery, setNameQuery] = useState('')
  const [eanQuery, setEanQuery] = useState('')
  const [ncmQuery, setNcmQuery] = useState('')

  // Debounce das queries
  const debouncedNameQuery = useDebounce(nameQuery, 500)
  const debouncedEanQuery = useDebounce(eanQuery, 500)
  const debouncedNcmQuery = useDebounce(ncmQuery, 500)

  const [loading, setLoading] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [errorName, setErrorName] = useState<string | null>(null)
  const [errorEAN, setErrorEAN] = useState<string | null>(null)
  const [errorNCM, setErrorNCM] = useState<string | null>(null)
  const [results, setResults] = useState<UnifiedProduct[]>([])
  const [productForModal, setProductForModal] = useState<any>(null)
  const [detailLoadingGtin, setDetailLoadingGtin] = useState<string | null>(null)

  useEffect(() => {
    // Evita a busca inicial com campos vazios
    if (debouncedNameQuery.trim() || debouncedEanQuery.trim() || debouncedNcmQuery.trim()) {
      handleSearch()
    }
  }, [debouncedNameQuery, debouncedEanQuery, debouncedNcmQuery])

  const handleOpenDetails = async (product: any) => {
    const gtinToFetch = product.gtin || getGtins(product)[0]

    if (!gtinToFetch) {
      setErrorGeneral('Produto sem código GTIN para consulta de detalhes.')
      return
    }

    setDetailLoadingGtin(gtinToFetch)
    setErrorGeneral(null)

    try {
      const fullProduct = await fetchByEAN(config.cosmosApiBase, config.cosmosToken, gtinToFetch)
      setProductForModal(fullProduct)
    } catch (e: any) {
      setErrorGeneral(e?.message || 'Falha ao carregar detalhes do produto.')
      setProductForModal(null)
    } finally {
      setDetailLoadingGtin(null)
    }
  }

  const handleSearch = async () => {
    const name = debouncedNameQuery.trim()
    const eanDigits = cleanDigits(debouncedEanQuery)
    const ncmDigits = cleanDigits(debouncedNcmQuery)

    setErrorGeneral(null)
    setErrorName(null)
    setErrorEAN(null)
    setErrorNCM(null)
    setResults([])

    if (!name && !eanDigits && !ncmDigits) {
      setErrorGeneral('Informe Nome do Produto, Código EAN/GTIN ou Código NCM.')
      return
    }

    setLoading(true)
    const newResults: UnifiedProduct[] = []

    // Busca por nome se informado
    if (name) {
      try {
        const byName = await searchProducts(config.cosmosApiBase, config.cosmosToken, name)
        if (byName.products) {
          byName.products.forEach((p: any) => {
            newResults.push({
              gtin: p.gtin || 'N/A',
              description: p.description,
              ncm: { code: p.ncm?.code || 'N/A', description: p.ncm?.description || '' },
              source: 'Nome',
              originalProduct: p,
            })
          })
        }
        setErrorName(null)
        appendCosmosLog({ timestamp: new Date().toISOString(), type: 'NOME', query: name, success: true, error: null })
      } catch (e: any) {
        setErrorName(e?.message || 'Falha ao pesquisar produtos')
        appendCosmosLog({ timestamp: new Date().toISOString(), type: 'NOME', query: name, success: false, error: String(e?.message || e) })
      }
    }

    // Busca por EAN se válido
    if (eanDigits) {
      if (eanDigits.length < 8) {
        setErrorEAN('Informe um EAN/GTIN válido (mín. 8 dígitos).')
      } else {
        try {
          const byEAN = await fetchByEAN(config.cosmosApiBase, config.cosmosToken, eanDigits)
          newResults.push({
            gtin: byEAN.gtin,
            description: byEAN.description,
            ncm: { code: byEAN.ncm?.code || 'N/A', description: byEAN.ncm?.description || '' },
            source: 'EAN',
            originalProduct: byEAN,
          })
          setErrorEAN(null)
          appendCosmosLog({ timestamp: new Date().toISOString(), type: 'EAN', query: eanDigits, success: true, error: null })
        } catch (e: any) {
          setErrorEAN(e?.message || 'Falha ao consultar EAN/GTIN')
          appendCosmosLog({ timestamp: new Date().toISOString(), type: 'EAN', query: eanDigits, success: false, error: String(e?.message || e) })
        }
      }
    }

    // Busca por NCM se válido
    if (ncmDigits) {
      if (ncmDigits.length !== 8) {
        setErrorNCM('Informe um código NCM com 8 dígitos.')
      } else {
        try {
          const byNCM = await fetchNCM(config.cosmosApiBase, config.cosmosToken, ncmDigits)
          const products = extractProducts(byNCM)
          if (products) {
            products.slice(0, 20).forEach((p: any) => { // Limita a 20 produtos por NCM
              newResults.push({
                gtin: getGtins(p).join(', ') || 'N/A',
                description: p.description || p.name,
                ncm: { code: ncmDigits, description: byNCM.description || '' },
                source: 'NCM',
                originalProduct: { ...p, ncm: { code: ncmDigits, description: byNCM.description } },
              })
            })
          }
          setErrorNCM(null)
          appendCosmosLog({ timestamp: new Date().toISOString(), type: 'NCM', query: ncmDigits, success: true, error: null })
        } catch (e: any) {
          setErrorNCM(e?.message || 'Falha ao consultar NCM')
          appendCosmosLog({ timestamp: new Date().toISOString(), type: 'NCM', query: ncmDigits, success: false, error: String(e?.message || e) })
        }
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      console.warn('Falha ao copiar', e)
    }
  }

  const exportJson = (obj: any, filename: string) => {
    const data = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Helpers para extrair campos comuns do retorno por NCM
  const getNcmSummary = (ncmData: any) => {
    const total = ncmData?.total || ncmData?.count || (Array.isArray(ncmData) ? ncmData.length : 0)
    const produtos = ncmData?.products || ncmData?.items || (Array.isArray(ncmData) ? ncmData : [])
    const primeiraDescricao = produtos?.[0]?.name || produtos?.[0]?.description || ncmData?.description || 'NCM consultado'
    return { total, produtos, primeiraDescricao }
  }

  // Extração robusta das informações do NCM (código, descrição e classificação)
  const extractNcmInfo = (data: any) => {
    const n = data?.ncm || data
    const code = n?.code || n?.ncm || n?.id || null
    const description = n?.description || n?.name || data?.description || 'NCM'
    const chapter = n?.chapter || data?.chapter || null
    const position = n?.position || data?.position || null
    const subposition = n?.subposition || data?.subposition || null
    const category = n?.category || data?.category || null
    return { code, description, chapter, position, subposition, category }
  }

  const extractProducts = (data: any) => {
    return data?.products || data?.items || (Array.isArray(data) ? data : [])
  }

  const getGtins = (p: any): string[] => {
    if (Array.isArray(p?.gtins)) return p.gtins.map((g: any) => g?.gtin || g).filter(Boolean)
    if (p?.gtin) return [p.gtin]
    return []
  }
  
  // Variantes de animação sutis para dar toque premium
  const fadeSlideUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }
  
  const listParent = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  
  const listItem = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  }
  
  // Componentes Motion para MUI
  const MotionPaper = motion(Paper as any)
  const MotionButton = motion(Button as any)

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Nome do Produto"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Digite nome do produto..."
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />

          <TextField
            label="Código EAN/GTIN"
            value={eanQuery}
            onChange={(e) => setEanQuery(e.target.value)}
            placeholder="Digite código EAN/GTIN..."
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeIcon /></InputAdornment> }}
          />

          <TextField
            label="Código NCM"
            value={ncmQuery}
            onChange={(e) => setNcmQuery(e.target.value)}
            placeholder="Digite código NCM (8 dígitos)..."
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><TableChart /></InputAdornment> }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" onClick={handleSearch} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              {loading ? 'Pesquisando...' : 'Buscar'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {errorGeneral && <Alert severity="error">{errorGeneral}</Alert>}
      {errorName && <Alert severity="error">Busca por Nome: {errorName}</Alert>}
      {errorEAN && <Alert severity="error">Consulta por EAN/GTIN: {errorEAN}</Alert>}
      {errorNCM && <Alert severity="error">Consulta por NCM: {errorNCM}</Alert>}

      {results.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resultados da Busca
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fonte</TableCell>
                  <TableCell>GTIN/EAN</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>NCM</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((product, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Chip label={product.source} size="small" />
                    </TableCell>
                    <TableCell>{product.gtin}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.ncm.code}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenDetails(product.originalProduct)}
                        disabled={detailLoadingGtin === product.gtin}
                      >
                        {detailLoadingGtin === product.gtin ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          'Detalhes'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <ProductDetailModal
        product={productForModal}
        onOpenChange={() => setProductForModal(null)}
      />
    </Stack>
  )
}