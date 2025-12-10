import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StatEntryComponent } from '../stats/stat-entry/stat-entry.component';
import { DataService } from '../services/data.service';
import { HttpClient, provideHttpClient } from '@angular/common/http';

interface HealthMetric {
  name: string;
  currentValue: number;
  percentile: number;
  unit: string;
  goalValue?: number;
  displayValue?: string;
  totalCholesterol?: number;
  hdlCholesterol?: number;
  sleepDuration?: number;
  sleepEfficiency?: number;
  sleepRem?: number;
  sleepDeep?: number;
}

interface GoalMetric {
  name: string;
  goalValue: number;
  progress: number;
  unit: string;
  displayValue?: string;
  totalCholesterol?: number;
  hdlCholesterol?: number;
  sleepDuration?: number;
  sleepEfficiency?: number;
  sleepRem?: number;
  sleepDeep?: number;
}

@Component({
  selector: 'app-goals',
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true,
})
export class GoalsComponent implements OnInit {
  currentStats: HealthMetric[] = [];
  goalStats: GoalMetric[] = [];
  statData: any = null;
  goalData: any = null;
  overallHealthScore: number = 0;
  overallRiskPercentage: number = 0;
  goalHealthScore: number = 0;
  goalRiskPercentage: number = 0;
  sleepExpanded: boolean = false;
  goalSleepExpanded: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dataService: DataService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadFromDatabase();
  }

  toggleSleepExpansion() {
    this.sleepExpanded = !this.sleepExpanded;
  }

  toggleGoalSleepExpansion() {
    this.goalSleepExpanded = !this.goalSleepExpanded;
  }

  loadSampleData() {
    this.statData = {
      gender: 'male',
      age: 30,
      weight: 180,
      cardioFitness: '7:30',
      strength: 'squat',
      strengthType: 'oneRepMax',
      oneRepMax: 225,
      bloodSugar: 6,
      totalCholesterol: 200,
      hdlCholesterol: 50,
      sleep: 7.5,
    };
    console.log('Using sample data for testing:', this.statData);
    this.loadCurrentStats();
  }

  loadFromDatabase() {
    this.http.get<any>('http://localhost:3000/api/health/current-stats').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.statData = response.data;
          this.dataService.setCurrentStats(response.data);
          this.loadCurrentStats();
          console.log('Loaded current stats from database');
        }
      },
      error: (error) => {
        console.log('No data in database, checking localStorage');
        this.loadFromLocalStorage();
      },
    });

    // Load Goals from Database
    this.http.get<any>('http://localhost:3000/api/goals/current-goals').subscribe({
      next: (response) => {
        if (response && response.data) {
          this.goalData = response.data;
          this.dataService.setGoalStats(response.data);
          this.loadGoalStats();
          console.log('Loaded goals from database');
        }
      },
      error: (error) => {
        console.log('No goals in database, checking localStorage');
        const savedGoals = this.dataService.getGoalStats();
        if (savedGoals) {
          this.goalData = savedGoals;
          this.loadGoalStats();
        }
      },
    });
  }

  // Fallback method to load stats and goals locally
  loadFromLocalStorage() {
    this.statData = this.dataService.getCurrentStats();
    this.goalData = this.dataService.getGoalStats();

    if (this.statData) {
      this.loadCurrentStats();
      console.log('Loaded current stats from localStorage');
    }

    if (this.goalData) {
      this.loadGoalStats();
      console.log('Loaded goals from localStorage');
    }
  }

  loadCurrentStats() {
    if (!this.statData) return;

    this.overallHealthScore = this.statData.overallHealthRisk?.score || 0;
    this.overallRiskPercentage = this.statData.overallHealthRisk?.averageRisk || 0;

    this.currentStats = [
      {
        name: 'Cardio Fitness (1 mile time)',
        currentValue: this.statData.calculatedValues?.cardioFitness || 0,
        displayValue: this.statData.calculatedValues?.cardioFitness
          ? this.formatCardioTime(this.statData.calculatedValues.cardioFitness)
          : '0:00',
        percentile: this.statData.percentiles?.cardioFitness || 0,
        unit: 'seconds',
      },
      {
        name: `Strength Training (${this.statData.strengthTraining?.exercise || '1 rep max'})`,
        currentValue: this.statData.calculatedValues?.oneRepMax || 0,

        displayValue:
          this.statData.strengthTraining?.type === 'oneRepMax'
            ? `${this.statData.calculatedValues?.oneRepMax || 0} lbs (1RM)`
            : `${this.statData.strengthTraining?.weight || 0} lbs x ${
                this.statData.strengthTraining?.reps || 0
              } reps (Est. 1RM: ${this.statData.calculatedValues?.oneRepMax || 0} lbs)`,
        percentile: this.statData.percentiles?.strength || 0,
        unit: 'lbs',
      },
      {
        name: 'Blood Sugar (hbA1c)',
        currentValue: this.statData.bloodSugar || 0,
        percentile: this.statData.percentiles?.bloodSugar || 0,
        unit: '%',
      },
      {
        name: 'Cholesterol',
        currentValue: this.statData.cholesterol?.total || 0,
        percentile: this.statData.percentiles?.cholesterol || 0,
        unit: 'mg/dL',
        totalCholesterol: this.statData.cholesterol?.total || 0,
        hdlCholesterol: this.statData.cholesterol?.hdl || 0,
      },
      {
        name: 'Sleep',
        currentValue: this.statData.calculatedValues?.sleepScore || 0,
        displayValue: `Score: ${this.statData.calculatedValues?.sleepScore?.toFixed(1) || 0}`,
        percentile: this.statData.percentiles?.sleep || 0,
        unit: 'score',
        sleepDuration: this.statData.sleep?.duration || 0,
        sleepEfficiency: (this.statData.sleep?.efficiency || 0) * 100,
        sleepRem: (this.statData.sleep?.rem || 0) * 100,
        sleepDeep: (this.statData.sleep?.deep || 0) * 100,
      },
    ];

    console.log('Current stats loaded:', this.currentStats);
    this.loadGoalStats();
  }

  loadGoalStats() {
    const savedGoalData = this.dataService.getGoalStats();

    if (savedGoalData) {
      this.goalStats = [
        {
          name: 'Cardio Fitness Goal (1 mile time)',
          goalValue: savedGoalData?.cardioFitness,
          displayValue: savedGoalData?.cardioFitness
            ? this.formatCardioTime(savedGoalData.cardioFitness)
            : '',
          progress: savedGoalData?.percentiles?.cardioFitness || 0,
          unit: 'seconds',
        },
        {
          name: `Strength Training Goal (${
            this.statData?.strengthTraining?.exercise || '1 rep max'
          })`,
          goalValue: savedGoalData.strengthTraining?.oneRepMax,
          progress: savedGoalData.percentiles?.strength || 0,
          unit: 'lbs',
        },
        {
          name: 'Blood Sugar Goal (hbA1c)',
          goalValue: savedGoalData.bloodSugar,
          progress: savedGoalData.percentiles?.bloodSugar || 0,
          unit: '%',
        },
        {
          name: 'Cholesterol Goal',
          goalValue: 0,
          progress: savedGoalData.percentiles?.cholesterol || 0,
          unit: 'mg/dL',
          totalCholesterol: savedGoalData.cholesterol?.total || 0,
          hdlCholesterol: savedGoalData.cholesterol?.hdl || 0,
        },
        {
          name: 'Sleep Goal',
          goalValue: savedGoalData.sleep?.duration || 0,
          progress: savedGoalData.percentiles?.sleep || 0,
          unit: 'hours',
          sleepDuration: savedGoalData.sleep?.duration || 0,
          sleepEfficiency: savedGoalData.sleep?.efficiency
            ? savedGoalData.sleep.efficiency * 100
            : 0,
          sleepRem: savedGoalData.sleep?.rem ? savedGoalData.sleep.rem * 100 : 0,
          sleepDeep: savedGoalData.sleep?.deep ? savedGoalData.sleep.deep * 100 : 0,
        },
      ];
      this.goalHealthScore = savedGoalData.overallHealthRisk?.score || 0;
      this.goalRiskPercentage = savedGoalData.overallHealthRisk?.averageRisk || 0;
    } else {
      this.goalStats = [
        {
          name: 'Cardio Fitness Goal',
          goalValue: 0,
          progress: 0,
          unit: 'seconds',
        },
        {
          name: `Strength Training Goal (${this.statData?.strengthTraining?.exercise || 'bench'})`,
          goalValue: 0,
          progress: 0,
          unit: 'lbs',
        },
        {
          name: 'Blood Sugar Goal (hbA1c)',
          goalValue: 0,
          progress: 0,
          unit: '%',
        },
        {
          name: 'Cholesterol Goal',
          goalValue: 0,
          progress: 0,
          unit: 'mg/dL',
          totalCholesterol: 0,
          hdlCholesterol: 0,
        },
        {
          name: 'Sleep Goal',
          goalValue: 0,
          progress: 0,
          unit: 'hours',
        },
      ];
    }
  }

  // set wellness labels for display
  getRiskCount(riskLevel: string) {}

  getRiskPercentage(riskLevel: string) {}

  getRiskDescription(): string {
    if (this.overallHealthScore >= 66.67) return 'Wellness Peak - Sustaining Your Health';
    if (this.overallHealthScore >= 33.34) return 'Making Great Progress - Keep Moving Forward';
    return 'Starting Your Health Journey - Great Potential for Growth';
  }

  getGoalRiskDescription(): string {
    if (this.goalHealthScore >= 66.67) return 'Wellness Peak - Sustaining Your Health';
    if (this.goalHealthScore >= 33.34) return 'Making Great Progress - Keep Moving Forward';
    return 'Starting Your Health Journey - Great Potential for Growth';
  }

  updateGoalProgress(processedGoalData: any) {
    this.goalStats.forEach((goal) => {
      if (goal.name === 'Cardio Fitness Goal') {
        goal.progress = processedGoalData.percentiles?.cardioFitness || 0;
      } else if (goal.name.startsWith('Strength Training Goal')) {
        goal.progress = processedGoalData.percentiles?.strength || 0;
      } else if (goal.name === 'Blood Sugar Goal (hbA1c)') {
        goal.progress = processedGoalData.percentiles?.bloodSugar || 0;
      } else if (goal.name === 'Cholesterol Goal') {
        goal.progress = processedGoalData.percentiles?.cholesterol || 0;
      } else if (goal.name === 'Sleep Goal') {
        goal.progress = processedGoalData.percentiles?.sleep || 0;
        goal.goalValue = processedGoalData.calculatedValues?.sleepScore || 0;
      }
    });
  }

  async submitGoalChanges() {
    console.log('Goal changes submitted:', this.goalStats);

    const goalHealthData: any = {
      dateOfBirth: this.statData.dateOfBirth,
      gender: this.statData.gender,
      weight: this.statData.weight,
    };

    // Map goal stats to health data structure
    this.goalStats.forEach((goal) => {
      if (goal.name === 'Cardio Fitness Goal' || goal.name.includes('Cardio Fitness Goal')) {
        if (goal.displayValue) {
          let displayVal = goal.displayValue;
          if (!displayVal.includes(':') && displayVal.length >= 3) {
            const numStr = displayVal;
            if (numStr.length === 3) {
              displayVal = numStr.substring(0, 1) + ':' + numStr.substring(1, 3);
            } else if (numStr.length >= 4) {
              displayVal = numStr.substring(0, 2) + ':' + numStr.substring(2, 4);
            }
          }

          if (displayVal.includes(':')) {
            const [minutes, seconds] = displayVal.split(':').map(Number);
            goalHealthData.cardioFitness = minutes * 60 + seconds;
          } else if (goal.goalValue && goal.goalValue > 0) {
            goalHealthData.cardioFitness = goal.goalValue;
          }
        } else if (goal.goalValue && goal.goalValue > 0) {
          goalHealthData.cardioFitness = goal.goalValue;
        }
        goalHealthData.heartRate = this.statData.heartRate;
      } else if (goal.name.startsWith('Strength Training Goal')) {
        goalHealthData.strengthTraining = {
          ...this.statData.strengthTraining,
          type: 'oneRepMax',
          oneRepMax: goal.goalValue,
        };
      } else if (goal.name === 'Blood Sugar Goal (hbA1c)') {
        if (goal.goalValue && goal.goalValue > 0) {
          goalHealthData.bloodSugar = goal.goalValue;
        }
      } else if (goal.name === 'Cholesterol Goal') {
        if (goal.totalCholesterol && goal.hdlCholesterol) {
          goalHealthData.cholesterol = {
            total: goal.totalCholesterol,
            hdl: goal.hdlCholesterol,
          };
        }
      } else if (goal.name === 'Sleep Goal') {
        if (
          (goal.sleepDuration && goal.sleepDuration > 0) ||
          (goal.sleepEfficiency && goal.sleepEfficiency > 0) ||
          (goal.sleepRem && goal.sleepRem > 0) ||
          (goal.sleepDeep && goal.sleepDeep > 0)
        ) {
          goalHealthData.sleep = {
            duration: goal.sleepDuration || 0,
            efficiency: (goal.sleepEfficiency || 0) / 100,
            rem: (goal.sleepRem || 0) / 100,
            deep: (goal.sleepDeep || 0) / 100,
          };
        }
      }
    });

    // Clean up undefined values
    if (goalHealthData.heartRate === undefined) delete goalHealthData.heartRate;
    if (goalHealthData.sleep === undefined) delete goalHealthData.sleep;
    if (goalHealthData.bloodSugar === undefined || goalHealthData.bloodSugar === 0)
      delete goalHealthData.bloodSugar;
    if (goalHealthData.cholesterol && Object.keys(goalHealthData.cholesterol).length === 0)
      delete goalHealthData.cholesterol;

    console.log('Sending goals to backend:', goalHealthData);

    try {
      const response = await fetch('http://localhost:3000/api/goals/process-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalHealthData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend validation errors:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const processedGoalData = await response.json();
      console.log('Processed goal data from backend:', processedGoalData);

      // Store goal data
      this.dataService.setGoalStats(processedGoalData);
      this.goalData = processedGoalData;

      // Update goal stats with calculated percentiles
      this.updateGoalProgress(processedGoalData);

      // Update the Goals Health Risk Assessment
      this.goalHealthScore = processedGoalData.overallHealthRisk?.score || 0;
      this.goalRiskPercentage = processedGoalData.overallHealthRisk?.averageRisk || 0;
    } catch (error) {
      console.error('Error processing goals:', error);
    }
  }

  formatCardioTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Auto-format time input (when user clicks away)
  onTimeBlur(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length === 1) {
      value = value + ':00';
    } else if (value.length === 2) {
      value = value.substring(0, 1) + ':' + value.substring(1) + '0';
    } else if (value.length === 3) {
      value = value.substring(0, 1) + ':' + value.substring(1, 3);
    } else if (value.length >= 4) {
      value = value.substring(0, 2) + ':' + value.substring(2, 4);
    }

    event.target.value = value;
  }

  async submitMetricChanges() {
    this.currentStats.forEach((stat) => {
      if (stat.name === 'Cardio Fitness (1 mile time)' && stat.displayValue) {
        let displayVal = stat.displayValue;
        if (!displayVal.includes(':')) {
          const numStr = displayVal;
          if (numStr.length === 3) {
            displayVal = numStr.substring(0, 1) + ':' + numStr.substring(1, 3);
          } else if (numStr.length >= 4) {
            displayVal = numStr.substring(0, 2) + ':' + numStr.substring(2, 4);
          }
        }

        const [minutes, seconds] = displayVal.split(':').map(Number);
        if (!isNaN(minutes) && !isNaN(seconds)) {
          stat.currentValue = minutes * 60 + seconds;
        }
      }
    });

    const healthData: any = {
      dateOfBirth: this.statData.dateOfBirth,
      gender: this.statData.gender,
      weight: this.statData.weight,
    };

    // Map current stats back to health data structure
    this.currentStats.forEach((stat) => {
      if (stat.name === 'Cardio Fitness (1 mile time)') {
        healthData.cardioFitness = stat.currentValue;
        healthData.heartRate = this.statData.heartRate;
      } else if (stat.name.startsWith('Strength Training')) {
        healthData.strengthTraining = {
          exercise: this.statData.strengthTraining.exercise,
          type: 'oneRepMax',
          oneRepMax: stat.currentValue,
        };
        console.log('Strength training being sent:', healthData.strengthTraining);
      } else if (stat.name === 'Blood Sugar (hbA1c)') {
        if (stat.currentValue && stat.currentValue > 0) {
          healthData.bloodSugar = stat.currentValue;
        }
      } else if (stat.name === 'Cholesterol') {
        if (stat.totalCholesterol && stat.hdlCholesterol) {
          healthData.cholesterol = {
            total: stat.totalCholesterol,
            hdl: stat.hdlCholesterol,
          };
        }
      } else if (stat.name === 'Sleep') {
        if (stat.sleepDuration || stat.sleepEfficiency || stat.sleepRem || stat.sleepDeep) {
          healthData.sleep = {
            duration: stat.sleepDuration || 0,
            efficiency: (stat.sleepEfficiency || 0) / 100,
            rem: (stat.sleepRem || 0) / 100,
            deep: (stat.sleepDeep || 0) / 100,
          };
        }
      }
    });

    if (healthData.cholesterol && Object.keys(healthData.cholesterol).length === 0) {
      delete healthData.cholesterol;
    }

    console.log('Sending to backend:', healthData);

    if (healthData.heartRate === undefined) {
      delete healthData.heartRate;
    }
    if (healthData.sleep === undefined) {
      delete healthData.sleep;
    }
    if (healthData.bloodSugar === undefined || healthData.bloodSugar === 0) {
      delete healthData.bloodSugar;
    }
    if (healthData.cholesterol && Object.keys(healthData.cholesterol).length === 0) {
      delete healthData.cholesterol;
    }
    if (isNaN(healthData.cardioFitness) || healthData.cardioFitness === 0) {
      delete healthData.cardioFitness;
    }

    console.log('After cleanup:', healthData);

    try {
      // API process
      const response = await fetch('http://localhost:3000/api/health/process-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const processedData = await response.json();
      console.log('Updated data from backend:', processedData);

      this.dataService.setCurrentStats(processedData);
      this.statData = processedData;
      this.loadCurrentStats();
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }
}
