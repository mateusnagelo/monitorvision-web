function appendDownloadEvent(entry: { url: string; filename: string; timestamp: string; success: boolean; error?: string }) {
  const key = 'monitorVision.downloads'
  let list: any[] = []
  try {
    const raw = localStorage.getItem(key)
    list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) list = []
  } catch { list = [] }
  list.push(entry)
  try { localStorage.setItem(key, JSON.stringify(list)) } catch {}
}

export async function downloadIBPTCsv(url: string, filename: string = 'ibpt') {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    // Forçar extensão .csv
    const hasCsvExt = /\.csv$/i.test(filename)
    const finalName = hasCsvExt ? filename : `${filename}.csv`

    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = finalName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)

    appendDownloadEvent({ url, filename: finalName, timestamp: new Date().toISOString(), success: true })
  } catch (e: any) {
    appendDownloadEvent({ url, filename, timestamp: new Date().toISOString(), success: false, error: String(e?.message || e) })
    // Fallback: abre o link
    window.open(url, '_blank')
  }
}