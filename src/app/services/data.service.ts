import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly CURRENT_STATS_KEY = 'healthAppCurrentStats';
  private readonly GOAL_STATS_KEY = 'healthAppGoalStats';

  // Current stats methods
  setCurrentStats(data: any) {
    console.log('Current stats stored in service:', data);
    try {
      localStorage.setItem(this.CURRENT_STATS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving current stats to localStorage:', error);
    }
  }

  getCurrentStats() {
    try {
      const storedData = localStorage.getItem(this.CURRENT_STATS_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error reading current stats from localStorage:', error);
    }
    return null;
  }

  // Goal stats methods
  setGoalStats(data: any) {
    console.log('Goal stats stored in service:', data);
    try {
      localStorage.setItem(this.GOAL_STATS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving goal stats to localStorage:', error);
    }
  }

  getGoalStats() {
    try {
      const storedData = localStorage.getItem(this.GOAL_STATS_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('Error reading goal stats from localStorage:', error);
    }
    return null;
  }

  hasCurrentStats(): boolean {
    return localStorage.getItem(this.CURRENT_STATS_KEY) !== null;
  }

  hasGoalStats(): boolean {
    return localStorage.getItem(this.GOAL_STATS_KEY) !== null;
  }

  clearAllStats() {
    localStorage.removeItem(this.CURRENT_STATS_KEY);
    localStorage.removeItem(this.GOAL_STATS_KEY);
  }

  clearCurrentStats() {
    localStorage.removeItem(this.CURRENT_STATS_KEY);
  }

  clearGoalStats() {
    localStorage.removeItem(this.GOAL_STATS_KEY);
  }
}
