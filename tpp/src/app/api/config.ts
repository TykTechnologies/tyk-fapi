import { validateEnvironmentVariables } from './validateEnv';

// Validate environment variables on module load
validateEnvironmentVariables();

// API Gateway URLs from environment variables
export const API_GATEWAY_URLS = {
  ACCOUNT_INFORMATION: process.env.ACCOUNT_INFORMATION_API_URL || 'http://localhost:8080/account-information',
  PAYMENT_INITIATION: process.env.PAYMENT_INITIATION_API_URL || 'http://localhost:8080/payment-initiation',
};

// Authorization server URL from environment variables
export const AUTHORIZATION_SERVER_URL = process.env.AUTHORIZATION_SERVER_URL || 'http://localhost:8081/realms/fapi-demo';
console.log('Config module loaded with AUTHORIZATION_SERVER_URL:', AUTHORIZATION_SERVER_URL);

// Keycloak endpoints
export const TOKEN_ENDPOINT = `${AUTHORIZATION_SERVER_URL}/protocol/openid-connect/token`;
export const PAR_ENDPOINT = `${AUTHORIZATION_SERVER_URL}/protocol/openid-connect/ext/par/request`;
export const AUTHORIZATION_ENDPOINT = `${AUTHORIZATION_SERVER_URL}/protocol/openid-connect/auth`;

// Log the configuration
console.log('API Configuration:');
console.log('- API_GATEWAY_URLS.ACCOUNT_INFORMATION:', API_GATEWAY_URLS.ACCOUNT_INFORMATION);
console.log('- API_GATEWAY_URLS.PAYMENT_INITIATION:', API_GATEWAY_URLS.PAYMENT_INITIATION);
console.log('- AUTHORIZATION_SERVER_URL:', AUTHORIZATION_SERVER_URL);