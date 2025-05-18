import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import subscriptionsRoutes from './routes/subscriptions';
import eventsRoutes from './routes/events';
import { initializeKafkaConsumer } from './services/kafka-consumer';
import { isEventsEnabled } from './services/kafka-producer';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003; // Using 3003 for event-subscriptions API

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
  res.status(200).json({ 
    status: 'UP', 
    version: '1.0.0',
    database: 'PostgreSQL',
    eventBroker: 'Kafka 4.0.0'
  });
});

// API routes
app.use('/event-subscriptions', subscriptionsRoutes);
app.use('/internal/events', eventsRoutes);

// Root endpoint with API information
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'Tyk Bank - Open Banking Mock Implementation - UK Event Subscriptions API',
    version: '1.0.0',
    description: 'Mock implementation of the UK Open Banking Event Subscriptions API with PostgreSQL and Kafka',
    endpoints: [
      '/event-subscriptions',
      '/event-subscriptions/{EventSubscriptionId}',
      '/internal/events/publish',
      '/internal/events/subscriptions/{eventType}'
    ],
    storage: 'PostgreSQL',
    messageBroker: 'Kafka 4.0.0'
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

// Initialize Kafka when the server starts (if events are enabled)
const initializeKafka = async () => {
  if (!isEventsEnabled()) {
    console.log('Events are disabled. Skipping Kafka initialization.');
    return;
  }
};

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tyk Bank Open Banking - UK Event Subscriptions API (PostgreSQL) running on port ${PORT}`);
    console.log(`Server URL: http://localhost:${PORT}`);
  });
}

export default app;