/**
 * HTTP client implementation for the Tyk FAPI SDK.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { URL } from 'url';
import { TokenSource } from './tokenSource';

/**
 * An HTTP client that automatically adds DPoP proofs to requests.
 */
export class DPoPHTTPClient {
  /**
   * The Client instance to use for DPoP proof generation.
   */
  private client: any; // Avoid circular import
  
  /**
   * The TokenSource to use for token acquisition.
   */
  private tokenSource: TokenSource;
  
  /**
   * The Axios instance.
   */
  private axiosInstance: AxiosInstance;
  
  /**
   * Initialize the DPoP HTTP client.
   * 
   * @param client - The Client instance to use for DPoP proof generation.
   */
  constructor(client: any) {
    this.client = client;
    this.tokenSource = client.tokenSource;
    
    // Create an Axios instance
    this.axiosInstance = axios.create({
      timeout: 10000
    });
    
    // Add a request interceptor to add DPoP proofs
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        return this.addDPoPHeaders(config);
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Add DPoP and Authorization headers to the request.
   * 
   * @param config - The Axios request config.
   * @returns The modified config.
   */
  private async addDPoPHeaders(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
    // Get a valid token
    const token = await this.tokenSource.getToken();
    
    // Parse the URL to get the path
    const url = new URL(config.url || '', config.baseURL || 'http://localhost');
    const targetUrl = url.pathname + url.search;
    
    // Generate a DPoP proof for this request
    const dpopProof = await this.client.generateDPoPProof(targetUrl, config.method || 'GET');
    
    // Add the DPoP proof to the request
    config.headers = config.headers || {};
    config.headers['DPoP'] = dpopProof;
    
    // Add the token to the request
    config.headers['Authorization'] = `${token.tokenType} ${token.accessToken}`;
    
    return config;
  }
  
  /**
   * Make an HTTP request with DPoP proof.
   * 
   * @param method - The HTTP method to use.
   * @param url - The URL to request.
   * @param config - Additional Axios config.
   * @returns A Promise that resolves to the HTTP response.
   */
  public async request<T = any>(
    method: string,
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.request<T>({
      method,
      url,
      ...config
    });
  }
  
  /**
   * Make a GET request with DPoP proof.
   * 
   * @param url - The URL to request.
   * @param config - Additional Axios config.
   * @returns A Promise that resolves to the HTTP response.
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('GET', url, config);
  }
  
  /**
   * Make a POST request with DPoP proof.
   * 
   * @param url - The URL to request.
   * @param data - The data to send.
   * @param config - Additional Axios config.
   * @returns A Promise that resolves to the HTTP response.
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('POST', url, {
      ...config,
      data
    });
  }
  
  /**
   * Make a PUT request with DPoP proof.
   * 
   * @param url - The URL to request.
   * @param data - The data to send.
   * @param config - Additional Axios config.
   * @returns A Promise that resolves to the HTTP response.
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('PUT', url, {
      ...config,
      data
    });
  }
  
  /**
   * Make a DELETE request with DPoP proof.
   * 
   * @param url - The URL to request.
   * @param config - Additional Axios config.
   * @returns A Promise that resolves to the HTTP response.
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('DELETE', url, config);
  }
  
  /**
   * Make a PATCH request with DPoP proof.
   * 
   * @param url - The URL to request.
   * @param data - The data to send.
   * @param config - Additional Axios config.
   * @returns A Promise that resolves to the HTTP response.
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>('PATCH', url, {
      ...config,
      data
    });
  }
  
  /**
   * Get the underlying Axios instance.
   * 
   * @returns The Axios instance.
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

/**
 * Create a DPoP HTTP client.
 * 
 * @param client - The Client instance to use for DPoP proof generation.
 * @returns A new DPoPHTTPClient instance.
 */
export function createDPoPHTTPClient(client: any): DPoPHTTPClient {
  return new DPoPHTTPClient(client);
}