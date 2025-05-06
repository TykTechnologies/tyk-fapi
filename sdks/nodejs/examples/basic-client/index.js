/**
 * Basic example of using the Tyk FAPI Node.js SDK.
 */

require('dotenv').config();
const { Client } = require('tyk-fapi');

/**
 * Get an environment variable or return a default value.
 * 
 * @param {string} key - The environment variable key.
 * @param {string} defaultValue - The default value.
 * @returns {string} The environment variable value or the default value.
 */
function getEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

/**
 * Main function.
 */
async function main() {
  try {
    // Get configuration from environment variables
    const clientId = getEnv('CLIENT_ID', 'my-tpp');
    const keycloakUrl = getEnv('KEYCLOAK_URL', 'http://localhost:8081');
    const tykGatewayUrl = getEnv('TYK_GATEWAY_URL', 'http://localhost:8080');
    const jwksServerPort = parseInt(getEnv('JWKS_SERVER_PORT', '8082'), 10);

    // Create a new FAPI client
    console.log('Creating FAPI 2.0 client...');
    const fapiClient = await Client.create(
      clientId,
      keycloakUrl,
      tykGatewayUrl,
      {
        jwksServerPort,
        realmName: 'fapi-demo'
      }
    );

    console.log(`JWKS URL: ${fapiClient.jwksUrl}`);
    console.log('FAPI 2.0 Client created successfully');
    console.log(`Client ID: ${fapiClient.clientId}`);
    console.log(`Key ID (kid): ${fapiClient.kid}`);
    console.log(`JWK Thumbprint (jkt): ${fapiClient.jkt}`);

    // Export the public key to PEM file
    await fapiClient.exportPublicKeyToPEM('public_key.pem');
    console.log('Public key exported to public_key.pem');
    console.log();

    // Get an access token
    console.log('Getting access token...');
    const token = await fapiClient.tokenSource.getToken();
    console.log('Access token obtained successfully');

    // Parse the token to display some information
    const { parseToken } = require('tyk-fapi');
    const claims = parseToken(token.accessToken);

    console.log('Token claims:');
    // Log all claims in the token
    console.log('All token claims:');
    for (const [key, value] of Object.entries(claims)) {
      console.log(`  ${key}: ${value}`);
    }

    // Check specifically for audience claim
    if ('aud' in claims) {
      console.log(`  Audience claim found: ${claims.aud} (type: ${typeof claims.aud})`);
    } else {
      console.log('  WARNING: No audience (aud) claim found in the token!');
    }

    // Check for azp claim as an alternative
    if ('azp' in claims) {
      console.log(`  Authorized party (azp) claim found: ${claims.azp} (type: ${typeof claims.azp})`);
    }

    // Make an API call to the payments endpoint
    console.log('\nMaking API call to /payments/get...');

    // Get the HTTP client that automatically adds DPoP proofs
    const httpClient = fapiClient.client();

    // Make a GET request
    const resp = await httpClient.get(`${tykGatewayUrl}/payments/anything`);
    
    // Read the response
    console.log(`API Response: ${JSON.stringify(resp.data)}`);

    // Example of a POST request
    console.log('\nMaking POST API call to /payments/create...');

    // Create a request body
    const requestBody = { amount: 100, currency: 'USD' };

    // Make a POST request
    const postResp = await httpClient.post(
      `${tykGatewayUrl}/payments/anything`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Read the response
    console.log(`API Response: ${JSON.stringify(postResp.data)}`);

    // Clean up
    await fapiClient.stopJWKSServer();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();