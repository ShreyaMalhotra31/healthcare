// IndexedDB database for offline storage

// Database config
const DB_NAME = 'svasthyaSaathiDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  PATIENTS: 'patients',
  MESSAGES: 'messages',
  ASSESSMENTS: 'assessments',
  PENDING_SYNC: 'pendingSync',
};

interface SyncItem {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
}

// Open IndexedDB and create stores if needed
export async function setupIndexedDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('IndexedDB error: ' + request.error);
    };
    
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
        db.createObjectStore(STORES.PATIENTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains(STORES.ASSESSMENTS)) {
        db.createObjectStore(STORES.ASSESSMENTS, { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const pendingSyncStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' });
        pendingSyncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Generic function to add an item to a store
export async function addToStore(storeName: string, item: any): Promise<any> {
  const db = await setupIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(`Error adding to ${storeName}: ${request.error}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Add a pending sync item
export async function addPendingSync(endpoint: string, method: string, data: any): Promise<void> {
  const syncItem: SyncItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    endpoint,
    method,
    data,
    timestamp: Date.now(),
  };
  
  await addToStore(STORES.PENDING_SYNC, syncItem);
}

// Get all items from a store
export async function getAllFromStore(storeName: string): Promise<any[]> {
  const db = await setupIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(`Error getting from ${storeName}: ${request.error}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Get all pending sync items
export async function getPendingSyncItems(): Promise<SyncItem[]> {
  return getAllFromStore(STORES.PENDING_SYNC) as Promise<SyncItem[]>;
}

// Delete a sync item after it's processed
export async function deleteSyncItem(id: string): Promise<void> {
  const db = await setupIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SYNC);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(`Error deleting sync item: ${request.error}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Synchronize pending items when online
export async function synchronizeData(apiRequest: Function): Promise<void> {
  const pendingItems = await getPendingSyncItems();
  
  if (pendingItems.length === 0) {
    return;
  }
  
  for (const item of pendingItems) {
    try {
      await apiRequest(item.method, item.endpoint, item.data);
      await deleteSyncItem(item.id);
    } catch (error) {
      console.error('Failed to sync item:', item, error);
      // Keep the item in the queue to retry later
    }
  }
}

// Cache patients data
export async function cachePatients(patients: any[]): Promise<void> {
  const db = await setupIndexedDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PATIENTS, 'readwrite');
    const store = transaction.objectStore(STORES.PATIENTS);
    
    // Clear existing data
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      // Add all patients
      let completed = 0;
      
      for (const patient of patients) {
        const request = store.add(patient);
        
        request.onsuccess = () => {
          completed++;
          if (completed === patients.length) {
            resolve();
          }
        };
        
        request.onerror = () => {
          reject(`Error caching patient: ${request.error}`);
        };
      }
      
      if (patients.length === 0) {
        resolve();
      }
    };
    
    clearRequest.onerror = () => {
      reject(`Error clearing patients store: ${clearRequest.error}`);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Get cached patients
export async function getCachedPatients(): Promise<any[]> {
  return getAllFromStore(STORES.PATIENTS);
}

// Save a chat message offline
export async function saveChatMessageOffline(message: string, isUserMessage: boolean): Promise<void> {
  const messageData = {
    message,
    isUserMessage,
    timestamp: new Date().toISOString(),
  };
  
  await addToStore(STORES.MESSAGES, messageData);
  
  if (!isUserMessage) {
    return;
  }
  
  // Add the user message to pending sync when back online
  await addPendingSync('/api/chat', 'POST', { message });
}

// Get chat history from IndexedDB
export async function getChatHistoryOffline(): Promise<any[]> {
  return getAllFromStore(STORES.MESSAGES);
}
