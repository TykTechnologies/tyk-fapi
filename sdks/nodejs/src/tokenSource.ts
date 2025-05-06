/**
 * TokenSource implementation for the Tyk FAPI SDK.
 */

import { Token } from './types';
import { parseToken } from './utils';

/**
 * A source of OAuth 2.0 tokens that automatically refreshes when needed.
 */
export class TokenSource {
  /**
   * The Client instance to use for token acquisition.
   */
  private client: any; // Avoid circular import
  
  /**
   * The current token.
   */
  private currentToken: Token | null = null;
  
  /**
   * Initialize the token source.
   * 
   * @param client - The Client instance to use for token acquisition.
   */
  constructor(client: any) {
    this.client = client;
  }
  
  /**
   * Get a valid token, refreshing if necessary.
   * 
   * @returns A Promise that resolves to a valid Token object.
   * @throws Error if token acquisition fails.
   */
  public async getToken(): Promise<Token> {
    // Check if we have a valid token
    if (this.currentToken && this.isValid(this.currentToken)) {
      return this.currentToken;
    }
    
    // Get a new token
    const accessToken = await this.client.getAccessToken();
    
    // Parse the token to get the expiration time
    const claims = parseToken(accessToken);
    
    // Get the expiration time
    let expiry: number;
    if ('exp' in claims) {
      expiry = claims.exp as number;
    } else {
      // Default to 5 minutes from now
      expiry = Math.floor(Date.now() / 1000) + 300;
    }
    
    // Create a new token
    this.currentToken = {
      accessToken,
      tokenType: 'DPoP',
      expiry
    };
    
    return this.currentToken;
  }
  
  /**
   * Check if a token is still valid.
   * 
   * @param token - The token to check.
   * @returns True if the token is valid, false otherwise.
   */
  private isValid(token: Token): boolean {
    // Add a 30-second buffer to avoid using tokens that are about to expire
    return Math.floor(Date.now() / 1000) < (token.expiry - 30);
  }
}