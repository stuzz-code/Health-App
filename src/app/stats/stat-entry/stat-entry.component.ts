import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-stat-entry',
  templateUrl: './stat-entry.component.html',
  styleUrls: ['./stat-entry.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
  standalone: true,
})
export class StatEntryComponent implements OnInit {
  statForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private dataService: DataService) {}

  ngOnInit() {
    this.statForm = this.fb.group({
      // Personal Information
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      weight: ['', [Validators.required, Validators.min(1), Validators.max(1000)]],

      // Fitness & Exercise
      cardioFitness: ['', [Validators.required, this.timeFormatValidator]],
      heartRate: [''],
      strength: ['', Validators.required],
      strengthType: [''],
      oneRepMax: [''],
      exerciseWeight: [''],
      reps: [''],

      // Health Metrics
      bloodSugar: ['', [Validators.min(3.5), Validators.max(70)]],
      totalCholesterol: ['', [Validators.min(100), Validators.max(500)]],
      hdlCholesterol: ['', [Validators.min(20), Validators.max(150)]],
      sleep: ['', [Validators.min(0), Validators.max(24)]],
      sleepEfficiency: ['', [Validators.min(0), Validators.max(100)]],
      sleepRem: ['', [Validators.min(0), Validators.max(100)]],
      sleepDeep: ['', [Validators.min(0), Validators.max(100)]],
    });

    // Watch for strength exercise changes
    this.statForm.get('strength')?.valueChanges.subscribe((value) => {
      this.onExerciseChange(value);
    });

    // Watch for strength type changes
    this.statForm.get('strengthType')?.valueChanges.subscribe((value) => {
      this.onStrengthTypeChange(value);
    });
  }

  // validator for MM:SS format
  timeFormatValidator(control: FormControl) {
    if (!control.value) return null;

    const timePattern = /^([0-5]?[0-9]):([0-5][0-9])$/;
    if (!timePattern.test(control.value)) {
      return { invalidTimeFormat: true };
    }

    const [minutes, seconds] = control.value.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;

    if (totalSeconds < 180 || totalSeconds > 1800) {
      return { timeOutOfRange: true };
    }

    return null;
  }

  onExerciseChange(exercise: string) {
    const strengthTypeControl = this.statForm.get('strengthType');
    const oneRepMaxControl = this.statForm.get('oneRepMax');
    const exerciseWeightControl = this.statForm.get('exerciseWeight');
    const repsControl = this.statForm.get('reps');

    if (exercise) {
      strengthTypeControl?.setValidators([Validators.required]);
    } else {
      strengthTypeControl?.clearValidators();
      strengthTypeControl?.setValue('');
    }

    // Reset dependent fields
    oneRepMaxControl?.setValue('');
    exerciseWeightControl?.setValue('');
    repsControl?.setValue('');

    strengthTypeControl?.updateValueAndValidity();
  }

  onStrengthTypeChange(type: string) {
    const oneRepMaxControl = this.statForm.get('oneRepMax');
    const exerciseWeightControl = this.statForm.get('exerciseWeight');
    const repsControl = this.statForm.get('reps');

    if (type === 'oneRepMax') {
      oneRepMaxControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(2000),
      ]);
      exerciseWeightControl?.clearValidators();
      repsControl?.clearValidators();
      exerciseWeightControl?.setValue('');
      repsControl?.setValue('');
    } else if (type === 'weightReps') {
      exerciseWeightControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(2000),
      ]);
      repsControl?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      oneRepMaxControl?.clearValidators();
      oneRepMaxControl?.setValue('');
    } else {
      oneRepMaxControl?.clearValidators();
      exerciseWeightControl?.clearValidators();
      repsControl?.clearValidators();
      oneRepMaxControl?.setValue('');
      exerciseWeightControl?.setValue('');
      repsControl?.setValue('');
    }

    oneRepMaxControl?.updateValueAndValidity();
    exerciseWeightControl?.updateValueAndValidity();
    repsControl?.updateValueAndValidity();
  }

  // Getters for template visibility
  get showStrengthTypeGroup(): boolean {
    return this.statForm.get('strength')?.value !== '';
  }

  get showOneRepMaxGroup(): boolean {
    return this.statForm.get('strengthType')?.value === 'oneRepMax';
  }

  get showWeightRepsGroup(): boolean {
    return this.statForm.get('strengthType')?.value === 'weightReps';
  }

  get showHeartRateGroup(): boolean {
    return !!this.statForm.get('cardioFitness')?.value;
  }

  async onSubmit() {
    if (this.statForm.valid) {
      const formData = this.statForm.value;

      // Convert data for backend validation
      const healthData = {
        dateOfBirth: formData.dateOfBirth,
        age: this.calculateAge(formData.dateOfBirth),
        gender: formData.gender,
        weight: Number(formData.weight),
        cardioFitness: formData.cardioFitness
          ? this.convertTimeToSeconds(formData.cardioFitness)
          : undefined,
        heartRate: formData.heartRate ? Number(formData.heartRate) : undefined,
        bloodSugar: formData.bloodSugar ? Number(formData.bloodSugar) : undefined,
        cholesterol: {
          total: formData.totalCholesterol ? Number(formData.totalCholesterol) : undefined,
          hdl: formData.hdlCholesterol ? Number(formData.hdlCholesterol) : undefined,
        },
        sleep: formData.sleep
          ? {
              duration: Number(formData.sleep),
              efficiency: formData.sleepEfficiency
                ? Number(formData.sleepEfficiency) / 100
                : undefined,
              rem: formData.sleepRem ? Number(formData.sleepRem) / 100 : undefined,
              deep: formData.sleepDeep ? Number(formData.sleepDeep) / 100 : undefined,
            }
          : undefined,
        strengthTraining: {
          exercise: formData.strength,
          type: formData.strengthType,
          oneRepMax: formData.oneRepMax ? Number(formData.oneRepMax) : undefined,
          weight: formData.exerciseWeight ? Number(formData.exerciseWeight) : undefined,
          reps: formData.reps ? Number(formData.reps) : undefined,
        },
      };

      try {
        // API process
        const response = await fetch('http://localhost:3000/api/health/process-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(healthData),
        });

        const result = await response.json();

        this.dataService.setCurrentStats(result);
        this.dataService.clearGoalStats();
        this.router.navigate(['/goals']);
      } catch (error) {
        console.error('Error calling backend:', error);
        this.dataService.setCurrentStats(healthData);
        this.router.navigate(['/goals']);
      }
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.statForm.controls).forEach((key) => {
      const control = this.statForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method check for errors
  hasError(fieldName: string): boolean {
    const field = this.statForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Helper method get error message
  getErrorMessage(fieldName: string): string {
    const field = this.statForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
      if (field.errors['invalidTimeFormat'])
        return 'Please enter time in MM:SS format (e.g., 7:35)';
      if (field.errors['timeOutOfRange']) return 'Time must be between 3:00 and 30:00';
    }
    return '';
  }

  // Helper method convert time to seconds
  convertTimeToSeconds(timeString: string): number {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  }

  // Auto-format time input for cardio
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
    this.statForm.get('cardioFitness')?.setValue(value);
  }

  // Calculate age with DOB
  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
