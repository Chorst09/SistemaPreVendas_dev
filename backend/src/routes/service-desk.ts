import express from 'express';
import { ServiceDeskDimensionSchema } from '../shared/schemas';
import { calculateErlangC } from '../shared/utils';

const router = express.Router();

// POST /api/service-desk/calculate
router.post('/calculate', (req, res) => {
  try {
    const data = ServiceDeskDimensionSchema.parse(req.body);
    
    const erlangC = calculateErlangC(
      data.callsPerHour,
      data.averageHandleTime,
      data.agents
    );

    res.json({
      success: true,
      data: {
        ...data,
        erlangC,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/service-desk/dimensions
router.get('/dimensions', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date().toISOString(),
  });
});

export default router;
