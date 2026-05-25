import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LandingPage } from './components/landing/LandingPage';
import { AppWorkflow } from './components/app/AppWorkflow';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { BillingPage } from './components/account/BillingPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { ContactPage } from './components/contact/ContactPage';
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';
import { AdminLayout } from './components/admin/AdminLayout';
import { NotFoundPage } from './components/NotFoundPage';
import { PricingPage } from './pages/PricingPage';
import { SharedResultPage } from './components/share/SharedResultPage';
import { useDevMode } from './hooks/useDevMode';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

/**
 * Gate: requires the user to be signed in. In dev mode (no Clerk key),
 * we skip auth entirely and render children — matches backend's
 * AUTH_REQUIRED=False default so devs can run the app stand-alone.
 */
const RequireAuth = ({ children }) => {
  const { devMode } = useDevMode();
  if (devMode) return children;
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/sign-in" />
      </SignedOut>
    </>
  );
};

export default function App() {
  const { devMode } = useDevMode();

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Auth routes — only meaningful when Clerk is configured. */}
      {!devMode && <Route path="/sign-in/*" element={<SignInPage />} />}
      {!devMode && <Route path="/sign-up/*" element={<SignUpPage />} />}
      {/* In dev mode, hitting /sign-in or /sign-up just sends you into the app */}
      {devMode && <Route path="/sign-in/*" element={<Navigate to="/app" replace />} />}
      {devMode && <Route path="/sign-up/*" element={<Navigate to="/app" replace />} />}

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppWorkflow />
          </RequireAuth>
        }
      />

      <Route
        path="/account"
        element={
          <RequireAuth>
            <BillingPage />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <UserDashboard />
          </RequireAuth>
        }
      />

      <Route path="/contact" element={<ContactPage />} />

      <Route
        path="/admin/*"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      />

      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/r/:token" element={<SharedResultPage />} />

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>

    {/* Chatbot widget — rendered on all pages */}
    <ChatbotWidget />
    </ErrorBoundary>
  );
}
