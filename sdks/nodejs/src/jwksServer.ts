/**
 * JWKS Server implementation for the Tyk FAPI SDK.
 */

import * as express from 'express';
import * as http from 'http';
import * as jose from 'jose';
import { JWK, JWKS } from './types';
import { publicKeyToJWK } from './utils';

/**
 * A server that hosts a JSON Web Key Set (JWKS) endpoint.
 */
export class JWKSServer {
  /**
   * The public key to serve.
   */
  private publicKey: jose.KeyLike;
  
  /**
   * The key ID.
   */
  private kid: string;
  
  /**
   * The port to run the server on.
   */
  private port: number;
  
  /**
   * The Express app.
   */
  private app: express.Express;
  
  /**
   * The HTTP server.
   */
  private server: http.Server | null = null;
  
  /**
   * The JWKS URL.
   */
  public jwksUrl: string;
  
  /**
   * Initialize the JWKS server.
   * 
   * @param publicKey - The public key to serve.
   * @param kid - The key ID.
   * @param port - The port to run the server on.
   */
  constructor(publicKey: jose.KeyLike, kid: string, port: number = 8082) {
    this.publicKey = publicKey;
    this.kid = kid;
    this.port = port;
    this.app = express();
    this.jwksUrl = `http://localhost:${port}/.well-known/jwks.json`;
    
    // Set up routes
    this.app.get('/.well-known/jwks.json', this.handleJwks.bind(this));
  }
  
  /**
   * Handle requests to the JWKS endpoint.
   * 
   * @param req - The request object.
   * @param res - The response object.
   */
  private async handleJwks(req: express.Request, res: express.Response): Promise<void> {
    // Log the request
    console.log(`JWKS request from ${req.ip}`);
    
    try {
      // Create a JWK from the public key
      const jwk = await publicKeyToJWK(this.publicKey, this.kid);
      
      // Create a JWKS
      const jwks: JWKS = {
        keys: [jwk]
      };
      
      // Set CORS headers
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      // Send the response
      res.json(jwks);
    } catch (error) {
      console.error('Error handling JWKS request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * Start the JWKS server.
   * 
   * @returns A Promise that resolves when the server is started.
   * @throws Error if the server is already running.
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject(new Error('JWKS server already running'));
        return;
      }
      
      this.server = this.app.listen(this.port, () => {
        console.log(`Starting JWKS server on port ${this.port}`);
        console.log(`JWKS server started. Local URL: ${this.jwksUrl}`);
        console.log(`For Keycloak in Docker, use: http://host.docker.internal:${this.port}/.well-known/jwks.json`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        this.server = null;
        reject(error);
      });
    });
  }
  
  /**
   * Stop the JWKS server.
   * 
   * @returns A Promise that resolves when the server is stopped.
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      
      this.server.close(() => {
        this.server = null;
        console.log('JWKS server stopped');
        resolve();
      });
    });
  }
}