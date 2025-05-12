# Banking Third-Party Provider (TPP)

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
- API Gateway (optional, can connect directly to the mock bank)

## Getting Started

1. Clone the repository

2. Install dependencies
   ```bash
   cd tpp
   npm install
   ```

3. Create a `.env.local` file in the tpp directory with the following content:
   ```
   NEXT_PUBLIC_ACCOUNT_API_URL=/api
   NEXT_PUBLIC_PAYMENT_API_URL=/api
   ACCOUNT_INFORMATION_API_URL=http://localhost:8080/account-information
   PAYMENT_INITIATION_API_URL=http://localhost:8080/payment-initiation
   AUTHORIZATION_SERVER_URL=http://localhost:3002
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
│   │   ├── callback/        # Authorization callback page
│   │   └── api/             # Server-side API routes
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

## Documentation

For more detailed documentation about the TPP and how it integrates with the other components of the Tyk FAPI Accelerator, see:

- [System Architecture](../docs/architecture.md) - Overview of the system architecture
- [TPP Integration](../docs/tpp-integration.md) - How the TPP integrates with other components
- [Payment Flow](../docs/payment-flow.md) - Detailed explanation of the payment flow
- [Authorization Options](../docs/authorization-options.md) - Comparison of automatic vs manual authorization

## Future Enhancements

- Add authentication and authorization for the TPP application
- Add transaction filtering and sorting
- Add payment scheduling
- Support for international payments
- Unit and integration tests
- Enhanced error handling and recovery
