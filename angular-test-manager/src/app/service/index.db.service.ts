import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IndexDbService {
  private collections: Map<string, IDBDatabase>;

  constructor() {
    this.collections = new Map();
  }

  public create(collectionName: string, value: any): Observable<number> {
    return new Observable<number>((observer) => {
      const db = this.collections.get(collectionName);
      if (db) {
        const transaction = db.transaction([collectionName], 'readwrite');
        const store = transaction.objectStore(collectionName);

        const request = store.add(value);

        request.onsuccess = (event: any) => {
          observer.next(event.target.result);
          observer.complete();
        };

        request.onerror = (event: any) => {
          observer.error(`Error saving to ${collectionName}: ${event}`);
        };
      } else {
        observer.error('Database not initialized for this collection.');
      }
    });
  }

  public initIndexedDB(collectionName: string, schema: Map<string, any>, version: number = 1, log?: string): Observable<void> {
    return new Observable<void>((observer) => {
      if (this.collections.has(collectionName)) {
        const db = this.collections.get(collectionName)!;
        if (version > db.version) {
          this.upgradeCollection(db, collectionName, schema, version, log).subscribe({
            complete: () => observer.complete(),
            error: (err: Error) => observer.error(err)
          });
        } else {
          observer.complete();
        }
      } else {
        const request = indexedDB.open(collectionName, version);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          this.createObjectStore(db, collectionName, schema);
        };

        request.onsuccess = (event: any) => {
          const db = event.target.result;
          this.collections.set(collectionName, db);
          observer.complete();
        };

        request.onerror = (event: any) => {
          observer.error(`Error initializing IndexedDB for ${collectionName}: ${event}`);
        };
      }
    });
  }

  public save(collectionName: string, key: number | null, value: any): Observable<number> {
    return new Observable<number>((observer) => {
      const db = this.collections.get(collectionName);
      if (db) {
        const transaction = db.transaction([collectionName], 'readwrite');
        const store = transaction.objectStore(collectionName);

        if (key) {
          store.put({ ...value, id: key });

          transaction.oncomplete = () => {
            observer.next(key);
            observer.complete();
          };

          transaction.onerror = (event: any) => {
            observer.error(`Error saving to ${collectionName}: ${event}`);
          };
        } else {
          this.create(collectionName, value).subscribe({
            next: (key) => {
              observer.next(key);
            },
            complete: () => {
              observer.complete();
            },
            error: (err: Error) => {
              observer.error(err);
            }
          });
        }
      } else {
        observer.error('Database not initialized for this collection.');
      }
    });
  }

  public query(collectionName: string, key: number): Observable<any> {
    return new Observable((observer) => {
      const db = this.collections.get(collectionName);
      if (!db) {
        observer.error('Database not initialized');
        return;
      }

      const transaction = db.transaction([collectionName], 'readonly');
      const store = transaction.objectStore(collectionName);
      const request = store.get(key);

      request.onsuccess = (event: any) => {
        observer.next(event.target.result);
        observer.complete();
      };

      request.onerror = (event: any) => {
        observer.error('Error fetching data: ' + event);
      };
    });
  }

  public queryAll(collectionName: string): Observable<any[]> {
    return new Observable((observer) => {
      const db = this.collections.get(collectionName);
      if (!db) {
        observer.error('Database not initialized');
        return;
      }

      const transaction = db.transaction([collectionName], 'readonly');
      const store = transaction.objectStore(collectionName);
      const request = store.getAll();

      request.onsuccess = (event: any) => {
        observer.next(event.target.result);
        observer.complete();
      };

      request.onerror = (event: any) => {
        observer.error('Error fetching all data: ' + event);
      };
    });
  }

  private upgradeCollection(db: IDBDatabase, collectionName: string, schema: Map<string, any>, version: number, log?: string): Observable<void> {
    return new Observable<void>((observer) => {
      db.close();
      const request = indexedDB.open(collectionName, version);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        this.createObjectStore(db, collectionName, schema);
        observer.complete();
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        this.collections.set(collectionName, db);
        observer.complete();
      };

      request.onerror = (event: any) => {
        observer.error(`Error upgrading collection ${collectionName}: ${event.target.error}`);
      };
    });
  }

  private createObjectStore(db: IDBDatabase, storeName: string, schema: Map<string, any>) {
    if (!db.objectStoreNames.contains(storeName)) {
      const keyPath = schema.get('keyPath') || 'id';
      db.createObjectStore(storeName, { keyPath, autoIncrement: true });
    }
  }
}
