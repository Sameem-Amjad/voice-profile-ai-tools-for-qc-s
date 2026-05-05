import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { Mic2 } from 'lucide-react';

const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#0f172a',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorInputBackground: '#1e293b',
    colorInputText: '#f1f5f9',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-slate-900/80 border border-white/10 backdrop-blur shadow-2xl',
    headerTitle: 'text-white',
    headerSubtitle: 'text-gray-400',
    socialButtonsBlockButton: 'bg-white/5 border border-white/10 hover:bg-white/10 text-white',
    formFieldLabel: 'text-gray-300',
    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
    footerActionText: 'text-gray-400',
    footerActionLink: 'text-blue-400 hover:text-blue-300',
    identityPreviewEditButton: 'text-blue-400',
  },
};

export const SignInPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
    <header className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2">
          <Mic2 className="text-blue-400" size={24} />
          <span className="text-white font-bold text-lg">
            Voice<span className="text-blue-400">Check</span>
          </span>
        </Link>
      </div>
    </header>
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/app"
          appearance={clerkAppearance}
        />
      </div>
    </main>
  </div>
);
