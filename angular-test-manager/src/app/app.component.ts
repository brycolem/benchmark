import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApplicationService } from './service/application.service';
import { CommonModule } from '@angular/common';
import { IndexDbService } from './service/index.db.service';
import { concatMap, from, timer, of, Observable } from 'rxjs';
import { tap, catchError, subscribeOn, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  providers: [
    ApplicationService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public previousCalls: any;
  public testBegin: any;
  public testEnd: any;
  public count: number = 0;
  public totalTime: string = '';

  constructor(
    public applicationService: ApplicationService,
    public indexDb: IndexDbService) {
    const performanceSchema = new Map<string, any>([
      ['keyPath', 'id'],
      ['url', { unique: false }],
      ['endStamp', { unique: false }],
      ['startStamp', { unique: false }],
      ['totalTime', { unique: false }],
    ]);
    this.indexDb.initIndexedDB('performance', performanceSchema, 1).subscribe(() => {
      console.log('DB Initialized');
    });
    setTimeout(() => {
      this.indexDb.queryAll('performance').subscribe({
        next: (calls) => {
          this.previousCalls = calls.sort((a, b) => a.totalTime - b.totalTime);
        }
      });
    }, 100);
  }

  ngOnInit() {
  }

  public startTest(): void {
    this.testBegin = new Date().getTime();
    this.count = 0;
    this.totalTime = '';
    const batchSize = 15;
    for (let i = 0; i < batchSize; i++) {
      this.userLoop();
    }
  }
  /* Python FastAPI SQLAlchemy(async)
    Average call time: 21.1298 based on: 10000 calls
    Max call time: 141
    Min call time: 13
    p96 call time: 33
    Current count: 10000 Total Time: 53.757s */
  /* Ruby Rails Puma Postgres
    Average call time: 18.2823 based on: 10000 calls
    Max call time: 87
    Min call time: 11
    p96 call time: 26
    Current count: 10000 Total Time: 1.12311666666m */
  /* Scala Pekko Slick
    Average call time: 13.875 based on: 10000 calls
    Max call time: 110
    Min call time: 8
    p96 call time: 23
    Current count: 10000 Total Time: 52.965s */
  /* Java Springboot Web Jpa
    Average call time: 12.5478 based on: 10000 calls
    Max call time: 45
    Min call time: 7
    p96 call time: 18
    Current count: 10000 Total Time: 54.373s */
  /* Java Springboot Webflux r2dbc
    Average call time: 13.4358 based on: 10000 calls
    Max call time: 54
    Min call time: 8
    p96 call time: 20
    Current count: 10000 Total Time: 52.729s */
  /* Vert.x Reactive PostgreSQL
    Average call time: 10.5967 based on: 10000 calls
    Max call time: 46
    Min call time: 6
    p96 call time: 16
    Current count: 10000 Total Time: 51.147s */
  /* Dart Dart_Frog
    Average call time: 10.9614 based on: 10000 calls
    Max call time: 55
    Min call time: 7
    p96 call time: 16
    Current count: 10000 Total Time: 50.775s */
  /* Nestjs Express TypeORM Bun
    Average call time: 13.6483 based on: 10000 calls
    Max call time: 91
    Min call time: 7
    p96 call time: 22
    Current count: 10000 Total Time: 52.487s */
  /* Nestjs Express TypeORM Node
    Average call time: 11.9593 based on: 10000 calls
    Max call time: 87
    Min call time: 7
    p96 call time: 18
    Current count: 10000 Total Time: 52.232s */
  /* Nestjs Express TypeORM Deno 2.0rc7
    Average call time: 12.1835 based on: 10000 calls
    Max call time: 74
    Min call time: 7
    p96 call time: 19
    Current count: 10000 Total Time: 51.096s */
  /* Ultimate-Express PG Promise Node
    Average call time: 10.8547 based on: 10000 calls
    Max call time: 58
    Min call time: 6
    p96 call time: 17
    Current count: 10000 Total Time: 50.918s */
  /* Go Buffalo
    Average call time: 24.9469 based on: 10000 calls
    Max call time: 90
    Min call time: 16
    p96 call time: 39
    Current count: 10000 Total Time: 54.143s */

  private userLoop(): void {
    const totalBatches = 250;

    const batches = Array.from({ length: totalBatches }, (_, i) => i + 1);

    from(batches).pipe(
      concatMap(iteration => {
        const delayTime = this.getRandomDelay();
        this.count++;

        return timer(delayTime).pipe(
          mergeMap(() => {
            console.log(`Starting iteration ${iteration} after ${delayTime} ms delay`);
            return this.applicationService.fetchApplications();
          }),
          catchError(error => {
            console.error(`Error in iteration ${iteration}:`, error);
            return of(null);
          })
        );
      })
    ).subscribe({
      complete: () => {
        this.indexDb.queryAll('performance').subscribe({
          next: (calls) => {
            this.previousCalls = calls.sort((a, b) => a.totalTime - b.totalTime);
          }
        });
        this.testEnd = new Date().getTime();
        this.totalTime = this.formatTime(this.testEnd - this.testBegin);
      }
    });
  }

  private formatTime(timeInMs: number): string {
    if (timeInMs < 1000) {
      return timeInMs + 'ms';
    }
    const seconds = timeInMs / 1000;
    if (seconds < 60) {
      return seconds + 's';
    }
    return (seconds / 60) + 'm';
  }

  private getRandomDelay(): number {
    return 1 + Math.random() * 50;
  }

  public pXXCallTime(pValue: number): number {
    if (!this.previousCalls || this.previousCalls.length === 0) {
      return 0;
    }

    const sortedTimes = this.previousCalls
      .map((call: any) => call.totalTime)
      .sort((a: number, b: number) => a - b);

    const index = Math.ceil((pValue / 100) * sortedTimes.length) - 1;

    return sortedTimes[index];
  }

  get averageCallTime(): number {
    if (!this.previousCalls || this.previousCalls.length === 0) {
      return 0;
    }
    const totalTimeSum = this.previousCalls.reduce(
      (sum: number, call: any) => sum + call.totalTime,
      0
    );
    return totalTimeSum / this.previousCalls.length;
  }

  get maxCallTime(): number {
    if (!this.previousCalls || this.previousCalls.length === 0) {
      return 0;
    }
    return this.previousCalls[this.previousCalls.length - 1].totalTime;
  }

  get minCallTime(): number {
    if (!this.previousCalls || this.previousCalls.length === 0) {
      return 0;
    }
    return this.previousCalls[0].totalTime;
  }
}
