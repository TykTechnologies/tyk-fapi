import { Links, Meta } from '../../../common/types/common';
import { DomesticPaymentInitiation } from './consent';

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
 * Payment details response
 */
export interface PaymentDetailsResponse {
  Data: {
    PaymentStatus: PaymentStatus;
    PaymentStatusUpdateDateTime: string;
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
    StatusReason?: {
      Status: string;
      Description: string;
    };
  };
  Links: Links;
  Meta: Meta;
}