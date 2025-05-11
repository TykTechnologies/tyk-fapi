import { useMutation, useQuery } from '@tanstack/react-query';
import paymentsApi from '@/lib/api/paymentsApi';
import {
  DomesticPaymentConsentRequest,
  DomesticPaymentRequest,
  AuthorizationRequestParams
} from '@/types/payments';

/**
 * Hook for fetching a payment consent by ID
 * @param consentId Consent ID
 */
export const usePaymentConsent = (consentId: string) => {
  return useQuery({
    queryKey: ['payment-consent', consentId],
    queryFn: () => paymentsApi.getPaymentConsent(consentId),
    enabled: !!consentId,
  });
};

/**
 * Hook for checking funds availability for a payment consent
 * @param consentId Consent ID
 */
export const useFundsAvailability = (consentId: string) => {
  return useQuery({
    queryKey: ['funds-availability', consentId],
    queryFn: () => paymentsApi.checkFundsAvailability(consentId),
    enabled: !!consentId,
  });
};

/**
 * Hook for fetching a payment by ID
 * @param paymentId Payment ID
 */
export const usePayment = (paymentId: string) => {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => paymentsApi.getPayment(paymentId),
    enabled: !!paymentId,
  });
};

/**
 * Hook for fetching payment details by ID
 * @param paymentId Payment ID
 */
export const usePaymentDetails = (paymentId: string) => {
  return useQuery({
    queryKey: ['payment-details', paymentId],
    queryFn: () => paymentsApi.getPaymentDetails(paymentId),
    enabled: !!paymentId,
  });
};

/**
 * Hook for creating a payment consent
 */
export const useCreatePaymentConsent = () => {
  return useMutation({
    mutationFn: (consentRequest: DomesticPaymentConsentRequest) => 
      paymentsApi.createPaymentConsent(consentRequest),
  });
};

/**
 * Hook for creating a payment
 */
export const useCreatePayment = () => {
  return useMutation({
    mutationFn: (paymentRequest: DomesticPaymentRequest) => 
      paymentsApi.createPayment(paymentRequest),
  });
};

/**
 * Hook for pushing an authorization request (PAR)
 */
export const usePushAuthorizationRequest = () => {
  return useMutation({
    mutationFn: (params: AuthorizationRequestParams) =>
      paymentsApi.pushAuthorizationRequest(params),
  });
};

/**
 * Hook for authorizing a payment consent
 */
export const useAuthorizePaymentConsent = () => {
  return useMutation({
    mutationFn: (consentId: string) =>
      paymentsApi.authorizePaymentConsent(consentId),
  });
};

/**
 * Hook for the complete payment flow
 * This combines creating a consent and then creating a payment
 */
export const usePaymentFlow = () => {
  const createConsentMutation = useCreatePaymentConsent();
  const pushAuthRequestMutation = usePushAuthorizationRequest();
  const authorizeConsentMutation = useAuthorizePaymentConsent();
  const createPaymentMutation = useCreatePayment();

  const initiatePayment = async (paymentData: {
    amount: string;
    currency: string;
    creditorAccount: {
      schemeName: string;
      identification: string;
      name: string;
    };
    reference?: string;
  }) => {
    try {
      // Step 1: Create a payment consent
      const consentRequest: DomesticPaymentConsentRequest = {
        Data: {
          Initiation: {
            InstructionIdentification: `INSTR-${Date.now()}`,
            EndToEndIdentification: `E2E-${Date.now()}`,
            InstructedAmount: {
              Amount: paymentData.amount,
              Currency: paymentData.currency,
            },
            CreditorAccount: {
              SchemeName: paymentData.creditorAccount.schemeName,
              Identification: paymentData.creditorAccount.identification,
              Name: paymentData.creditorAccount.name,
            },
            RemittanceInformation: paymentData.reference
              ? { Reference: paymentData.reference }
              : undefined,
          },
        },
        Risk: {},
      };

      const consentResponse = await createConsentMutation.mutateAsync(consentRequest);
      const consentId = consentResponse.Data.ConsentId;

      // Step 2: Push authorization request (PAR)
      const parResponse = await pushAuthRequestMutation.mutateAsync({
        clientId: 'tpp-client',
        responseType: 'code',
        scope: 'payments',
        redirectUri: window.location.origin + '/callback',
        state: Math.random().toString(36).substring(2, 15),
        consentId: consentId
      });

      // Step 3: For demo purposes, we'll directly authorize the consent
      // In a real implementation, we would redirect the user to the authorization URL
      // and handle the callback with the authorization code
      await authorizeConsentMutation.mutateAsync(consentId);

      // Step 4: Create a payment using the consent ID
      const paymentRequest: DomesticPaymentRequest = {
        Data: {
          ConsentId: consentId,
          Initiation: consentRequest.Data.Initiation,
        },
        Risk: {},
      };

      const paymentResponse = await createPaymentMutation.mutateAsync(paymentRequest);
      return paymentResponse;
    } catch (error) {
      console.error('Error in payment flow:', error);
      throw error;
    }
  };

  return {
    initiatePayment,
    isLoading:
      createConsentMutation.isPending ||
      pushAuthRequestMutation.isPending ||
      authorizeConsentMutation.isPending ||
      createPaymentMutation.isPending,
    isError:
      createConsentMutation.isError ||
      pushAuthRequestMutation.isError ||
      authorizeConsentMutation.isError ||
      createPaymentMutation.isError,
    error:
      createConsentMutation.error ||
      pushAuthRequestMutation.error ||
      authorizeConsentMutation.error ||
      createPaymentMutation.error,
  };
};