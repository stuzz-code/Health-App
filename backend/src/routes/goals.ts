import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Goal from '../models/Goal';
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

interface SetGoalsRequest extends AuthenticatedRequest {
  body: {
    cardioFitness?: number;
    bloodSugar?: number;
    cholesterol?: {
      total?: number;
      hdl?: number;
    };
    sleep?: number;
    strengthTraining?: any;
    targetDate?: string;
  };
}

interface UpdateGoalsRequest extends AuthenticatedRequest {
  body: {
    cardioFitness?: number;
    bloodSugar?: number;
    cholesterol?: {
      total?: number;
      hdl?: number;
    };
    sleep?: number;
    strengthTraining?: any;
  };
}

// Set goals
router.post(
  '/set-goals',
  // authenticateToken,
  [
    body('cardioFitness').optional().isFloat({ min: 0 }),
    body('bloodSugar').optional().isFloat({ min: 3.5, max: 70 }),
    body('cholesterol.total').optional().isFloat({ min: 0 }),
    body('cholesterol.hdl').optional().isFloat({ min: 0 }),
    body('sleep').optional().isFloat({ min: 0, max: 24 }),
    body('targetDate').optional().isISO8601(),
  ],
  async (req: SetGoalsRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const goalData = req.body;

      // Deactivate existing goals
      await Goal.updateMany({ userId, isActive: true }, { isActive: false });

      // Create new goal
      const goal = new Goal({
        userId,
        ...goalData,
      });

      await goal.save();

      res.status(201).json({
        message: 'Goals set successfully',
        data: goal,
      });
    } catch (error) {
      console.error('Set goals error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get current goals
router.get(
  '/current-goals',
  //authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = 'test-user-id';
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const goal = await Goal.findOne({ userId, isActive: true });

      if (!goal) {
        res.status(404).json({ error: 'No active goals found' });
        return;
      }

      res.json({
        message: 'Goals retrieved successfully',
        data: goal,
      });
    } catch (error) {
      console.error('Get current goals error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update goals
router.put(
  '/update-goals',
  // authenticateToken,
  [
    body('cardioFitness').optional().isFloat({ min: 0 }),
    body('bloodSugar').optional().isFloat({ min: 3.5, max: 70 }),
    body('cholesterol.total').optional().isFloat({ min: 0 }),
    body('cholesterol.hdl').optional().isFloat({ min: 0 }),
    body('sleep').optional().isFloat({ min: 0, max: 24 }),
  ],
  async (req: UpdateGoalsRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const updates = req.body;

      const goal = await Goal.findOneAndUpdate({ userId, isActive: true }, updates, { new: true });

      if (!goal) {
        res.status(404).json({ error: 'No active goals found' });
        return;
      }

      res.json({
        message: 'Goals updated successfully',
        data: goal,
      });
    } catch (error) {
      console.error('Update goals error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/process-goals',
  [
    // Validators for personal info
    body('dateOfBirth').isString(),
    body('gender').isIn(['male', 'female', 'other']),
    body('weight').isFloat({ min: 1, max: 1000 }),

    // Validators for goal values
    body('cardioFitness').optional().isFloat({ min: 0 }),
    body('heartRate').optional().isFloat({ min: 30, max: 220 }),
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

      const goalData = req.body;

      console.log('Processing goal data:', goalData);

      if (goalData.dateOfBirth) {
        goalData.age = calculateAgeFromDOB(goalData.dateOfBirth);
      }

      // Calculate percentiles for the goal values
      const result = await calculatePercentiles(goalData);
      const percentiles = result.percentiles;
      const calculatedValues = result.calculatedValues;

      // Calculate overall health risk for the goal
      const overallHealthRisk = calculateHealthRisk(percentiles);

      // Save or update goal in database
      const goal = await Goal.findOneAndUpdate(
        { userId: 'test-user-id' },
        {
          // Personal info
          dateOfBirth: goalData.dateOfBirth,
          gender: goalData.gender,
          weight: goalData.weight,

          // Goal values
          cardioFitness: goalData.cardioFitness,
          heartRate: goalData.heartRate,
          strengthTraining: goalData.strengthTraining,
          bloodSugar: goalData.bloodSugar,
          cholesterol: goalData.cholesterol,
          sleep: goalData.sleep,

          // Calculated fields
          percentiles: percentiles,
          calculatedValues: calculatedValues,
          overallHealthRisk: overallHealthRisk,

          isActive: true,
        },
        {
          upsert: true,
          new: true,
        }
      );

      res.json({
        message: 'Goals processed and saved successfully',
        ...goalData,
        percentiles,
        calculatedValues,
        overallHealthRisk,
      });
    } catch (error) {
      console.error('Process goals error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Server error', details: errorMessage });
    }
  }
);

export default router;
