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
const LOCALSTORAGE_KEY = 'finapp_data';

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
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore errors
  }
}

// LocalStorage fallback functions
function loadFromLocalStorage(): FileSystemStorageData | null {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(data: Omit<FileSystemStorageData, 'lastSaved'>): void {
  try {
    const dataToSave: FileSystemStorageData = {
      ...data,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

export function useFileSystemStorage() {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if File System Access API is supported and usable
  const checkFileSystemSupport = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    if (!('showSaveFilePicker' in window)) return false;
    
    // Check if in restricted environment
    try {
      if (window.self !== window.top) return false;
    } catch {
      return false;
    }
    
    return true;
  }, []);

  const isSupported = checkFileSystemSupport();

  // Initialize on mount - always start ready with localStorage or file
  useEffect(() => {
    async function initialize() {
      // Try to restore file handle if supported
      if (isSupported) {
        try {
          const storedHandle = await getHandleFromDB();
          if (storedHandle && storedHandle.queryPermission) {
            const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
              setFileHandle(storedHandle);
              setFileName(storedHandle.name);
              setUsingFallback(false);
              setIsReady(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.log('Could not restore file handle');
        }
      }

      // Default to localStorage (always works)
      setUsingFallback(true);
      setFileName('Armazenamento local');
      setIsReady(true);
      setIsLoading(false);
    }

    initialize();
  }, [isSupported]);

  // Select or create a new file (for when user explicitly wants file storage)
  const selectFile = useCallback(async (): Promise<FileSystemStorageData | null> => {
    if (!isSupported || !window.showSaveFilePicker) {
      setError('File System API não disponível. Usando armazenamento local.');
      return loadFromLocalStorage();
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

      if (handle.requestPermission) {
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          setError('Permissão negada para acessar o arquivo.');
          return null;
        }
      }

      await saveHandleToDB(handle);
      setFileHandle(handle);
      setFileName(handle.name);
      setUsingFallback(false);
      setError(null);

      // Try to read existing data
      try {
        const file = await handle.getFile();
        const text = await file.text();
        if (text.trim()) {
          return JSON.parse(text);
        }
      } catch {
        // File is empty or new
      }

      return null;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Erro ao selecionar arquivo: ' + err.message);
      }
      return null;
    }
  }, [isSupported]);

  // Load data from file or localStorage
  const loadData = useCallback(async (): Promise<FileSystemStorageData | null> => {
    if (usingFallback) {
      return loadFromLocalStorage();
    }

    if (!fileHandle) return loadFromLocalStorage();

    try {
      if (fileHandle.requestPermission) {
        const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          // Fall back to localStorage
          setUsingFallback(true);
          setFileName('Armazenamento local');
          return loadFromLocalStorage();
        }
      }

      const file = await fileHandle.getFile();
      const text = await file.text();
      if (text.trim()) {
        return JSON.parse(text);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      // Fall back to localStorage
      setUsingFallback(true);
      setFileName('Armazenamento local');
      return loadFromLocalStorage();
    }
    return null;
  }, [fileHandle, usingFallback]);

  // Save data (debounced)
  const saveData = useCallback(async (data: Omit<FileSystemStorageData, 'lastSaved'>): Promise<boolean> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    return new Promise((resolve) => {
      saveTimeoutRef.current = setTimeout(async () => {
        // Always save to localStorage as backup
        saveToLocalStorage(data);

        // If using file, also save there
        if (!usingFallback && fileHandle) {
          try {
            const writable = await fileHandle.createWritable();
            const dataToSave: FileSystemStorageData = {
              ...data,
              lastSaved: new Date().toISOString(),
            };
            await writable.write(JSON.stringify(dataToSave, null, 2));
            await writable.close();
            setError(null);
          } catch (err: any) {
            console.error('Error saving to file:', err);
            // Don't show error, localStorage backup exists
          }
        }

        resolve(true);
      }, 500);
    });
  }, [fileHandle, usingFallback]);

  // Switch to localStorage
  const useLocalStorage = useCallback(async () => {
    await clearHandleFromDB();
    setFileHandle(null);
    setFileName('Armazenamento local');
    setUsingFallback(true);
  }, []);

  return {
    isSupported,
    isReady,
    isLoading,
    fileName,
    error,
    usingFallback,
    selectFile,
    loadData,
    saveData,
    useLocalStorage,
  };
}
