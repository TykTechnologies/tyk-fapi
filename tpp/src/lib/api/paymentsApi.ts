import axios from 'axios';
import {
  DomesticPaymentConsentRequest,
  DomesticPaymentConsentResponse,
  DomesticPaymentRequest,
  DomesticPaymentResponse,
  FundsConfirmationResponse,
  PushedAuthorizationResponse
} from '@/types/payments';

const API_URL = process.env.NEXT_PUBLIC_PAYMENT_API_URL;

/**
 * API client for payment initiation
 */
const paymentsApi = {
  /**
   * Create a domestic payment consent
   * @param consentRequest Payment consent request
   * @returns Promise with payment consent response
   */
  createPaymentConsent: async (
    consentRequest: DomesticPaymentConsentRequest
  ): Promise<DomesticPaymentConsentResponse> => {
    try {
      const response = await axios.post<DomesticPaymentConsentResponse>(
        `${API_URL}/domestic-payment-consents`,
        consentRequest
      );
      return response.data;
    } catch (error) {
      console.error('Error creating payment consent:', error);
      throw error;
    }
  },

  /**
   * Get a domestic payment consent by ID
   * @param consentId Consent ID
   * @returns Promise with payment consent response
   */
  getPaymentConsent: async (consentId: string): Promise<DomesticPaymentConsentResponse> => {
    try {
      const response = await axios.get<DomesticPaymentConsentResponse>(
        `${API_URL}/domestic-payment-consents/${consentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment consent ${consentId}:`, error);
      throw error;
    }
  },

  /**
   * Check funds availability for a payment consent
   * @param consentId Consent ID
   * @returns Promise with funds confirmation response
   */
  checkFundsAvailability: async (consentId: string): Promise<FundsConfirmationResponse> => {
    try {
      const response = await axios.get<FundsConfirmationResponse>(
        `${API_URL}/domestic-payment-consents/${consentId}/funds-confirmation`
      );
      return response.data;
    } catch (error) {
      console.error(`Error checking funds availability for consent ${consentId}:`, error);
      throw error;
    }
  },

  /**
   * Create a domestic payment
   * @param paymentRequest Payment request
   * @returns Promise with payment response
   */
  createPayment: async (
    paymentRequest: DomesticPaymentRequest
  ): Promise<DomesticPaymentResponse> => {
    try {
      const response = await axios.post<DomesticPaymentResponse>(
        `${API_URL}/domestic-payments`,
        paymentRequest
      );
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  /**
   * Get a domestic payment by ID
   * @param paymentId Payment ID
   * @returns Promise with payment response
   */
  getPayment: async (paymentId: string): Promise<DomesticPaymentResponse> => {
    try {
      const response = await axios.get<DomesticPaymentResponse>(
        `${API_URL}/domestic-payments/${paymentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment ${paymentId}:`, error);
      throw error;
    }
  },

  /**
   * Get payment details by ID
   * @param paymentId Payment ID
   * @returns Promise with payment details response
   */
  getPaymentDetails: async (paymentId: string): Promise<any> => {
    try {
      const response = await axios.get(
        `${API_URL}/domestic-payments/${paymentId}/payment-details`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment details for ${paymentId}:`, error);
      throw error;
    }
  },

  /**
   * Push authorization request (PAR)
   * @param params Authorization request parameters
   * @returns Promise with PAR response
   */
  pushAuthorizationRequest: async (params: {
    clientId: string;
    responseType: string;
    scope: string;
    redirectUri: string;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    consentId?: string;
    [key: string]: any;
  }): Promise<PushedAuthorizationResponse> => {
    try {
      const response = await axios.post<PushedAuthorizationResponse>(
        `${API_URL}/as/par`,
        params
      );
      return response.data;
    } catch (error) {
      console.error('Error pushing authorization request:', error);
      throw error;
    }
  },

  /**
   * Authorize payment consent
   * @param consentId Consent ID
   * @returns Promise with payment consent response
   */
  authorizePaymentConsent: async (consentId: string): Promise<DomesticPaymentConsentResponse> => {
    try {
      const response = await axios.put<DomesticPaymentConsentResponse>(
        `${API_URL}/domestic-payment-consents/${consentId}/authorize`
      );
      return response.data;
    } catch (error) {
      console.error(`Error authorizing payment consent ${consentId}:`, error);
      throw error;
    }
  },

  /**
   * Get authorization URL for a request URI
   * @param requestUri Request URI from PAR
   * @returns Authorization URL
   */
  getAuthorizationUrl: (requestUri: string): string => {
    return `${API_URL}/as/authorize?request_uri=${encodeURIComponent(requestUri)}`;
  }
};

export default paymentsApi;