import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import consentsRoutes from './routes/consents';
import paymentsRoutes from './routes/payments';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002; // Using 3002 for payment-initiation API

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.set('json spaces', 2);

// Custom middleware to add FAPI headers to responses
app.use((req: Request, res: Response, next: NextFunction) => {
  // Add x-fapi-interaction-id if provided in request or generate a new one
  const interactionId = req.header('x-fapi-interaction-id') || `tyk-${Date.now()}`;
  res.setHeader('x-fapi-interaction-id', interactionId);
  
  // Add other common FAPI headers
  res.setHeader('x-fapi-financial-id', 'TYK12345');
  
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', version: '1.0.0' });
});

// API routes
app.use('/domestic-payment-consents', consentsRoutes);
app.use('/domestic-payments', paymentsRoutes);

// Root endpoint with API information
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Tyk Bank - Open Banking Mock Implementation - UK Payment Initiation API',
    version: '1.0.0',
    description: 'Mock implementation of the UK Open Banking Payment Initiation API',
    endpoints: [
      '/domestic-payment-consents',
      '/domestic-payment-consents/{ConsentId}',
      '/domestic-payment-consents/{ConsentId}/funds-confirmation',
      '/domestic-payments',
      '/domestic-payments/{DomesticPaymentId}',
      '/domestic-payments/{DomesticPaymentId}/payment-details'
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
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tyk Bank Open Banking - UK Payment Initiation API running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
  });
}

export default app;