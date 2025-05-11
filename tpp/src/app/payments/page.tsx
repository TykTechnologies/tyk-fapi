'use client';

import React from 'react';
import { PaymentForm } from '@/components/payments/PaymentForm';

/**
 * Payments page component
 */
export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Payments</h1>
        <p className="text-gray-500">
          Make a domestic payment to another account
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <PaymentForm />
      </div>
    </div>
  );
}