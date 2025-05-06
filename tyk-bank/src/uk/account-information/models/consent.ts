import { Links, Meta, ApiResponse } from '../../../common/types/common';

/**
 * Consent status
 */
export enum ConsentStatus {
  AUTHORISED = 'Authorised',
  AWAITING_AUTHORISATION = 'AwaitingAuthorisation',
  REJECTED = 'Rejected',
  REVOKED = 'Revoked',
  EXPIRED = 'Expired'
}

/**
 * Permission types that can be requested
 */
export enum PermissionType {
  READACCOUNTSBASIC = 'ReadAccountsBasic',
  READACCOUNTSDETAIL = 'ReadAccountsDetail',
  READBALANCES = 'ReadBalances',
  READBENEFICIARIESBASIC = 'ReadBeneficiariesBasic',
  READBENEFICIARIESDETAIL = 'ReadBeneficiariesDetail',
  READDIRECTDEBITS = 'ReadDirectDebits',
  READOFFERS = 'ReadOffers',
  READPAN = 'ReadPAN',
  READPARTY = 'ReadParty',
  READPARTYPSU = 'ReadPartyPSU',
  READPRODUCTS = 'ReadProducts',
  READSCHEDULEDPAYMENTSBASIC = 'ReadScheduledPaymentsBasic',
  READSCHEDULEDPAYMENTSDETAIL = 'ReadScheduledPaymentsDetail',
  READSTANDINGORDERSBASIC = 'ReadStandingOrdersBasic',
  READSTANDINGORDERSDETAIL = 'ReadStandingOrdersDetail',
  READSTATEMENTSBASIC = 'ReadStatementsBasic',
  READSTATEMENTSDETAIL = 'ReadStatementsDetail',
  READTRANSACTIONSBASIC = 'ReadTransactionsBasic',
  READTRANSACTIONSCREDITS = 'ReadTransactionsCredits',
  READTRANSACTIONSDEBITS = 'ReadTransactionsDebits',
  READTRANSACTIONSDETAIL = 'ReadTransactionsDetail'
}

/**
 * Consent model
 */
export interface Consent {
  ConsentId: string;
  CreationDateTime: string;
  Status: ConsentStatus;
  StatusUpdateDateTime: string;
  Permissions: PermissionType[];
  ExpirationDateTime?: string;
  TransactionFromDateTime?: string;
  TransactionToDateTime?: string;
}

/**
 * Consent request
 */
export interface ConsentRequest {
  Data: {
    Permissions: PermissionType[];
    ExpirationDateTime?: string;
    TransactionFromDateTime?: string;
    TransactionToDateTime?: string;
  };
  Risk: Record<string, unknown>;
}

/**
 * Consent response
 */
export interface ConsentResponse {
  Data: {
    ConsentId: string;
    CreationDateTime: string;
    Status: ConsentStatus;
    StatusUpdateDateTime: string;
    Permissions: PermissionType[];
    ExpirationDateTime?: string;
    TransactionFromDateTime?: string;
    TransactionToDateTime?: string;
  };
  Risk: Record<string, unknown>;
  Links: Links;
  Meta: Meta;
}