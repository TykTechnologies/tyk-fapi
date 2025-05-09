import { Links, Meta, ApiResponse } from '../../../common/types/common';

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