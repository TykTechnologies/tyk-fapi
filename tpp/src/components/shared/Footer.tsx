'use client';

import React from 'react';

/**
 * Footer component
 */
export function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Banking Third-Party Provider Demo
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Tyk Technologies
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}