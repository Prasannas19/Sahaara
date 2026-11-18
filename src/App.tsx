import { useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { LandingPage } from './components/public/LandingPage';
import { HelpFaqPage } from './components/public/HelpFaqPage';
import { BrandLogo } from './components/ui/BrandLogo';

// Loaded on demand so first-time visitors download only the public site;
// the sign-in form, dashboards and Firestore arrive only when needed.
const ContactPage = lazy(() => import('./components/public/ContactPage').then(m => ({ default: m.ContactPage })));
const AuthPage = lazy(() => import('./components/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const ElderDashboard = lazy(() => import('./components/elder/ElderDashboard').then(m => ({ default: m.ElderDashboard })));
const CaretakerDashboard = lazy(() => import('./components/caretaker/CaretakerDashboard').then(m => ({ default: m.CaretakerDashboard })));
const FamilyDashboard = lazy(() => import('./components/family/FamilyDashboard').then(m => ({ default: m.FamilyDashboard })));
const NavShell = lazy(() => import('./components/ui/NavShell').then(m => ({ default: m.NavShell })));

const SplashScreen = (
  <div className="min-h-screen bg-[#F8F7F1] flex flex-col items-center justify-center p-4">
    <div className="animate-pulse flex flex-col items-center">
      <BrandLogo variant="symbol" size="lg" />
      <p className="text-xl font-bold text-[#173F35] font-heading mt-4">
        Connecting to Sahaara...
      </p>
      <p className="text-xs text-[#52605C] mt-1">Care that connects. Support that matters.</p>
    </div>
  </div>
);

function AppRouter() {
  const { currentUser, member, circle, loading, logout } = useAuth();
  const { path, navigate } = useRouter();

  // Redirect authenticated user to dashboard if they are on /login or /signup
  useEffect(() => {
    if (!loading && currentUser && member) {
      if (path === '/login' || path === '/signup') {
        navigate('/dashboard');
      }
    }
  }, [loading, currentUser, member, path, navigate]);

  // 1. PUBLIC WEBSITE ROUTES: /, /faq, /contact
  // Render immediately without waiting for auth to resolve, so first-time
  // visitors never see the splash screen on the marketing pages. The
  // redirect effect above still sends signed-in users to their dashboard.
  if (path === '/' || path === '') {
    return <LandingPage />;
  }
  if (path === '/faq') {
    return <HelpFaqPage />;
  }
  if (path === '/contact') {
    return <Suspense fallback={SplashScreen}><ContactPage /></Suspense>;
  }

  // Auth-gated routes below wait for the auth state to resolve first.
  if (loading) {
    return SplashScreen;
  }

  // Handle Logout action: sign out and navigate to landing page
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 2. AUTHENTICATION ROUTES: /login and /signup
  if (path === '/login') {
    return <Suspense fallback={SplashScreen}><AuthPage initialMode="signin" /></Suspense>;
  }
  if (path === '/signup') {
    return <Suspense fallback={SplashScreen}><AuthPage initialMode="signup" /></Suspense>;
  }

  // 3. PROTECTED DASHBOARD ROUTES: /dashboard, /elder, /caretaker, /family
  // If not authenticated, redirect to /login
  if (!currentUser || !member) {
    return <Suspense fallback={SplashScreen}><AuthPage initialMode="signin" /></Suspense>;
  }

  // Render role-specific dashboard inside NavShell
  const renderDashboard = () => {
    switch (member.role) {
      case 'elder':
        return <ElderDashboard member={member} circle={circle} />;
      case 'caretaker':
        return <CaretakerDashboard member={member} circle={circle} />;
      case 'family':
        return <FamilyDashboard member={member} circle={circle} />;
      default:
        return (
          <div className="text-center py-16">
            <p className="text-red-700 font-bold">Unrecognized member role.</p>
          </div>
        );
    }
  };

  return (
    <Suspense fallback={SplashScreen}>
      <NavShell member={member} circle={circle} onLogout={handleLogout}>
        {renderDashboard()}
      </NavShell>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppRouter />
      </RouterProvider>
    </AuthProvider>
  );
}
