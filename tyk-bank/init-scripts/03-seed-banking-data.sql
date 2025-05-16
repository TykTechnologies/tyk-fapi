-- Seed data for accounts table
INSERT INTO accounts (account_id, currency, account_type, account_sub_type, description, nickname, status, opening_date, scheme_name, identification, name, secondary_identification)
VALUES
  ('22289', 'GBP', 'Personal', 'CurrentAccount', 'Personal Current Account', 'Main Account', 'Enabled', '2020-01-01T00:00:00Z', 'UK.OBIE.SortCodeAccountNumber', '80200110203345', 'Mr Kevin Smith', '00021'),
  ('31820', 'GBP', 'Personal', 'SavingsAccount', 'Personal Savings Account', 'Savings', 'Enabled', '2020-02-01T00:00:00Z', 'UK.OBIE.SortCodeAccountNumber', '80200110203348', 'Mr Kevin Smith', '00022'),
  ('42281', 'GBP', 'Personal', 'Card', 'Credit Card Account', 'Credit Card', 'Enabled', '2020-03-01T00:00:00Z', 'UK.OBIE.PAN', '5409050000000000', 'Mr Kevin Smith', NULL),
  ('73625', 'GBP', 'Business', 'CurrentAccount', 'Business Current Account', 'Business Account', 'Enabled', '2021-01-01T00:00:00Z', 'UK.OBIE.SortCodeAccountNumber', '80200110203399', 'Smith Enterprises Ltd', '00023'),
  ('82736', 'EUR', 'Personal', 'CurrentAccount', 'Euro Current Account', 'Euro Account', 'Enabled', '2022-01-01T00:00:00Z', 'UK.OBIE.IBAN', 'GB29NWBK60161331926819', 'Mr Kevin Smith', NULL);

-- Seed data for balances table
INSERT INTO balances (account_id, balance_type, amount, currency, credit_debit_indicator, date_time)
VALUES
  -- Current Account
  ('22289', 'ClosingAvailable', 3500.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  ('22289', 'ClosingBooked', 3500.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  
  -- Savings Account
  ('31820', 'ClosingAvailable', 12500.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  ('31820', 'ClosingBooked', 12500.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  
  -- Credit Card Account
  ('42281', 'ClosingAvailable', 4250.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  ('42281', 'ClosingBooked', 750.00, 'GBP', 'Debit', '2023-05-01T00:00:00Z'),
  
  -- Business Account
  ('73625', 'ClosingAvailable', 15750.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  ('73625', 'ClosingBooked', 15750.00, 'GBP', 'Credit', '2023-05-01T00:00:00Z'),
  
  -- Euro Account
  ('82736', 'ClosingAvailable', 2750.00, 'EUR', 'Credit', '2023-05-01T00:00:00Z'),
  ('82736', 'ClosingBooked', 2750.00, 'EUR', 'Credit', '2023-05-01T00:00:00Z');

-- Seed data for transactions table
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code,
  merchant_name, merchant_category_code
)
VALUES
  -- Current Account Transactions
  ('tx001', '22289', 'Booked', '2023-04-05T10:43:07Z', '2023-04-05T10:43:07Z', 
   'Coffee Shop', 4.50, 'GBP', 'Debit', 
   'Debit', 'CashWithdrawal',
   'Costa Coffee', '5814'),
   
  ('tx002', '22289', 'Booked', '2023-04-04T14:22:17Z', '2023-04-04T14:22:17Z', 
   'Grocery Store', 27.45, 'GBP', 'Debit', 
   'Debit', 'POS',
   'Tesco', '5411');

-- Add transaction with creditor agent
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code,
  creditor_agent_scheme_name, creditor_agent_identification, creditor_agent_name
)
VALUES
  ('tx003', '22289', 'Booked', '2023-04-01T00:00:01Z', '2023-04-01T00:00:01Z', 
   'Salary', 2500.00, 'GBP', 'Credit', 
   'Credit', 'DirectDeposit',
   'UK.OBIE.BICFI', 'ABCGB2L', 'ABC Corp');

-- Add transaction with debtor account
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code,
  debtor_account_scheme_name, debtor_account_identification, debtor_account_name
)
VALUES
  ('tx004', '31820', 'Booked', '2023-04-02T12:00:00Z', '2023-04-02T12:00:00Z', 
   'Transfer from Current Account', 500.00, 'GBP', 'Credit', 
   'Credit', 'Transfer',
   'UK.OBIE.SortCodeAccountNumber', '80200110203345', 'Mr Kevin Smith');

-- Add simple transaction
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code
)
VALUES
  ('tx005', '31820', 'Booked', '2023-03-15T12:00:00Z', '2023-03-15T12:00:00Z', 
   'Interest', 12.50, 'GBP', 'Credit', 
   'Credit', 'Interest');

-- Add more transactions with merchant details
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code,
  merchant_name, merchant_category_code
)
VALUES
  ('tx006', '42281', 'Booked', '2023-04-03T18:12:33Z', '2023-04-03T18:12:33Z', 
   'Restaurant', 85.20, 'GBP', 'Debit', 
   'Debit', 'POS',
   'The Ivy', '5812'),
   
  ('tx007', '42281', 'Booked', '2023-04-02T09:45:11Z', '2023-04-02T09:45:11Z', 
   'Online Shopping', 34.99, 'GBP', 'Debit', 
   'Debit', 'OnlinePurchase',
   'Amazon', '5999');

-- Add transaction with creditor agent
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code,
  creditor_agent_scheme_name, creditor_agent_identification, creditor_agent_name
)
VALUES
  ('tx008', '73625', 'Booked', '2023-04-04T15:30:00Z', '2023-04-04T15:30:00Z', 
   'Client Payment', 1250.00, 'GBP', 'Credit', 
   'Credit', 'DirectDeposit',
   'UK.OBIE.BICFI', 'XYZGB2L', 'XYZ Ltd');

