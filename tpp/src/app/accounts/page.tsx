import { ProtectedRoute } from '@/components/auth';
import { AccountsContent } from './AccountsContent';

/**
 * Accounts page
 * This page displays the user's accounts and requires authentication
 */
export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Your Accounts</h1>
          <p className="text-gray-500 mt-2">
            View your accounts and transactions using FAPI 2.0 with DPoP
          </p>
        </div>
        
        <AccountsContent />
      </div>
    </ProtectedRoute>
  );
}