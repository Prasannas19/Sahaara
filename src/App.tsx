import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { LandingPage } from './components/public/LandingPage';
import { HelpFaqPage } from './components/public/HelpFaqPage';
import { ContactPage } from './components/public/ContactPage';
import { AuthPage } from './components/auth/AuthPage';
import { ElderDashboard } from './components/elder/ElderDashboard';
import { CaretakerDashboard } from './components/caretaker/CaretakerDashboard';
import { FamilyDashboard } from './components/family/FamilyDashboard';
import { NavShell } from './components/ui/NavShell';
import { BrandLogo } from './components/ui/BrandLogo';

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

  if (loading) {
    return (
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
  }

  // Handle Logout action: sign out and navigate to landing page
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 1. PUBLIC WEBSITE ROUTES: /, /faq, /contact
  if (path === '/' || path === '') {
    return <LandingPage />;
  }
  if (path === '/faq') {
    return <HelpFaqPage />;
  }
  if (path === '/contact') {
    return <ContactPage />;
  }

  // 2. AUTHENTICATION ROUTES: /login and /signup
  if (path === '/login') {
    return <AuthPage initialMode="signin" />;
  }
  if (path === '/signup') {
    return <AuthPage initialMode="signup" />;
  }

  // 3. PROTECTED DASHBOARD ROUTES: /dashboard, /elder, /caretaker, /family
  // If not authenticated, redirect to /login
  if (!currentUser || !member) {
    return <AuthPage initialMode="signin" />;
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
    <NavShell member={member} circle={circle} onLogout={handleLogout}>
      {renderDashboard()}
    </NavShell>
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
