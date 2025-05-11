import { ApiResponse, Links, Meta } from './common';

/**
 * Consent status
 */
export enum ConsentStatus {
  AWAITING_AUTHORISATION = 'AwaitingAuthorisation',
  AUTHORISED = 'Authorised',
  CONSUMED = 'Consumed',
  REJECTED = 'Rejected',
  REVOKED = 'Revoked',
  EXPIRED = 'Expired'
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'Pending',
  REJECTED = 'Rejected',
  ACCEPTED_SETTLEMENT_IN_PROCESS = 'AcceptedSettlementInProcess',
  ACCEPTED_SETTLEMENT_COMPLETED = 'AcceptedSettlementCompleted',
  ACCEPTED_WITHOUT_POSTING = 'AcceptedWithoutPosting',
  ACCEPTED_CREDIT_SETTLEMENT_COMPLETED = 'AcceptedCreditSettlementCompleted'
}

/**
 * Domestic payment initiation
 */
export interface DomesticPaymentInitiation {
  InstructionIdentification: string;
  EndToEndIdentification: string;
  InstructedAmount: {
    Amount: string;
    Currency: string;
  };
  DebtorAccount?: {
    SchemeName: string;
    Identification: string;
    Name?: string;
    SecondaryIdentification?: string;
  };
  CreditorAccount: {
    SchemeName: string;
    Identification: string;
    Name: string;
    SecondaryIdentification?: string;
  };
  CreditorPostalAddress?: {
    AddressType?: string;
    Department?: string;
    SubDepartment?: string;
    StreetName?: string;
    BuildingNumber?: string;
    PostCode?: string;
    TownName?: string;
    CountrySubDivision?: string;
    Country?: string;
    AddressLine?: string[];
  };
  RemittanceInformation?: {
    Unstructured?: string;
    Reference?: string;
  };
}

/**
 * Domestic payment consent model
 */
export interface DomesticPaymentConsent {
  ConsentId: string;
  CreationDateTime: string;
  Status: ConsentStatus;
  StatusUpdateDateTime: string;
  Initiation: DomesticPaymentInitiation;
  Risk: Record<string, unknown>;
  ExpirationDateTime?: string;
}

/**
 * Domestic payment consent request
 */
export interface DomesticPaymentConsentRequest {
  Data: {
    Initiation: DomesticPaymentInitiation;
  };
  Risk: Record<string, unknown>;
}

/**
 * Domestic payment consent response
 */
export interface DomesticPaymentConsentResponse {
  Data: {
    ConsentId: string;
    CreationDateTime: string;
    Status: ConsentStatus;
    StatusUpdateDateTime: string;
    Initiation: DomesticPaymentInitiation;
    ExpirationDateTime?: string;
  };
  Risk: Record<string, unknown>;
  Links: Links;
  Meta: Meta;
}

/**
 * Domestic payment model
 */
export interface DomesticPayment {
  DomesticPaymentId: string;
  ConsentId: string;
  CreationDateTime: string;
  Status: PaymentStatus;
  StatusUpdateDateTime: string;
  ExpectedExecutionDateTime?: string;
  ExpectedSettlementDateTime?: string;
  Charges?: Array<{
    ChargeBearer: string;
    Type: string;
    Amount: {
      Amount: string;
      Currency: string;
    };
  }>;
  Initiation: DomesticPaymentInitiation;
  MultiAuthorisation?: {
    Status: string;
    NumberRequired: number;
    NumberReceived: number;
    LastUpdateDateTime: string;
    ExpirationDateTime: string;
  };
}

/**
 * Domestic payment request
 */
export interface DomesticPaymentRequest {
  Data: {
    ConsentId: string;
    Initiation: DomesticPaymentInitiation;
  };
  Risk: Record<string, unknown>;
}

/**
 * Domestic payment response
 */
export interface DomesticPaymentResponse {
  Data: {
    DomesticPaymentId: string;
    ConsentId: string;
    CreationDateTime: string;
    Status: PaymentStatus;
    StatusUpdateDateTime: string;
    ExpectedExecutionDateTime?: string;
    ExpectedSettlementDateTime?: string;
    Charges?: Array<{
      ChargeBearer: string;
      Type: string;
      Amount: {
        Amount: string;
        Currency: string;
      };
    }>;
    Initiation: DomesticPaymentInitiation;
    MultiAuthorisation?: {
      Status: string;
      NumberRequired: number;
      NumberReceived: number;
      LastUpdateDateTime: string;
      ExpirationDateTime: string;
    };
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Funds confirmation response
 */
export interface FundsConfirmationResponse {
  Data: {
    FundsAvailableResult: {
      FundsAvailable: boolean;
      FundsAvailableDateTime: string;
    }
  };
  Links: Links;
  Meta: Meta;
}

/**
 * Pushed Authorization Request (PAR) response
 */
export interface PushedAuthorizationResponse {
  request_uri: string;
  expires_in: number;
}

/**
 * Authorization request parameters
 */
export interface AuthorizationRequestParams {
  clientId: string;
  responseType: string;
  scope: string;
  redirectUri: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  consentId?: string;
  [key: string]: any;
}