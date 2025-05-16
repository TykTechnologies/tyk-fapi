/**
 * Validates that required environment variables are set
 * and logs warnings for any that are missing
 */

// Function to validate environment variables
export function validateEnvironmentVariables(additionalVars: string[] = []) {
  const requiredVars = [
    'ACCOUNT_INFORMATION_API_URL',
    'PAYMENT_INITIATION_API_URL',
    'AUTHORIZATION_SERVER_URL',
    ...additionalVars
  ];
  
  const missingVars: string[] = [];
  
  // Check each required variable
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  // Log warnings for any missing variables
  if (missingVars.length > 0) {
    console.warn('⚠️ WARNING: Missing environment variables:');
    missingVars.forEach(varName => {
      console.warn(`  - ${varName}`);
    });
    console.warn('This may cause the application to behave incorrectly.');
  } else {
    console.log('✅ All required environment variables are set.');
  }
  
  // Log the current values for debugging
  console.log('Current environment variable values:');
  console.log(`- ACCOUNT_INFORMATION_API_URL: ${process.env.ACCOUNT_INFORMATION_API_URL || '(not set)'}`);
  console.log(`- PAYMENT_INITIATION_API_URL: ${process.env.PAYMENT_INITIATION_API_URL || '(not set)'}`);
  console.log(`- AUTHORIZATION_SERVER_URL: ${process.env.AUTHORIZATION_SERVER_URL || '(not set)'}`);
  
  // Log additional variables if provided
  additionalVars.forEach(varName => {
    console.log(`- ${varName}: ${process.env[varName] || '(not set)'}`);
  });
  
  return missingVars.length === 0;
}