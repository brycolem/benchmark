import { TestBed } from '@angular/core/testing';
import { IndexDbService } from './index.db.service';

describe('IndexDbService', () => {
  let service: IndexDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexDbService);
  });

  describe('IndexDbService', () => {
    let schema: Map<string, any>;

    beforeEach((done: jest.DoneCallback) => {
      schema = new Map();
      schema.set('keyPath', 'id');
      schema.set('title', 'title');
      schema.set('count', 'count');

      service.initIndexedDB('test', schema).subscribe({
        complete: () => done()
      });
    });

    it('should create IndexedDB collection "test" with schema', (done: jest.DoneCallback) => {
      service.queryAll('test').subscribe({
        next: (data) => {
          expect(data).toBeTruthy();
          expect(Array.isArray(data)).toBe(true);
          done();
        },
        error: (err) => {
          done('Should not throw an error: ' + err);
        }
      });
    });

    it('should create a record with an auto-incremented ID', (done: jest.DoneCallback) => {
      service.create('test', { title: 'New Record', count: 10 }).subscribe({
        next: () => {
          service.queryAll('test').subscribe({
            next: (records) => {
              expect(records.length).toBeGreaterThan(0);
              expect(records[0].title).toBe('New Record');
              expect(records[0].count).toBe(10);
              expect(records[0].id).toBeDefined();
              done();
            },
            error: (err) => {
              done('Should not throw an error: ' + err);
            }
          });
        },
        error: (err) => {
          done('Error creating record: ' + err);
        }
      });
    });

    it('should save a new record with an auto-incremented ID', (done: jest.DoneCallback) => {
      service.save('test', null, { title: 'New Record', count: 10 }).subscribe({
        next: (key) => {
          service.query('test', key).subscribe({
            next: (record) => {
              expect(record).toBeTruthy();
              expect(record.title).toBe('New Record');
              expect(record.count).toBe(10);
              expect(record.id).toBe(key);
              done();
            },
            error: (err) => {
              done('Should not throw an error: ' + err);
            }
          });
        },
        error: (err) => {
          done('Error creating record: ' + err);
        }
      });
    });

    it('should update an existing record using save method', (done: jest.DoneCallback) => {
      service.create('test', { title: 'Original Title', count: 1 }).subscribe({
        next: (id) => {
          const updatedRecord = { title: 'Updated Title', count: 2 };
          service.save('test', id, updatedRecord).subscribe({
            complete: () => {
              service.query('test', id).subscribe({
                next: (record) => {
                  expect(record).toBeTruthy();
                  expect(record.title).toBe('Updated Title');
                  expect(record.count).toBe(2);
                  expect(record.id).toBe(id);
                  done();
                },
                error: (err) => {
                  done('Error querying updated record: ' + err);
                }
              });
            },
            error: (err) => {
              done('Error saving updated record: ' + err);
            }
          });
        },
        error: (err) => {
          done('Error creating original record: ' + err);
        }
      });
    });
  });

  describe('Non-Initialized Collection ', () => {
    it('should return an error when creating a record in a non-initialized collection', (done: jest.DoneCallback) => {
      service.create('nonExistentCollection', { title: 'Test', count: 1 }).subscribe({
        next: () => {
          done('Should not create a record in a non-initialized collection.');
        },
        error: (err) => {
          expect(err).toBe('Database not initialized for this collection.');
          done();
        }
      });
    });

    it('should return an error when querying', (done: jest.DoneCallback) => {
      service.query('nonExistentCollection', 123).subscribe({
        next: () => {
          done('Should not return data for a non-existent collection.');
        },
        error: (err) => {
          expect(err).toBe('Database not initialized');
          done();
        }
      });
    });
  });

  describe('Error Handling in create Method', () => {
    let mockTransaction: any;
    let mockObjectStore: any;
    let mockRequest: any;

    beforeEach((done: jest.DoneCallback) => {
      service.initIndexedDB('test', new Map([['keyPath', 'id']])).subscribe({
        complete: () => done(),
      });
    });

    it('should trigger onerror when saving fails', (done: jest.DoneCallback) => {
      mockRequest = {
        onsuccess: jest.fn(),
        onerror: jest.fn(),
      };

      mockObjectStore = {
        add: jest.fn().mockReturnValue(mockRequest),
      };

      mockTransaction = {
        objectStore: jest.fn().mockReturnValue(mockObjectStore),
        oncomplete: jest.fn(),
        onerror: jest.fn(),
      };

      const mockDB = {
        transaction: jest.fn().mockReturnValue(mockTransaction),
      };

      service['collections'].set('test', mockDB as any);

      service.create('test', { title: 'Error Record', count: 1 }).subscribe({
        next: () => {
          done('Should not succeed when there is an error');
        },
        error: (err) => {
          expect(err).toContain('Error saving to test');
          done();
        },
      });

      mockRequest.onerror({ target: { error: 'Mock error' } });
    });
  });
});
