# Banking Third-Party Provider

A NextJS application that connects to a mock bank API to retrieve account information and make domestic payments, implementing FAPI 2.0 security profile with Pushed Authorization Requests (PAR).

## Features

- View all accounts with balances on the dashboard
- View detailed account information and transaction history
- Make domestic payments with secure authorization flow
- Support for both automated and manual payment authorization
- Implementation of FAPI 2.0 security profile with PAR
- Modern UI with ShadCN components

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework with App Router
- [React Query](https://tanstack.com/query/latest) - Data fetching and state management
- [Axios](https://axios-http.com/) - HTTP client
- [ShadCN UI](https://ui.shadcn.com/) - UI components
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Prerequisites

- Node.js 18+ and npm
- Running instance of the mock bank API (tyk-bank)

## Getting Started

1. Clone the repository

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following content:
   ```
   NEXT_PUBLIC_ACCOUNT_API_URL=http://localhost:3001
   NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:3002
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
tpp/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Dashboard page
│   │   ├── layout.tsx       # Root layout
│   │   ├── accounts/        # Account pages
│   │   ├── payments/        # Payment pages
│   │   ├── bank-authorize/  # Bank authorization page
│   │   └── callback/        # Authorization callback page
│   ├── components/          # React components
│   │   ├── ui/              # ShadCN UI components
│   │   ├── accounts/        # Account-related components
│   │   ├── payments/        # Payment-related components
│   │   └── shared/          # Shared components
│   ├── lib/                 # Utility functions
│   │   ├── api/             # API client functions
│   │   └── utils/           # Utility functions
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript interfaces
├── .env.local               # Environment variables
└── package.json             # Project dependencies
```

## API Integration

The application integrates with two main APIs:

1. **Account Information API** (port 3001)
   - Fetch accounts
   - Fetch balances
   - Fetch account details
   - Fetch account transactions

2. **Payment Initiation API** (port 3002)
   - Create payment consents
   - Push authorization requests (PAR)
   - Authorize payment consents
   - Initiate payments
   - Check payment status

## Payment Authorization Flow

The application implements a secure payment authorization flow based on the FAPI 2.0 security profile:

1. **Create Payment Consent**: The application creates a payment consent with the bank.
2. **Push Authorization Request (PAR)**: The application pushes an authorization request to the bank.
3. **Authorization Options**:
   - **Automatic Authorization**: The application can automatically authorize the payment (for testing).
   - **Manual Authorization**: The user is redirected to a simulated bank authorization page.
4. **Payment Creation**: After authorization, the application creates the payment using the authorized consent.

## Future Enhancements

- Add authentication and authorization for the TPP application
- Add transaction filtering and sorting
- Add payment scheduling
- Support for international payments
- Unit and integration tests
- Enhanced error handling and recovery
