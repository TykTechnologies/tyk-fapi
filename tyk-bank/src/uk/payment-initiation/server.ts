import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import consentsRoutes from './routes/consents';
import paymentsRoutes from './routes/payments';
import parRoutes from './routes/par';
import authorizationRoutes from './routes/authorization';
import db from '../../common/db/connection';
// Payment processor removed to use setTimeout approach instead

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002; // Using 3002 for payment-initiation API

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.set('json spaces', 2);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Custom middleware to add FAPI headers and disable caching for all responses
app.use((req: Request, res: Response, next: NextFunction) => {
  // Add x-fapi-interaction-id if provided in request or generate a new one
  const interactionId = req.header('x-fapi-interaction-id') || `tyk-${Date.now()}`;
  res.setHeader('x-fapi-interaction-id', interactionId);
  
  // Add other common FAPI headers
  res.setHeader('x-fapi-financial-id', 'TYK12345');
  
  // Disable caching for all responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', version: '1.0.0' });
});

// API routes
app.use('/domestic-payment-consents', consentsRoutes);
app.use('/domestic-payments', paymentsRoutes);
app.use('/as/par', parRoutes);
app.use('/as', authorizationRoutes);

// Root endpoint with API information
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Tyk Bank - Open Banking Mock Implementation - UK Payment Initiation API',
    version: '1.0.0',
    description: 'Mock implementation of the UK Open Banking Payment Initiation API',
    endpoints: [
      '/domestic-payment-consents',
      '/domestic-payment-consents/{ConsentId}',
      '/domestic-payment-consents/{ConsentId}/authorize',
      '/domestic-payment-consents/{ConsentId}/funds-confirmation',
      '/domestic-payments',
      '/domestic-payments/{DomesticPaymentId}',
      '/domestic-payments/{DomesticPaymentId}/payment-details',
      '/as/par',
      '/as/authorize'
    ]
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    ErrorCode: 'InternalServerError',
    ErrorMessage: 'An unexpected error occurred'
  });
});

// Handle 404 routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ErrorCode: 'ResourceNotFound',
    ErrorMessage: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
let server: any;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Tyk Bank Open Banking - UK Payment Initiation API running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
    
    // Payment processor removed to use setTimeout approach instead
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    
    // Payment processor removed to use setTimeout approach instead
    
    server.close(async () => {
      console.log('HTTP server closed');
      
      // Close database connection
      try {
        await db.closePool();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
      
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    
    // Payment processor removed to use setTimeout approach instead
    
    server.close(async () => {
      console.log('HTTP server closed');
      
      // Close database connection
      try {
        await db.closePool();
        console.log('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
      
      process.exit(0);
    });
  });
}

export default app;