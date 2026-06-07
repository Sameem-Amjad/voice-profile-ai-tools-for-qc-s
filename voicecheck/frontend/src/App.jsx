import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { useDevMode } from './hooks/useDevMode';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

const LandingPage = lazy(() => import('./components/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const AppWorkflow = lazy(() => import('./components/app/AppWorkflow').then(m => ({ default: m.AppWorkflow })));
const SignInPage = lazy(() => import('./components/auth/SignInPage').then(m => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import('./components/auth/SignUpPage').then(m => ({ default: m.SignUpPage })));
const BillingPage = lazy(() => import('./components/account/BillingPage').then(m => ({ default: m.BillingPage })));
const UserDashboard = lazy(() => import('./components/dashboard/UserDashboard').then(m => ({ default: m.UserDashboard })));
const ContactPage = lazy(() => import('./components/contact/ContactPage').then(m => ({ default: m.ContactPage })));
const ChatbotWidget = lazy(() => import('./components/chatbot/ChatbotWidget').then(m => ({ default: m.ChatbotWidget })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const NotFoundPage = lazy(() => import('./components/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const SharedResultPage = lazy(() => import('./components/share/SharedResultPage').then(m => ({ default: m.SharedResultPage })));
const BlogIndex = lazy(() => import('./components/blog/BlogIndex').then(m => ({ default: m.BlogIndex })));
const BlogPost = lazy(() => import('./components/blog/BlogPost').then(m => ({ default: m.BlogPost })));
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService').then(m => ({ default: m.TermsOfService })));

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
    <Suspense fallback={<LoadingSpinner />}>
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
      <Route path="/blog" element={<BlogIndex />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    {/* Chatbot widget — own Suspense boundary so it never blocks route rendering */}
    <Suspense fallback={null}>
      <ChatbotWidget />
    </Suspense>
    </ErrorBoundary>
  );
}
