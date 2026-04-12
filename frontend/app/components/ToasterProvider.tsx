'use client';

import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface ToasterProviderProps {
  children: ReactNode;
}

export default function ToasterProvider({ children }: ToasterProviderProps): any {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
