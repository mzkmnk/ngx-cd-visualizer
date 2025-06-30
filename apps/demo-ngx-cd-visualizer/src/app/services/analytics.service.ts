import { Injectable, signal } from '@angular/core';

export interface AnalyticsData {
  date: string;
  visitors: number;
  pageViews: number;
  sales: number;
  revenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private _data = signal<AnalyticsData[]>([]);
  private _isLoading = signal(false);
  private _lastUpdate = signal<Date | null>(null);

  readonly data = this._data.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastUpdate = this._lastUpdate.asReadonly();

  constructor() {
    this.generateSampleData();
  }

  refreshData(): void {
    this._isLoading.set(true);
    
    // Simulate API call delay
    setTimeout(() => {
      this.generateSampleData();
      this._isLoading.set(false);
      this._lastUpdate.set(new Date());
    }, 1500);
  }

  private generateSampleData(): void {
    const today = new Date();
    const data: AnalyticsData[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 1000) + 500,
        pageViews: Math.floor(Math.random() * 5000) + 2000,
        sales: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 10000) + 5000
      });
    }

    this._data.set(data);
  }

  simulateRealtimeUpdate(): void {
    // Simulate real-time data updates
    setInterval(() => {
      const currentData = this._data();
      if (currentData.length > 0) {
        const today = currentData[currentData.length - 1];
        const updatedToday = {
          ...today,
          visitors: today.visitors + Math.floor(Math.random() * 10),
          pageViews: today.pageViews + Math.floor(Math.random() * 50),
          sales: today.sales + (Math.random() > 0.8 ? 1 : 0),
          revenue: today.revenue + Math.floor(Math.random() * 500)
        };

        this._data.update(data => [
          ...data.slice(0, -1),
          updatedToday
        ]);
      }
    }, 3000);
  }
}