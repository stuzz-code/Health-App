import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import HealthMetric from '../models/HealthMetric';
import { authenticateToken } from '../middleware/auth';
import { calculatePercentiles } from '../services/percentileService';
import { calculateHealthRisk } from '../services/healthRiskService';
import { calculateAgeFromDOB } from '../services/percentileService';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

interface SubmitStatsRequest extends AuthenticatedRequest {
  body: {
    dateOfBirth: string;
    gender: string;
    weight: number;
    cardioFitness?: number;
    heartRate?: number;
    bloodSugar?: number;
    cholesterol?: {
      total?: number;
      hdl?: number;
    };
    sleep?: {
      duration?: number;
      efficiency?: number;
      rem?: number;
      deep?: number;
    };
    strengthTraining?: any;
  };
}

interface PercentilesRequest extends Request {
  query: {
    dateOfBirth: string;
    gender: string;
  };
}

// Submit health metrics
router.post(
  '/submit-stats',
  // authenticateToken,
  [
    body('dateOfBirth').isString(),
    body('gender').isIn(['male', 'female', 'other']),
    body('weight').isFloat({ min: 1, max: 1000 }),
    body('cardioFitness').optional().isFloat({ min: 0 }),
    body('bloodSugar').optional().isFloat({ min: 3.5, max: 70 }),
    body('cholesterol.total').optional().isFloat({ min: 0 }),
    body('cholesterol.hdl').optional().isFloat({ min: 0 }),
    body('sleep.duration').optional().isFloat({ min: 0, max: 24 }),
    body('sleep.efficiency').optional().isFloat({ min: 0, max: 1 }),
    body('sleep.rem').optional().isFloat({ min: 0, max: 1 }),
    body('sleep.deep').optional().isFloat({ min: 0, max: 1 }),
  ],
  async (req: SubmitStatsRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = 'test-user-id';
      const healthData = req.body;

      // Calculate percentiles
      const result = await calculatePercentiles(healthData);
      const percentiles = result.percentiles;
      const calculatedValues = result.calculatedValues;

      // Calculate overall health risk
      const overallHealthRisk = calculateHealthRisk(percentiles);

      // Create or update health metric
      const healthMetric = await HealthMetric.findOneAndUpdate(
        { userId },
        {
          ...healthData,
          percentiles,
          overallHealthRisk,
        },
        { upsert: true, new: true }
      );

      res.json({
        message: 'Health metrics submitted successfully',
        data: healthMetric,
        percentiles,
        overallHealthRisk,
      });
    } catch (error) {
      console.error('Submit stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get current health metrics
router.get(
  '/current-stats',
  //authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = 'test-user-id';
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const healthMetric = await HealthMetric.findOne({ userId });

      if (!healthMetric) {
        res.status(404).json({ error: 'No health metrics found' });
        return;
      }

      res.json({
        message: 'Health metrics retrieved successfully',
        data: healthMetric,
        percentiles: healthMetric.percentiles,
        overallHealthRisk: healthMetric.overallHealthRisk,
      });
    } catch (error) {
      console.error('Get current stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get percentiles for specific demographics
router.get(
  '/percentiles',
  [body('dateOfBirth').isString(), body('gender').isIn(['male', 'female', 'other'])],
  async (req: PercentilesRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { dateOfBirth, gender } = req.query;

      const percentiles = await calculatePercentiles({ dateOfBirth, gender });

      res.json({ percentiles });
    } catch (error) {
      console.error('Get percentiles error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// endpoint for processing stats data
router.post(
  '/process-stats',
  [
    body('dateOfBirth').isString(),
    body('weight').isFloat({ min: 1, max: 1000 }),
    body('cardioFitness').optional().isFloat({ min: 0 }),
    body('bloodSugar').optional().isFloat({ min: 3.5, max: 70 }),
    body('cholesterol.total').optional().isFloat({ min: 0 }),
    body('cholesterol.hdl').optional().isFloat({ min: 0 }),
    body('sleep.duration').optional().isFloat({ min: 0, max: 24 }),
    body('sleep.efficiency').optional().isFloat({ min: 0, max: 1 }),
    body('sleep.rem').optional().isFloat({ min: 0, max: 1 }),
    body('sleep.deep').optional().isFloat({ min: 0, max: 1 }),
    body('strengthTraining').optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const healthData = req.body;

      if (healthData.dateOfBirth) {
        healthData.age = calculateAgeFromDOB(healthData.dateOfBirth);
      }

      console.log('Processing stats data:', healthData);

      // Calculate percentiles
      const result = await calculatePercentiles(healthData);
      const percentiles = result.percentiles;
      const calculatedValues = result.calculatedValues;

      // Calculate overall health risk
      const overallHealthRisk = calculateHealthRisk(percentiles);

      // Save or update in database
      const healthMetric = await HealthMetric.findOneAndUpdate(
        { userId: 'test-user-id' },
        {
          // Personal info
          dateOfBirth: healthData.dateOfBirth,
          gender: healthData.gender,
          weight: healthData.weight,

          // Fitness metrics
          cardioFitness: healthData.cardioFitness,
          heartRate: healthData.heartRate,

          // Strength training
          strengthTraining: healthData.strengthTraining,

          // Health metrics
          bloodSugar: healthData.bloodSugar,
          cholesterol: healthData.cholesterol,
          sleep: healthData.sleep,

          // Calculated fields
          percentiles: percentiles,
          calculatedValues: calculatedValues,
          overallHealthRisk: overallHealthRisk,
        },
        {
          upsert: true,
          new: true,
        }
      );

      // Convert cardio fitness from MM:SS format to seconds
      if (typeof healthData.cardioFitness === 'string' && healthData.cardioFitness.includes(':')) {
        const [minutes, seconds] = healthData.cardioFitness.split(':').map(Number);
        calculatedValues.cardioFitness = minutes * 60 + seconds;
      }
      if (healthData.cardioFitness) {
        calculatedValues.cardioFitness = healthData.cardioFitness;
      }

      res.json({
        message: 'Stats processed successfully',
        ...healthData,
        percentiles,
        calculatedValues,
        overallHealthRisk,
      });
    } catch (error) {
      console.error('Process stats error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Server error', details: errorMessage });
    }
  }
);

// Test route: Get all health metrics from database
router.get('/all-stats', async (req: Request, res: Response) => {
  try {
    const allMetrics = await HealthMetric.find({});
    res.json({
      message: 'All health metrics retrieved',
      count: allMetrics.length,
      data: allMetrics,
    });
  } catch (error) {
    console.error('Get all stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
