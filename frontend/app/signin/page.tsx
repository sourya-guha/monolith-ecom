'use client';

import React from 'react';
import ContactForm from '../components/ContactForm';

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background blobs */}
      <div className="blob blob-1 -top-60 -right-40 opacity-20" />
      <div className="blob blob-2 bottom-[-100px] left-[-80px] opacity-20" />
      <ContactForm />
    </div>
  );
}