-- Add simple transaction
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code
)
VALUES
  ('tx009', '73625', 'Booked', '2023-04-01T09:00:00Z', '2023-04-01T09:00:00Z', 
   'Office Rent', 800.00, 'GBP', 'Debit', 
   'Debit', 'DirectDebit');

-- Add simple transaction
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code
)
VALUES
  ('tx010', '82736', 'Booked', '2023-04-03T14:15:00Z', '2023-04-03T14:15:00Z', 
   'Transfer from GBP Account', 500.00, 'EUR', 'Credit', 
   'Credit', 'Transfer');

-- Add transaction with merchant details
INSERT INTO transactions (
  transaction_id, account_id, status, booking_date_time, value_date_time, 
  transaction_information, amount, currency, credit_debit_indicator,
  bank_transaction_code_code, bank_transaction_code_sub_code,
  merchant_name, merchant_category_code
)
VALUES
  ('tx011', '82736', 'Booked', '2023-04-02T12:30:00Z', '2023-04-02T12:30:00Z', 
   'Hotel Booking', 220.00, 'EUR', 'Debit', 
   'Debit', 'OnlinePurchase',
   'Hotel Europa', '7011');

-- Seed data for payment_consents table
INSERT INTO payment_consents (
  consent_id, status, creation_date_time, status_update_date_time,
  instruction_identification, end_to_end_identification,
  instructed_amount_amount, instructed_amount_currency,
  creditor_account_scheme_name, creditor_account_identification, creditor_account_name, creditor_account_secondary_identification,
  remittance_information_reference, remittance_information_unstructured
)
VALUES
  ('pcon-001', 'Authorised', '2023-05-01T10:00:00Z', '2023-05-01T10:05:00Z',
   'ACME412', 'FRESCO.21302.GFX.20',
   165.88, 'GBP',
   'UK.OBIE.SortCodeAccountNumber', '08080021325698', 'ACME Inc', '0002',
   'FRESCO-101', 'Internal ops code 5120101'),
   
  ('pcon-002', 'AwaitingAuthorisation', '2023-05-02T14:30:00Z', '2023-05-02T14:30:00Z',
   'PAYREF-45321', 'BILLINV-45789',
   256.99, 'GBP',
   'UK.OBIE.SortCodeAccountNumber', '20051899712564', 'Merchant XYZ Ltd', NULL,
   'INV-45789', NULL);

-- Seed data for payments table
INSERT INTO payments (
  payment_id, consent_id, creation_date_time, status, status_update_date_time,
  expected_execution_date_time, expected_settlement_date_time
)
VALUES
  ('p-001', 'pcon-001', '2023-05-01T10:10:00Z', 'AcceptedSettlementCompleted', '2023-05-01T10:15:00Z',
   '2023-05-01T10:10:00Z', '2023-05-01T10:15:00Z');