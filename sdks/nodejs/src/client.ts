/**
 * Client implementation for the Tyk FAPI SDK.
 */

import * as jose from 'jose';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ClientOptions, OpenIDConfiguration, TokenResponse } from './types';
import { JWKSServer } from './jwksServer';
import { TokenSource } from './tokenSource';
import { DPoPHTTPClient, createDPoPHTTPClient } from './httpClient';
import {
  loadOrGenerateKey,
  generateKid,
  computeJkt,
  publicKeyToJWK,
  exportPublicKeyToPEM
} from './utils';

/**
 * A FAPI 2.0 client with DPoP capabilities.
 */
export class Client {
  /**
   * The client ID.
   */
  public readonly clientId: string;
  
  /**
   * The client secret.
   */
  public readonly clientSecret?: string;
  
  /**
   * The authorization server URL.
   */
  public readonly authServerUrl: string;
  
  /**
   * The API server URL.
   */
  public readonly apiServerUrl: string;
  
  /**
   * The private key.
   */
  private privateKey: jose.KeyLike;
  
  /**
   * The public key.
   */
  private publicKey: jose.KeyLike;
  
  /**
   * The key ID.
   */
  public kid: string;
  
  /**
   * The JWK thumbprint.
   */
  public jkt: string;
  
  /**
   * The JWKS server.
   */
  private jwksServer: JWKSServer;
  
  /**
   * The JWKS server port.
   */
  private jwksServerPort: number;
  
  /**
   * The JWKS URL.
   */
  public jwksUrl: string;
  
  /**
   * The realm name.
   */
  public readonly realmName: string;
  
  /**
   * The token source.
   */
  public readonly tokenSource: TokenSource;
  
  /**
   * The HTTP client.
   */
  private httpClient: DPoPHTTPClient;
  
  /**
   * Initialize a FAPI client.
   * 
   * @param clientId - The client ID.
   * @param authServerUrl - The authorization server URL.
   * @param apiServerUrl - The API server URL.
   * @param options - Additional options.
   */
  private constructor(
    clientId: string,
    authServerUrl: string,
    apiServerUrl: string,
    options?: ClientOptions
  ) {
    this.clientId = clientId;
    this.clientSecret = options?.clientSecret;
    this.authServerUrl = authServerUrl;
    this.apiServerUrl = apiServerUrl;
    this.jwksServerPort = options?.jwksServerPort || 8082;
    this.realmName = options?.realmName || 'fapi-demo';
    
    // These will be set in the initialize method
    this.privateKey = null as unknown as jose.KeyLike;
    this.publicKey = null as unknown as jose.KeyLike;
    this.kid = '';
    this.jkt = '';
    this.jwksUrl = '';
    this.jwksServer = null as unknown as JWKSServer;
    
    // Create a token source
    this.tokenSource = new TokenSource(this);
    
    // Create an HTTP client
    this.httpClient = createDPoPHTTPClient(this);
  }
  
  /**
   * Create a new FAPI client.
   * 
   * @param clientId - The client ID.
   * @param authServerUrl - The authorization server URL.
   * @param apiServerUrl - The API server URL.
   * @param options - Additional options.
   * @returns A Promise that resolves to a new Client instance.
   */
  public static async create(
    clientId: string,
    authServerUrl: string,
    apiServerUrl: string,
    options?: ClientOptions
  ): Promise<Client> {
    const client = new Client(clientId, authServerUrl, apiServerUrl, options);
    await client.initialize(options);
    return client;
  }
  
  /**
   * Initialize the client.
   * 
   * @param options - Additional options.
   * @returns A Promise that resolves when initialization is complete.
   */
  private async initialize(options?: ClientOptions): Promise<void> {
    // Set up the private key
    if (options?.privateKey) {
      this.privateKey = options.privateKey;
      this.publicKey = await jose.exportPublicKey(this.privateKey);
    } else {
      this.privateKey = await loadOrGenerateKey('private_key.pem');
      this.publicKey = await jose.exportPublicKey(this.privateKey);
    }
    
    // Generate kid and jkt
    this.kid = await generateKid(this.publicKey);
    this.jkt = await computeJkt(this.publicKey);
    
    // Start the JWKS server
    this.jwksServer = new JWKSServer(this.publicKey, this.kid, this.jwksServerPort);
    await this.jwksServer.start();
    this.jwksUrl = this.jwksServer.jwksUrl;
  }
  
