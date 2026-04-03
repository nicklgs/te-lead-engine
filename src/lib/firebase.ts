import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp, serverTimestamp,
  type DocumentData, type QueryConstraint, type Firestore,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User, type Auth } from 'firebase/auth';
import type { Lead, Buyer, ScrubHistory } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tehomeleads',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization — only init when actually called, not at import time
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

function isConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

function getDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

function getAuthInstance(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

// Auth helpers
export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(getAuthInstance(), email, password);
}

export async function logout() {
  return signOut(getAuthInstance());
}

export function onAuth(cb: (user: User | null) => void) {
  if (!isConfigured()) { cb(null); return () => {}; }
  return onAuthStateChanged(getAuthInstance(), cb);
}

// Firestore date conversion
function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return new Date();
}

function convertLead(id: string, data: DocumentData): Lead {
  return {
    ...data,
    id,
    followUp: data.followUp ? toDate(data.followUp) : null,
    skipTrace: data.skipTrace ? { ...data.skipTrace, timestamp: toDate(data.skipTrace.timestamp) } : null,
    comps: data.comps ? { ...data.comps, timestamp: toDate(data.comps.timestamp) } : null,
    activities: (data.activities || []).map((a: DocumentData) => ({ ...a, date: toDate(a.date) })),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as Lead;
}

// Leads CRUD — all methods throw if Firebase not configured (callers should catch & fallback to demo data)
export async function getLeads(filters?: { stage?: string; categoryId?: string; zip?: string }): Promise<Lead[]> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (filters?.stage) constraints.unshift(where('stage', '==', filters.stage));
  if (filters?.categoryId) constraints.unshift(where('categoryId', '==', filters.categoryId));
  const q = query(collection(db, 'leads'), ...constraints);
  const snap = await getDocs(q);
  let leads = snap.docs.map(d => convertLead(d.id, d.data()));
  if (filters?.zip) leads = leads.filter(l => l.zip === filters.zip);
  return leads.filter(l => !l.isDuplicate);
}

export function subscribeLeads(cb: (leads: Lead[]) => void) {
  if (!isConfigured()) return () => {};
  const db = getDb();
  const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => convertLead(d.id, d.data())).filter(l => !l.isDuplicate));
  });
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const snap = await getDoc(doc(db, 'leads', id));
  if (!snap.exists()) return null;
  return convertLead(snap.id, snap.data());
}

export async function addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const ref = await addDoc(collection(db, 'leads'), {
    ...lead,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<void> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  await updateDoc(doc(db, 'leads', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLead(id: string): Promise<void> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  await deleteDoc(doc(db, 'leads', id));
}

// Buyers CRUD
export async function getBuyers(): Promise<Buyer[]> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const q = query(collection(db, 'buyers'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: toDate(d.data().createdAt) } as Buyer));
}

export async function addBuyer(buyer: Omit<Buyer, 'id' | 'createdAt'>): Promise<string> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const ref = await addDoc(collection(db, 'buyers'), { ...buyer, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteBuyer(id: string): Promise<void> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  await deleteDoc(doc(db, 'buyers', id));
}

// Scrub History
export async function addScrubHistory(entry: Omit<ScrubHistory, 'id'>): Promise<string> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const ref = await addDoc(collection(db, 'scrubHistory'), { ...entry, date: serverTimestamp() });
  return ref.id;
}

export async function getScrubHistory(): Promise<ScrubHistory[]> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const q = query(collection(db, 'scrubHistory'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id, date: toDate(d.data().date) } as ScrubHistory));
}

// Ping to check connectivity
export async function checkConnection(): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const db = getDb();
    await getDocs(query(collection(db, 'leads'), where('stage', '==', '__ping__')));
    return true;
  } catch { return false; }
}

// Wipe all leads and buyers (settings page)
export async function clearAllData(): Promise<void> {
  if (!isConfigured()) throw new Error('Firebase not configured');
  const db = getDb();
  const leadsSnap = await getDocs(collection(db, 'leads'));
  for (const d of leadsSnap.docs) await deleteDoc(doc(db, 'leads', d.id));
  const buyersSnap = await getDocs(collection(db, 'buyers'));
  for (const d of buyersSnap.docs) await deleteDoc(doc(db, 'buyers', d.id));
}
