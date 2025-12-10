import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGoalStrengthTraining {
  exercise?: 'squat' | 'bench';
  type?: 'oneRepMax' | 'weightReps';
  oneRepMax?: number;
  weight?: number;
  reps?: number;
}

export interface IGoalSleep {
  duration?: number;
  efficiency?: number;
  rem?: number;
  deep?: number;
}

export interface IGoalPercentiles {
  cardioFitness?: number;
  strength?: number;
  bloodSugar?: number;
  cholesterol?: number;
  sleep?: number;
}

export interface IGoalCholesterol {
  total?: number;
  hdl?: number;
}

export interface IGoal extends Document {
  userId: Types.ObjectId;

  // Goal Values
  cardioFitness?: number;
  strengthTraining?: IGoalStrengthTraining;
  bloodSugar?: number;
  cholesterol?: IGoalCholesterol;
  sleep?: IGoalSleep;
  dateOfBirth?: string;
  gender?: string;
  weight?: number;
  heartRate?: number;

  // Calculated Fields
  percentiles?: IGoalPercentiles;
  overallHealthRisk?: any;
  calculatedValues?: any;

  // Goal Status
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
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

    // Goal Values
    cardioFitness: {
      type: Number,
      min: 0,
    },

    heartRate: {
      type: Number,
      min: 30,
      max: 220,
    },

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

    bloodSugar: {
      type: Number,
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

    // Goal Status
    isActive: {
      type: Boolean,
      default: true,
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

export default mongoose.model<IGoal>('Goal', goalSchema);

