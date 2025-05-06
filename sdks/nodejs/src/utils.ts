/**
 * Utility functions for the Tyk FAPI SDK.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import * as jose from 'jose';
import { JWK } from './types';

/**
 * Generate a new EC key pair using the P-256 curve.
 * 
 * @returns A Promise that resolves to a KeyPair.
 */
export async function generateKeyPair(): Promise<jose.GenerateKeyPairResult> {
  return jose.generateKeyPair('ES256');
}

/**
 * Load a private key from a PEM file.
 * 
 * @param keyFile - Path to the PEM file containing the private key.
 * @returns A Promise that resolves to the private key.
 * @throws Error if the key file cannot be read or parsed.
 */
export async function loadPrivateKeyFromFile(keyFile: string): Promise<jose.KeyLike> {
  try {
    const keyData = fs.readFileSync(keyFile, 'utf8');
    return jose.importPKCS8(keyData, 'ES256');
  } catch (error) {
    throw new Error(`Failed to load private key from file: ${error}`);
  }
}

/**
 * Load a key from a file or generate a new one if the file doesn't exist.
 * 
 * @param keyFile - Path to the PEM file containing the private key.
 * @returns A Promise that resolves to the private key.
 */
export async function loadOrGenerateKey(keyFile: string): Promise<jose.KeyLike> {
  if (fs.existsSync(keyFile)) {
    console.log(`Loading existing key from ${keyFile}`);
    return loadPrivateKeyFromFile(keyFile);
  }
  
  console.log(`Generating new key and saving to ${keyFile}`);
  const { privateKey } = await generateKeyPair();
  
  // Export the key to PKCS8 format
  const pkcs8 = await jose.exportPKCS8(privateKey);
  
  // Save the key to file
  fs.writeFileSync(keyFile, pkcs8, { mode: 0o600 });
  
  return privateKey;
}

/**
 * Export the public key to a PEM file.
 * 
 * @param privateKey - The private key from which to extract the public key.
 * @param filePath - Path where the public key will be saved.
 */
export async function exportPublicKeyToPEM(privateKey: jose.KeyLike, filePath: string): Promise<void> {
  const publicKey = await jose.exportSPKI(await jose.exportPublicKey(privateKey));
  fs.writeFileSync(filePath, publicKey);
}

/**
 * Convert a public key to a JWK (JSON Web Key).
 * 
 * @param publicKey - The public key to convert.
 * @param kid - Optional key ID to include in the JWK.
 * @returns A Promise that resolves to a JWK.
 */
export async function publicKeyToJWK(publicKey: jose.KeyLike, kid?: string): Promise<JWK> {
  const jwk = await jose.exportJWK(publicKey);
  
  const result: JWK = {
    kty: jwk.kty as string,
    crv: jwk.crv as string,
    x: jwk.x as string,
    y: jwk.y as string,
    alg: 'ES256',
    use: 'sig'
  };
  
  if (kid) {
    result.kid = kid;
  }
  
  return result;
}

/**
 * Generate a key ID (kid) from a public key.
 * 
 * @param publicKey - The public key to generate the kid from.
 * @returns A Promise that resolves to a string representing the kid.
 */
export async function generateKid(publicKey: jose.KeyLike): Promise<string> {
  const jwk = await jose.exportJWK(publicKey);
  const x = Buffer.from(jwk.x as string, 'base64url');
  const y = Buffer.from(jwk.y as string, 'base64url');
  const combined = Buffer.concat([x, y]);
  
  // Take first 16 bytes of base64url encoding
  return Buffer.from(combined).toString('base64url').substring(0, 16);
}

/**
 * Compute the JWK Thumbprint (jkt) as per RFC 7638.
 * 
 * @param publicKey - The public key to compute the jkt from.
 * @returns A Promise that resolves to a string representing the jkt.
 */
export async function computeJkt(publicKey: jose.KeyLike): Promise<string> {
  const jwk = await jose.exportJWK(publicKey);
  
  // Create a JWK representation with only the required fields in lexicographic order
  const thumbprintJwk = {
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y
  };
  
  // Compute the thumbprint
  return await jose.calculateJwkThumbprint(thumbprintJwk);
}

/**
 * Generate a random UUID.
 * 
 * @returns A string representing the UUID.
 */
export function generateUuid(): string {
  return uuidv4();
}

/**
 * Parse a JWT token string and return the claims.
 * 
 * @param tokenString - The JWT token string to parse.
 * @returns The token claims.
 * @throws Error if the token cannot be parsed.
 */
export function parseToken(tokenString: string): Record<string, any> {
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the claims part (the second part)
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return claims;
  } catch (error) {
    throw new Error(`Failed to parse token: ${error}`);
  }
}