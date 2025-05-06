import { v4 as uuidv4 } from 'uuid';
import { 
  Account, 
  AccountCategory, 
  AccountIdentificationType, 
  AccountStatus, 
  AccountTypeCode 
} from '../models/account';

/**
 * Mock accounts data
 */
export const accounts: Account[] = [
  {
    AccountId: '22289',
    Status: AccountStatus.ENABLED,
    StatusUpdateDateTime: '2023-01-01T06:06:06+00:00',
    Currency: 'GBP',
    AccountType: 'Personal',
    AccountSubType: AccountTypeCode.CACC,
    Description: 'Personal Current Account',
    Nickname: 'Main Account',
    OpeningDate: '2020-01-01T00:00:00+00:00',
    AccountCategory: AccountCategory.PERSONAL,
    SwitchStatus: 'UK.CASS.NotSwitched',
    Account: {
      SchemeName: AccountIdentificationType.SORTCODEACCOUNTNUMBER,
      Identification: '80200110203345',
      Name: 'Mr Kevin Smith',
      SecondaryIdentification: '00021'
    },
    Servicer: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'TYK12345',
      Name: 'Tyk Bank'
    }
  },
  {
    AccountId: '31820',
    Status: AccountStatus.ENABLED,
    StatusUpdateDateTime: '2023-01-01T06:06:06+00:00',
    Currency: 'GBP',
    AccountType: 'Personal',
    AccountSubType: AccountTypeCode.SVGS,
    Description: 'Personal Savings Account',
    Nickname: 'Savings',
    OpeningDate: '2020-02-01T00:00:00+00:00',
    AccountCategory: AccountCategory.PERSONAL,
    SwitchStatus: 'UK.CASS.NotSwitched',
    Account: {
      SchemeName: AccountIdentificationType.SORTCODEACCOUNTNUMBER,
      Identification: '80200110203348',
      Name: 'Mr Kevin Smith',
      SecondaryIdentification: '00022'
    },
    Servicer: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'TYK12345',
      Name: 'Tyk Bank'
    }
  },
  {
    AccountId: '42281',
    Status: AccountStatus.ENABLED,
    StatusUpdateDateTime: '2023-01-01T06:06:06+00:00',
    Currency: 'GBP',
    AccountType: 'Personal',
    AccountSubType: AccountTypeCode.CARD,
    Description: 'Credit Card Account',
    Nickname: 'Credit Card',
    OpeningDate: '2020-03-01T00:00:00+00:00',
    AccountCategory: AccountCategory.PERSONAL,
    SwitchStatus: 'UK.CASS.NotSwitched',
    Account: {
      SchemeName: AccountIdentificationType.PAN,
      Identification: '5409050000000000',
      Name: 'Mr Kevin Smith'
    },
    Servicer: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'TYK12345',
      Name: 'Tyk Bank'
    }
  },
  {
    AccountId: '73625',
    Status: AccountStatus.ENABLED,
    StatusUpdateDateTime: '2023-01-01T06:06:06+00:00',
    Currency: 'GBP',
    AccountType: 'Business',
    AccountSubType: AccountTypeCode.CACC,
    Description: 'Business Current Account',
    Nickname: 'Business Account',
    OpeningDate: '2021-01-01T00:00:00+00:00',
    AccountCategory: AccountCategory.BUSINESS,
    SwitchStatus: 'UK.CASS.NotSwitched',
    Account: {
      SchemeName: AccountIdentificationType.SORTCODEACCOUNTNUMBER,
      Identification: '80200110203399',
      Name: 'Smith Enterprises Ltd',
      SecondaryIdentification: '00023'
    },
    Servicer: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'TYK12345',
      Name: 'Tyk Bank'
    }
  },
  {
    AccountId: '82736',
    Status: AccountStatus.ENABLED,
    StatusUpdateDateTime: '2023-01-01T06:06:06+00:00',
    Currency: 'EUR',
    AccountType: 'Personal',
    AccountSubType: AccountTypeCode.CACC,
    Description: 'Euro Current Account',
    Nickname: 'Euro Account',
    OpeningDate: '2022-01-01T00:00:00+00:00',
    AccountCategory: AccountCategory.PERSONAL,
    SwitchStatus: 'UK.CASS.NotSwitched',
    Account: {
      SchemeName: AccountIdentificationType.IBAN,
      Identification: 'GB29NWBK60161331926819',
      Name: 'Mr Kevin Smith'
    },
    Servicer: {
      SchemeName: 'UK.OBIE.BICFI',
      Identification: 'TYK12345',
      Name: 'Tyk Bank'
    }
  }
];

/**
 * Get all accounts
 */
export const getAllAccounts = (): Account[] => {
  return accounts;
};

/**
 * Get account by ID
 */
export const getAccountById = (accountId: string): Account | undefined => {
  return accounts.find(account => account.AccountId === accountId);
};

/**
 * Create a new account
 */
export const createAccount = (account: Omit<Account, 'AccountId'>): Account => {
  const newAccount: Account = {
    ...account,
    AccountId: uuidv4().substring(0, 5)
  };
  accounts.push(newAccount);
  return newAccount;
};