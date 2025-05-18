/**
 * Client-side authentication utilities
 * These functions are used to handle the DPoP authentication flow from the client side
 */

/**
 * Start the authorization flow using PAR (Pushed Authorization Request)
 * This is the recommended approach for FAPI 2.0
 */
export async function startAuthorizationWithPar(options: {
  scope?: string;
  redirectUri?: string;
}) {
  try {
    // Create PAR request
    const response = await fetch('/api/as/par', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: options.scope || 'openid profile',
        redirectUri: options.redirectUri || window.location.origin + '/callback',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create pushed authorization request');
    }

    // Get authorization URL from PAR response
    const { authorizationUrl } = await response.json();

    // Redirect to authorization server
    window.location.href = authorizationUrl;
  } catch (error) {
    console.error('Authorization error:', error);
    throw error;
  }
}

/**
 * Start the authorization flow directly (without PAR)
 * This is a fallback approach if PAR is not supported
 */
export async function startAuthorization(options: {
  scope?: string;
  redirectUri?: string;
}) {
  try {
    // Build authorization URL
    const authUrl = new URL('/api/as/authorize', window.location.origin);
    
    // Add query parameters
    if (options.scope) {
      authUrl.searchParams.append('scope', options.scope);
    }
    
    if (options.redirectUri) {
      authUrl.searchParams.append('redirect_uri', options.redirectUri);
    }
    
    // Redirect to authorization endpoint
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Authorization error:', error);
    throw error;
  }
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      return false;
    }
    
    const { isAuthenticated } = await response.json();
    return !!isAuthenticated;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
}

/**
 * Logout the user
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Make an authenticated API request
 * This function uses the session cookie for authentication
 * All token handling is done on the server side
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Make the request with credentials to include cookies
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies in the request
  });
}