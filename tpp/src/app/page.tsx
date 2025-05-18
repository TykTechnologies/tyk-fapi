'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Home page
 * This page provides an overview of the FAPI 2.0 with DPoP implementation
 */
export default function HomePage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if there's a consent ID in the URL
    const consentId = searchParams.get('consentId');
    console.log('Home page - Checking for consentId in URL:', consentId);
    
    // Check if there's a payment error in the URL
    const paymentError = searchParams.get('paymentError');
    if (paymentError) {
      console.log('Home page - Payment error in URL:', paymentError);
      setError(paymentError);
    }
    
    // Log any other query parameters
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    if (Object.keys(params).length > 0) {
      console.log('Home page - All URL parameters:', params);
    }
  }, [searchParams]);

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p>Error processing payment: {error}</p>
        </div>
      )}
      
      <section className="py-6">
        <h1 className="text-4xl font-bold mb-4">FAPI 2.0 with DPoP</h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          This application demonstrates a TPP (Third Party Provider) implementation
          of FAPI 2.0 with DPoP (Demonstrating Proof of Possession) for secure API access.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-3">What is FAPI 2.0?</h2>
          <p className="text-gray-600 mb-4">
            Financial-grade API (FAPI) 2.0 is a security profile that provides
            guidelines for secure API access in high-risk scenarios, such as
            open banking and open finance.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Enhanced security for financial data</li>
            <li>Protection against various attack vectors</li>
            <li>Standardized approach for secure API access</li>
          </ul>
          <Link href="https://openid.net/specs/fapi-2_0-security-profile-ID1.html" target="_blank" className="text-blue-600 hover:underline">
            Learn more about FAPI 2.0
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-3">What is DPoP?</h2>
          <p className="text-gray-600 mb-4">
            Demonstrating Proof of Possession (DPoP) is a security mechanism that
            proves possession of a private key corresponding to a public key
            presented during authentication.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
            <li>Prevents token theft and replay attacks</li>
            <li>Binds access tokens to specific clients</li>
            <li>Enhances security of OAuth 2.0 flows</li>
          </ul>
          <Link href="https://datatracker.ietf.org/doc/html/rfc9449" target="_blank" className="text-blue-600 hover:underline">
            Learn more about DPoP
          </Link>
        </Card>
      </section>

      <section className="py-6">
        <h2 className="text-2xl font-bold mb-4">Features Implemented</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-bold mb-2">DPoP Authentication</h3>
            <p className="text-gray-600">
              Secure authentication using DPoP proofs to bind tokens to clients.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-bold mb-2">PAR (Pushed Authorization Requests)</h3>
            <p className="text-gray-600">
              Enhanced security by pushing authorization parameters directly to the server.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-bold mb-2">PKCE (Proof Key for Code Exchange)</h3>
            <p className="text-gray-600">
              Protection against authorization code interception attacks.
            </p>
          </div>
        </div>
      </section>

      <section className="py-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Try It Out</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Log in using DPoP authentication to access your accounts and make payments.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/accounts">View Accounts</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/payments">Make Payments</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
