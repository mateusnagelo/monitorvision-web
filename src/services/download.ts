export const createDownloadStream = (sizeMB: number) => {
  const size = Math.max(1, sizeMB) * 1024 * 1024;
  const payload = new Uint8Array(size);
  // Preencher o payload com dados aleatórios para evitar compressão
  crypto.getRandomValues(payload);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(payload);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': payload.length.toString(),
      'Access-Control-Allow-Origin': '*', // Permitir CORS de qualquer origem
    },
  });
};

function appendDownloadEvent(event: { filename: string; success: boolean; error?: string }) {
  const key = 'monitorVision.downloads';
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? [...list, { ...event, timestamp: Date.now() }] : [event];
    localStorage.setItem(key, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save download event to localStorage', e);
  }
}

export async function downloadIBPTCsv(baseUrl: string, filename: string) {
  const url = `${baseUrl.replace(/\/$/, '')}/${filename}.csv`;
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    appendDownloadEvent({ filename, success: true });
  } catch (e: any) {
    appendDownloadEvent({ filename, success: false, error: e.message });
    // Fallback: se o download falhar (ex: bloqueio de CORS), abrir em nova aba
    window.open(url, '_blank');
  }
}