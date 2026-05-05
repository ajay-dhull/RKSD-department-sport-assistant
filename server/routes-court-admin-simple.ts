import express from 'express';
import type { Express, Request, Response } from 'express';

const router = express.Router();

// Simple placeholder routes - Database will be connected when Supabase is configured
// For now, return empty data to prevent server crashes

// ============================================================================
// COURTROOMS ROUTES
// ============================================================================

router.get('/courtrooms', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.get('/courtrooms/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: null });
});

router.post('/courtrooms', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.put('/courtrooms/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.delete('/courtrooms/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

// ============================================================================
// BUILDINGS ROUTES
// ============================================================================

router.get('/buildings', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/buildings', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.put('/buildings/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.delete('/buildings/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

// ============================================================================
// STAFF ROUTES
// ============================================================================

router.get('/staff', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/staff', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.put('/staff/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.delete('/staff/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

// ============================================================================
// FILES ROUTES
// ============================================================================

router.get('/files', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/files', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.put('/files/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.delete('/files/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

// ============================================================================
// BUILDING IMAGES ROUTES
// ============================================================================

router.get('/building-images', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/building-images/search', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/building-images', async (req: Request, res: Response) => {
  // For now, just return success - will implement file upload later
  res.json({ success: true, data: { ...req.body, image_url: '/uploads/placeholder.jpg' } });
});

router.put('/building-images/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.delete('/building-images/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id } });
});

// ============================================================================
// STATS ROUTE
// ============================================================================

router.get('/stats', async (req: Request, res: Response) => {
  const stats = {
    courtrooms: 0,
    buildings: 0,
    staff: 0,
    files: 0
  };
  res.json({ success: true, data: stats });
});

export function registerCourtAdminRoutes(app: Express) {
  app.use('/api/court-admin', router);
  console.log('✅ Court Admin routes registered at /api/court-admin (placeholder mode)');
}
