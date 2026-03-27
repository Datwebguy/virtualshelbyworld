/**
 * IndexedDB store for user-uploaded video files.
 * Blob URLs from URL.createObjectURL() die on page refresh — this persists
 * the actual File so we can recreate a valid URL any time.
 */

const DB_NAME = "vsw_videodb";
const STORE = "videos";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveVideoFile(cid: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, cid);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getVideoFile(cid: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(cid);
    req.onsuccess = () => resolve((req.result as File) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVideoFile(cid: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(cid);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