  /**
   * Generate a DPoP proof JWT for the given URL and method.
   * 
   * @param targetUrl - The target URL.
   * @param method - The HTTP method.
   * @returns A Promise that resolves to a signed DPoP proof JWT.
   */
  public async generateDPoPProof(targetUrl: string, method: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    // Create the JWK from the public key
    const jwk = await publicKeyToJWK(this.publicKey);
    
    // Create the JWT header
    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk
    };
    
    // Create the JWT payload
    const payload = {
      htu: targetUrl,
      htm: method,
      iat: now,
      jti: uuidv4()
    };
    
    // Sign the JWT
    return jwt.sign(payload, await jose.exportPKCS8(this.privateKey), {
      algorithm: 'ES256',
      header
    });
  }
  
  /**
   * Retrieve the OpenID configuration from the authorization server.
   * 
   * @returns A Promise that resolves to the OpenID configuration.
   * @throws Error if the configuration cannot be retrieved.
   */
  public async fetchWellKnownConfig(): Promise<OpenIDConfiguration> {
    const wellKnownUrl = `${this.authServerUrl}/realms/${this.realmName}/.well-known/openid-configuration`;
    
    try {
      const response = await axios.get<OpenIDConfiguration>(wellKnownUrl);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch well-known config: ${error}`);
    }
  }
  
  /**
   * Create a signed JWT client assertion.
   * 
   * @param tokenEndpoint - The token endpoint URL.
   * @returns A Promise that resolves to a signed JWT client assertion.
   */
  public async generateClientAssertion(tokenEndpoint: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    // Create the JWK from the public key
    const jwk = await publicKeyToJWK(this.publicKey);
    
    // Create the JWT header
    const header = {
      typ: 'JWT',
      alg: 'ES256',
      jwk
    };
    
    // Create the JWT payload
    const payload = {
      iss: this.clientId,
      sub: this.clientId,
      aud: tokenEndpoint,
      iat: now,
      exp: now + 300, // 5 minutes
      jti: `${now}-client-assertion`
    };
    
    // Sign the JWT
    return jwt.sign(payload, await jose.exportPKCS8(this.privateKey), {
      algorithm: 'ES256',
      header
    });
  }
  
  /**
   * Obtain a DPoP-bound access token from the authorization server.
   * 
   * @returns A Promise that resolves to an access token string.
   * @throws Error if token acquisition fails.
   */
  public async getAccessToken(): Promise<string> {
    // Fetch the well-known configuration to get the token endpoint
    const config = await this.fetchWellKnownConfig();
    
    const tokenEndpoint = config.token_endpoint;
    if (!tokenEndpoint) {
      throw new Error('token_endpoint not found in well-known config');
    }
    
    // Generate client assertion
    const clientAssertion = await this.generateClientAssertion(tokenEndpoint);
    
    // Generate DPoP proof for the token endpoint
    const dpopProof = await this.generateDPoPProof(tokenEndpoint, 'POST');
    
    // Prepare the token request
    const data = new URLSearchParams();
    data.append('grant_type', 'client_credentials');
    data.append('client_id', this.clientId);
    data.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    data.append('client_assertion', clientAssertion);
    data.append('scope', 'openid');
    data.append('jwks_uri', this.jwksUrl);
    
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'DPoP': dpopProof
    };
    
    try {
      // Send the token request
      const response = await axios.post<TokenResponse>(
        tokenEndpoint,
        data,
        { headers }
      );
      
      const accessToken = response.data.access_token;
      if (!accessToken) {
        throw new Error('access_token not found in response');
      }
      
      return accessToken;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Token request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Token request failed: ${error}`);
    }
  }
  
  /**
   * Get an HTTP client that automatically adds DPoP proofs to requests.
   * 
   * @returns The DPoP HTTP client.
   */
  public client(): DPoPHTTPClient {
    return this.httpClient;
  }
  
  /**
   * Stop the JWKS server.
   * 
   * @returns A Promise that resolves when the server is stopped.
   */
  public async stopJWKSServer(): Promise<void> {
    if (this.jwksServer) {
      await this.jwksServer.stop();
    }
  }
  
  /**
   * Export the client's public key in PEM format.
   * 
   * @param filePath - The path to write the public key to.
   * @returns A Promise that resolves when the key is exported.
   */
  public async exportPublicKeyToPEM(filePath: string): Promise<void> {
    await exportPublicKeyToPEM(this.privateKey, filePath);
  }
}