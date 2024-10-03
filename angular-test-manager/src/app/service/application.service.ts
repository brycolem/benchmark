import { computed, Injectable, signal } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Application } from '../model/application.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IndexDbService } from './index.db.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public applicationsSignal = signal<Application[]>([]);
  private baseUrl = window.location.origin;

  constructor(
    private http: HttpClient,
    private indexDb: IndexDbService) {
    let performanceSchema = new Map<string, any>([
      ['keyPath', 'id'],
      ['url', { unique: false }],
      ['endStamp', { unique: false }],
      ['startStamp', { unique: false }],
      ['totalTime', { unique: false }],
    ]);
    this.indexDb.initIndexedDB('performance', performanceSchema, 1).subscribe();
  }

  fetchApplications(): Observable<void> {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return new Observable<void>((observer) => {
      let url = '/api/application?t=' + new Date().getTime();
      this.http.get<Application[]>(url, { headers })
        .pipe(
          catchError((error) => {
            console.error('Error fetching applications:', error);
            return of([]);
          })
        )
        .subscribe((data: Application[]) => {
          this.applicationsSignal.set(data);
          const resourceEntries = performance.getEntriesByName(this.baseUrl + url);
          if (resourceEntries.length) {
            const resourceTiming = resourceEntries[0] as PerformanceResourceTiming;
            const timingInfo = {
              url: url,
              startTime: resourceTiming?.startTime,
              responseStart: resourceTiming?.responseStart,
              responseEnd: resourceTiming?.responseEnd,
              totalTime: resourceTiming?.responseEnd - resourceTiming?.startTime
            };

            this.indexDb.create('performance', timingInfo).subscribe({
              complete: () => { performance.clearResourceTimings(); }
            });
          } else {
            console.warn('Performance timing data not found for: ', url);
          }

          observer.complete();
        });
    });
  }

  get applications() {
    return computed(() => this.applicationsSignal());
  }
}
