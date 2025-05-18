import { getPaymentsByStatus, updatePaymentStatus } from '../data/pg-payments';
import { PaymentStatus } from '../models/payment';
import { publishPaymentEvent, mapPaymentStatusToEventType } from './event-publisher';

// Define the status transitions
const statusTransitions: Record<string, PaymentStatus> = {
  [PaymentStatus.PENDING]: PaymentStatus.ACCEPTED_SETTLEMENT_IN_PROCESS,
  [PaymentStatus.ACCEPTED_SETTLEMENT_IN_PROCESS]: PaymentStatus.ACCEPTED_SETTLEMENT_COMPLETED
};

/**
 * Process payments
 * This function finds payments in specific statuses and updates them to the next status
 */
export const processPayments = async (): Promise<void> => {
  try {
    console.log('Processing payments...');
    
    // Process pending payments
    await processPaymentsWithStatus(PaymentStatus.PENDING);
    
    // Process in-process payments
    await processPaymentsWithStatus(PaymentStatus.ACCEPTED_SETTLEMENT_IN_PROCESS);
  } catch (error) {
    console.error('Error processing payments:', error);
  }
};

/**
 * Process payments with a specific status
 */
const processPaymentsWithStatus = async (status: PaymentStatus): Promise<void> => {
  try {
    // Get all payments with the specified status
    const payments = await getPaymentsByStatus(status);
    console.log(`Found ${payments.length} payments with status ${status}`);
    
    // Update each payment
    for (const payment of payments) {
      const nextStatus = statusTransitions[payment.Status];
      if (nextStatus) {
        console.log(`Updating payment ${payment.DomesticPaymentId} from ${payment.Status} to ${nextStatus}`);
        
        // Update the payment status
        const updatedPayment = await updatePaymentStatus(payment.DomesticPaymentId, nextStatus);
        
        if (updatedPayment) {
          // Publish payment status update event
          const eventType = mapPaymentStatusToEventType(nextStatus);
          if (eventType) {
            publishPaymentEvent(eventType, payment.DomesticPaymentId, {
              paymentId: payment.DomesticPaymentId,
              status: nextStatus,
              timestamp: updatedPayment.StatusUpdateDateTime
            }).catch(error => {
              console.error('Failed to publish payment status update event:', error);
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error processing payments with status ${status}:`, error);
  }
};

/**
 * Start the payment processor
 * This function starts a timer that processes payments every 5 seconds
 */
export const startPaymentProcessor = (): NodeJS.Timeout => {
  console.log('Starting payment processor...');
  
  // Process payments immediately
  processPayments().catch(error => {
    console.error('Error in initial payment processing:', error);
  });
  
  // Process payments every 5 seconds
  const interval = setInterval(() => {
    processPayments().catch(error => {
      console.error('Error in scheduled payment processing:', error);
    });
  }, 5000);
  
  console.log('Payment processor started');
  
  return interval;
};

/**
 * Stop the payment processor
 */
export const stopPaymentProcessor = (interval: NodeJS.Timeout): void => {
  console.log('Stopping payment processor...');
  clearInterval(interval);
  console.log('Payment processor stopped');
};