import { useState, useCallback, useEffect, useRef } from 'react';

interface FileSystemStorageData {
  categories: any[];
  paymentMethods: any[];
  transactions: any[];
  lastSaved: string;
}

// Extend Window interface for File System Access API
declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle>;
  }
  
  interface FileSystemFileHandle {
    queryPermission?: (descriptor: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
    requestPermission?: (descriptor: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
  }
}

const DB_NAME = 'finapp_filehandle_db';
const STORE_NAME = 'filehandles';
const HANDLE_KEY = 'dataFileHandle';

// IndexedDB helpers to persist file handle between sessions
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveHandleToDB(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getHandleFromDB(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

async function clearHandleFromDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(HANDLE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function useFileSystemStorage() {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if File System Access API is supported
  const isSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

  // Try to restore previous file handle on mount
  useEffect(() => {
    async function restoreHandle() {
      if (!isSupported) {
        setIsLoading(false);
        setError('Seu navegador não suporta File System Access API. Use Chrome ou Brave.');
        return;
      }

      try {
        const storedHandle = await getHandleFromDB();
        if (storedHandle && storedHandle.queryPermission) {
          // Verify we still have permission
          const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            setFileHandle(storedHandle);
            setFileName(storedHandle.name);
            setIsReady(true);
          }
        }
      } catch (err) {
        console.log('No stored file handle or permission denied');
      }
      setIsLoading(false);
    }

    restoreHandle();
  }, [isSupported]);

  // Select or create a new file
  const selectFile = useCallback(async (): Promise<FileSystemStorageData | null> => {
    if (!isSupported || !window.showSaveFilePicker) {
      setError('Seu navegador não suporta File System Access API.');
      return null;
    }

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'finapp-dados.json',
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });

      // Request permission
      if (handle.requestPermission) {
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          setError('Permissão negada para acessar o arquivo.');
          return null;
        }
      }

      // Save handle for future sessions
      await saveHandleToDB(handle);
      setFileHandle(handle);
      setFileName(handle.name);
      setIsReady(true);
      setError(null);

      // Try to read existing data
      try {
        const file = await handle.getFile();
        const text = await file.text();
        if (text.trim()) {
          return JSON.parse(text);
        }
      } catch {
        // File is empty or new, that's okay
      }

      return null;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Erro ao selecionar arquivo: ' + err.message);
      }
      return null;
    }
  }, [isSupported]);

  // Load data from file
  const loadData = useCallback(async (): Promise<FileSystemStorageData | null> => {
    if (!fileHandle) return null;

    try {
      // Re-request permission if needed
      if (fileHandle.requestPermission) {
        const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          setError('Permissão negada. Clique em "Selecionar Arquivo" novamente.');
          setIsReady(false);
          return null;
        }
      }

      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text.trim()) {
        return JSON.parse(text);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados: ' + err.message);
    }
    return null;
  }, [fileHandle]);

  // Save data to file (debounced)
  const saveData = useCallback(async (data: Omit<FileSystemStorageData, 'lastSaved'>): Promise<boolean> => {
    if (!fileHandle) return false;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    return new Promise((resolve) => {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const writable = await fileHandle.createWritable();
          const dataToSave: FileSystemStorageData = {
            ...data,
            lastSaved: new Date().toISOString(),
          };
          await writable.write(JSON.stringify(dataToSave, null, 2));
          await writable.close();
          setError(null);
          resolve(true);
        } catch (err: any) {
          console.error('Error saving data:', err);
          setError('Erro ao salvar: ' + err.message);
          resolve(false);
        }
      }, 500); // Debounce 500ms
    });
  }, [fileHandle]);

  // Disconnect from current file
  const disconnect = useCallback(async () => {
    await clearHandleFromDB();
    setFileHandle(null);
    setFileName(null);
    setIsReady(false);
  }, []);

  return {
    isSupported,
    isReady,
    isLoading,
    fileName,
    error,
    selectFile,
    loadData,
    saveData,
    disconnect,
  };
}
