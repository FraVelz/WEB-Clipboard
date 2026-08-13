const DB_NAME = "web-clipboard";
const DB_VERSION = 1;
const STORE = "captures";

export type CaptureRecord = {
  id: string;
  title: string;
  createdAt: number;
  mimeType: string;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
  });
}

export async function listCaptures(): Promise<CaptureRecord[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).index("createdAt").getAll();
      req.onsuccess = () => {
        const records = [...(req.result as CaptureRecord[])].sort(
          (a, b) => b.createdAt - a.createdAt,
        );
        resolve(records);
      };
      req.onerror = () =>
        reject(req.error ?? new Error("list captures failed"));
    });
  } finally {
    db.close();
  }
}

export async function addCapture(input: {
  title: string;
  blob: Blob;
  mimeType: string;
}): Promise<CaptureRecord> {
  const record: CaptureRecord = {
    id: crypto.randomUUID(),
    title: input.title,
    createdAt: Date.now(),
    mimeType: input.mimeType,
    blob: input.blob,
  };

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("add capture failed"));
    });
    return record;
  } finally {
    db.close();
  }
}

export async function updateCaptureTitle(
  id: string,
  title: string,
): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      let missing = false;

      getReq.onsuccess = () => {
        const current = getReq.result as CaptureRecord | undefined;
        if (!current) {
          missing = true;
          return;
        }
        store.put({ ...current, title });
      };
      getReq.onerror = () =>
        reject(getReq.error ?? new Error("get capture failed"));
      tx.oncomplete = () => {
        if (missing) {
          reject(new Error(`Capture not found: ${id}`));
          return;
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error ?? new Error("update capture failed"));
    });
  } finally {
    db.close();
  }
}

export async function deleteCapture(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("delete capture failed"));
    });
  } finally {
    db.close();
  }
}
