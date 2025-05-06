import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import accountsRoutes from './routes/accounts';
import consentsRoutes from './routes/consents';
import { getBalances } from './controllers/balances';
import { getTransactions } from './controllers/transactions';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
app.use('/account-access-consents', consentsRoutes);
app.use('/accounts', accountsRoutes);
app.get('/balances', getBalances);
app.get('/transactions', getTransactions);

// Root endpoint with API information
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Tyk Bank - Open Banking Mock Implementation - UK Account Information API',
    version: '1.0.0',
    description: 'Mock implementation of the UK Open Banking Account Information API',
    endpoints: [
      '/account-access-consents',
      '/accounts',
      '/accounts/{accountId}',
      '/accounts/{accountId}/balances',
      '/accounts/{accountId}/transactions',
      '/balances',
      '/transactions'
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
app.listen(PORT, () => {
  console.log(`Tyk Bank Open Banking - UK Account Information API running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});

export default app;