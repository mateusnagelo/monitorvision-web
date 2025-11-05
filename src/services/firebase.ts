import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import { getFirestore, type Firestore, collection, doc, setDoc, deleteDoc, getDocs, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, type Auth, signInAnonymously } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getAnalytics, type Analytics } from 'firebase/analytics'

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null
let storage: FirebaseStorage | null = null
let analytics: Analytics | null = null

export function initFirebase(config: FirebaseOptions) {
  if (app) return { app, db, auth, storage, analytics }
  app = initializeApp(config)
  db = getFirestore(app)
  auth = getAuth(app)
  storage = getStorage(app)
  // Tenta autenticar anonimamente para permitir regras padrão (auth != null)
  try {
    if (auth && !auth.currentUser) {
      // Dispara sem bloquear init
      signInAnonymously(auth).catch(() => {})
    }
  } catch {}
  // Inicializa Analytics quando measurementId estiver presente e em ambiente de navegador
  try {
    if (typeof window !== 'undefined' && (config as any)?.measurementId) {
      analytics = getAnalytics(app)
    }
  } catch (_) {
    // Analytics não disponível/permitido no ambiente atual — ignorar silenciosamente
    analytics = null
  }
  return { app, db, auth, storage, analytics }
}

export function getFirebase() {
  if (!app) throw new Error('Firebase não inicializado. Chame initFirebase primeiro.')
  return { app, db, auth, storage, analytics }
}

async function ensureAuth() {
  try {
    const { auth } = getFirebase()
    if (auth && !auth.currentUser) {
      await signInAnonymously(auth)
    }
  } catch {
    // Ignorar: initFirebase deve ser chamado pelo consumidor antes
  }
}

export type ClientRecord = {
  cnpj: string
  nome?: string
  fantasia?: string
  inscricaoEstadual?: string
  regimeTributario?: string
  situacao?: string
  dataSituacaoCadastral?: string
  municipio?: string
  uf?: string
  criadoEm?: string
}

export type LogRecord = {
  timestamp: string
  cnpj: string
  empresa: string | null
  computer: string
  ip: string
  success: boolean
  error: string | null
}

export async function saveClientToFirestore(client: ClientRecord) {
  await ensureAuth()
  const { db } = getFirebase()
  await setDoc(doc(db!, 'clientes', client.cnpj), { ...client, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true })
}

export async function deleteClientFromFirestore(cnpj: string) {
  await ensureAuth()
  const { db } = getFirebase()
  await deleteDoc(doc(db!, 'clientes', cnpj))
}

export async function clearClientsFromFirestore() {
  await ensureAuth()
  const { db } = getFirebase()
  const snap = await getDocs(collection(db!, 'clientes'))
  const batch = writeBatch(db!)
  snap.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export async function addLogToFirestore(log: LogRecord) {
  await ensureAuth()
  const { db } = getFirebase()
  await addDoc(collection(db!, 'logs'), { ...log, createdAt: serverTimestamp() })
}

export async function clearLogsFromFirestore() {
  await ensureAuth()
  const { db } = getFirebase()
  const snap = await getDocs(collection(db!, 'logs'))
  const batch = writeBatch(db!)
  snap.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}