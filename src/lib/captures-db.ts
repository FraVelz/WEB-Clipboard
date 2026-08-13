const DB_NAME = "web-clipboard";
const DB_VERSION = 2;
const STORE = "captures";

export type CaptureRecord = {
  id: string;
  title: string;
  createdAt: number;
  position: number;
  mimeType: string;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction;
      if (!tx) return;

      let store: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE)) {
        store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("position", "position");
      } else {
        store = tx.objectStore(STORE);
        if (!store.indexNames.contains("createdAt")) {
          store.createIndex("createdAt", "createdAt");
        }
        if (!store.indexNames.contains("position")) {
          store.createIndex("position", "position");
        }
      }

      if (event.oldVersion < 2) {
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const records = [...(getAllReq.result as CaptureRecord[])].sort(
            (a, b) => b.createdAt - a.createdAt,
          );
          records.forEach((record, index) => {
            store.put({ ...record, position: index });
          });
        };
      }
    };
  });
}

function sortByPosition(records: CaptureRecord[]): CaptureRecord[] {
  return [...records].sort((a, b) => {
    const posA = a.position ?? Number.MAX_SAFE_INTEGER;
    const posB = b.position ?? Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return b.createdAt - a.createdAt;
  });
}

export async function listCaptures(): Promise<CaptureRecord[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        resolve(sortByPosition(req.result as CaptureRecord[]));
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
  const db = await openDb();
  try {
    const existing = await new Promise<CaptureRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result as CaptureRecord[]);
      req.onerror = () =>
        reject(req.error ?? new Error("list captures failed"));
    });

    const record: CaptureRecord = {
      id: crypto.randomUUID(),
      title: input.title,
      createdAt: Date.now(),
      position: 0,
      mimeType: input.mimeType,
      blob: input.blob,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const item of existing) {
        store.put({ ...item, position: (item.position ?? 0) + 1 });
      }
      store.add(record);
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

export async function reorderCaptures(orderedIds: string[]): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);

      orderedIds.forEach((id, position) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const current = getReq.result as CaptureRecord | undefined;
          if (current) store.put({ ...current, position });
        };
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("reorder captures failed"));
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
