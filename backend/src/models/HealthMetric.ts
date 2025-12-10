import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStrengthTraining {
  exercise?: 'squat' | 'bench';
  type?: 'oneRepMax' | 'weightReps';
  oneRepMax?: number;
  weight?: number;
  reps?: number;
}

export interface ICholesterol {
  total?: number;
  hdl?: number;
}

export interface ISleep {
  duration?: number;
  efficiency?: number;
  rem?: number;
  deep?: number;
}

export interface IPercentiles {
  cardioFitness?: number;
  strength?: number;
  bloodSugar?: number;
  cholesterol?: number;
  sleep?: number;
}

export interface IHealthMetric extends Document {
  userId: Types.ObjectId;
  dateOfBirth: string;
  gender?: string;
  weight: number;

  // Fitness Metrics
  cardioFitness?: number;
  heartRate?: number;

  // Strength Training
  strengthTraining?: IStrengthTraining;

  // Health Metrics
  bloodSugar?: number;
  cholesterol?: ICholesterol;
  sleep?: ISleep;

  // Calculated Fields
  percentiles?: IPercentiles;
  calculatedValues?: any;
  overallHealthRisk?: any;

  createdAt: Date;
  updatedAt: Date;
}

const healthMetricSchema = new Schema<IHealthMetric>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Personal Information
    dateOfBirth: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    gender: {
      type: String,
      required: true,
    },

    // Fitness Metrics
    cardioFitness: {
      type: Number,
      min: 0,
    },

    heartRate: {
      type: Number,
      min: 0,
    },

    // Strength Training
    strengthTraining: {
      exercise: {
        type: String,
        enum: ['squat', 'bench'],
      },
      type: {
        type: String,
        enum: ['oneRepMax', 'weightReps'],
      },
      oneRepMax: {
        type: Number,
        min: 0,
      },
      weight: {
        type: Number,
        min: 0,
      },
      reps: {
        type: Number,
        min: 1,
      },
    },

    // Health Metrics
    bloodSugar: {
      type: Number, // HbA1c percentage
      min: 3.5,
      max: 70,
    },
    cholesterol: {
      total: {
        type: Number,
        min: 0,
      },
      hdl: {
        type: Number,
        min: 0,
      },
    },

    sleep: {
      duration: {
        type: Number,
        min: 0,
        max: 24,
      },
      efficiency: {
        type: Number,
        min: 0,
        max: 1,
      },
      rem: {
        type: Number,
        min: 0,
        max: 1,
      },
      deep: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    // Calculated Fields
    percentiles: {
      cardioFitness: Number,
      strength: Number,
      bloodSugar: Number,
      cholesterol: Number,
      sleep: Number,
    },

    overallHealthRisk: {
      type: Schema.Types.Mixed,
    },

    calculatedValues: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IHealthMetric>('HealthMetric', healthMetricSchema);
