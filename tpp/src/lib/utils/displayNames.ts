/**
 * Utility functions for displaying human-readable names for banking codes
 */

/**
 * Maps balance type codes to human-readable display names
 */
export const getBalanceTypeDisplayName = (type: string): string => {
  const balanceTypeMap: Record<string, string> = {
    'CLAV': 'Closing Available',
    'CLBD': 'Closing Booked',
    'ClosingCleared': 'Closing Cleared',
    'Expected': 'Expected',
    'ForwardAvailable': 'Forward Available',
    'Information': 'Information',
    'InterimAvailable': 'Interim Available',
    'InterimBooked': 'Interim Booked',
    'InterimCleared': 'Interim Cleared',
    'OpeningAvailable': 'Opening Available',
    'OpeningBooked': 'Opening Booked',
    'OpeningCleared': 'Opening Cleared',
    'PreviouslyClosedBooked': 'Previously Closed Booked'
  };
  
  return balanceTypeMap[type] || type;
};

/**
 * Maps account type codes to human-readable display names
 */
export const getAccountTypeDisplayName = (type: string): string => {
  const accountTypeMap: Record<string, string> = {
    'CACC': 'Current Account',
    'SACC': 'Savings Account',
    'CARD': 'Card Account',
    'LOAN': 'Loan Account',
    'MORT': 'Mortgage Account',
    'SVGS': 'Savings Account',
    'TRAN': 'Transaction Account',
    'NREX': 'Non-Resident External Account',
    'MOMA': 'Money Market Account',
    'CPAC': 'Cash Payment Account',
    'SLRY': 'Salary Account',
    'ODFT': 'Overdraft Account',
    'MGLD': 'Marginal Lending Account',
    'NFCA': 'No Fee Cash Account',
    'OTHR': 'Other'
  };
  
  return accountTypeMap[type] || type;
};

/**
 * Maps payment status codes to human-readable display names
 */
export const getPaymentStatusDisplayName = (status: string): string => {
  const paymentStatusMap: Record<string, string> = {
    'Pending': 'Pending',
    'Rejected': 'Rejected',
    'AcceptedSettlementInProcess': 'Accepted - Settlement In Process',
    'AcceptedSettlementCompleted': 'Accepted - Settlement Completed',
    'AcceptedWithoutPosting': 'Accepted Without Posting',
    'AcceptedCreditSettlementCompleted': 'Accepted - Credit Settlement Completed'
  };
  
  return paymentStatusMap[status] || status;
};