import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironmentVariables } from '../validateEnv';

// Validate required environment variables
validateEnvironmentVariables(['EVENT_SUBSCRIPTIONS_API_URL']);

/**
 * POST /api/event-notifications
 * 
 * Endpoint to receive event notifications from the bank
 */
/**
 * POST /api/event-notifications
 *
 * Endpoint to receive event notifications from the bank
 * This endpoint is called by the bank when an event occurs
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the notification from the request body
    const notification = await req.json();
    
    // Log the notification
    console.log('Received event notification from bank:');
    console.log(JSON.stringify(notification, null, 2));
    
    // Extract event details for better logging
    const eventType = notification.events?.['urn:uk:org:openbanking:events:resource-update']?.subject?.subject_type || 'unknown';
    const resourceId = notification.events?.['urn:uk:org:openbanking:events:resource-update']?.subject?.['http://openbanking.org.uk/rid'] || 'unknown';
    const resourceType = notification.events?.['urn:uk:org:openbanking:events:resource-update']?.subject?.['http://openbanking.org.uk/rty'] || 'unknown';
    
    console.log(`Event Type: ${eventType}`);
    console.log(`Resource ID: ${resourceId}`);
    console.log(`Resource Type: ${resourceType}`);
    console.log(`Timestamp: ${new Date(notification.toe * 1000).toISOString()}`);
    
    // Return 202 Accepted
    return NextResponse.json({ message: 'Notification received' }, { status: 202 });
  } catch (error) {
    console.error('Error processing event notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}