import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { SpaceDetailPage } from './pages/SpaceDetailPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { TenantReservationsPage } from './pages/TenantReservationsPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { OwnerUpgradeModal } from './components/OwnerUpgradeModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Space } from './types.ts';
import { ShieldCheck, Building2, ExternalLink } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

function AppContent() {
  const { currentUser, spaces } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isOwnerUpgradeModalOpen, setIsOwnerUpgradeModalOpen] = useState(false);
  
  // Estado para modal de Autenticación (fallback)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);

  const handleOpenAuth = (mode: 'login' | 'register', notice?: string) => {
    if (mode === 'login') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'owner' && currentUser && currentUser.role === 'tenant' && !currentUser.ownerTermsAccepted) {
      setIsOwnerUpgradeModalOpen(true);
      return;
    }
    
    // Map view string to route
    const routes: Record<string, string> = {
      'home': '/',
      'space-detail': '/space', // Normally this would have an ID, but we handle it with selectedSpace for now
      'login': '/login',
      'register': '/register',
      'forgot-password': '/forgot-password',
      'my-bookings': '/my-bookings',
      'owner': '/owner',
      'admin': '/admin',
      'onboarding': '/onboarding',
      'profile': '/profile'
    };
    
    navigate(routes[view] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSpace = (space: Space) => {
    setSelectedSpace(space);
    navigate(`/space/${space.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract current view string from location for Header compatibility
  const currentViewString = location.pathname === '/' ? 'home' 
    : location.pathname.startsWith('/space') ? 'space-detail'
    : location.pathname.slice(1);

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">
      {/* Header Principal */}
      <Header
        currentView={currentViewString as any}
        onNavigate={handleNavigate}
        onOpenOwnerUpgrade={() => setIsOwnerUpgradeModalOpen(true)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          <Route path="/" element={
            <HomePage
              onOpenOwnerUpgrade={() => setIsOwnerUpgradeModalOpen(true)}
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
              onSelectSpace={handleSelectSpace}
            />
          } />
          
          <Route path="/space/:id" element={
            <SpaceDetailPage
              space={selectedSpace || spaces[0]}
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          } />
          
          <Route path="/space" element={
            <SpaceDetailPage
              space={selectedSpace || spaces[0]}
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          } />

          <Route path="/login" element={<LoginPage onNavigate={handleNavigate} />} />
          <Route path="/register" element={<RegisterPage onNavigate={handleNavigate} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />

          <Route path="/my-bookings" element={
            <TenantReservationsPage
              onNavigate={handleNavigate}
              onOpenOwnerUpgrade={() => setIsOwnerUpgradeModalOpen(true)}
              onOpenAuth={handleOpenAuth}
            />
          } />

          <Route path="/owner" element={
            <OwnerDashboardPage
              onOpenOwnerUpgrade={() => setIsOwnerUpgradeModalOpen(true)}
              onOpenAuth={handleOpenAuth}
            />
          } />

          <Route path="/admin" element={<AdminDashboardPage onOpenAuth={handleOpenAuth} />} />

          <Route path="/onboarding" element={
            <OnboardingPage
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
            />
          } />

          <Route path="/profile" element={
            <ProfilePage
              onNavigate={handleNavigate}
              onOpenOwnerUpgrade={() => setIsOwnerUpgradeModalOpen(true)}
              onOpenAuth={handleOpenAuth}
            />
          } />
        </Routes>
      </main>

      {/* Modal de Conversión de Arrendatario a Propietario (Aceptación de Términos) */}
      <OwnerUpgradeModal
        isOpen={isOwnerUpgradeModalOpen}
        onClose={() => setIsOwnerUpgradeModalOpen(false)}
        onSuccessNavigate={() => {
          navigate('/owner');
        }}
      />

      {/* Footer Institucional Chileno */}
      <footer className="bg-slate-900 text-slate-400 text-xs mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-white font-bold text-base tracking-tight">
                  Spotly
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Plataforma líder en Chile para el arriendo por día y hora de recintos corporativos, comerciales y creativos. Contratos respaldados bajo la Ley N° 18.101.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[10px]">
                Mercado & Categorías
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li className="hover:text-white transition cursor-pointer">Oficinas Privadas y Plantas Libres</li>
                <li className="hover:text-white transition cursor-pointer">Espacios de Coworking Flex</li>
                <li className="hover:text-white transition cursor-pointer">Salas de Eventos & Workshops</li>
                <li className="hover:text-white transition cursor-pointer">Estudios Creativos & Streaming</li>
                <li className="hover:text-white transition cursor-pointer">Bodegas & Almacenaje Urbano</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[10px]">
                Marco Legal en Chile
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li>Ley N° 18.101 de Arrendamiento de Predios Urbanos</li>
                <li>Ley N° 19.628 sobre Protección de la Vida Privada</li>
                <li>Firma Electrónica Avanzada (Ley 19.799)</li>
                <li>Circular N° 37 del SII (Tratamiento Tributario e IVA)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[10px]">
                Gobernanza & Verificación
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Validación de RUT con algoritmo Módulo 11, verificación biométrica facial y aprobación de expedientes por Administración.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Cifrado SHA-256 en Contratos
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 Spotly Chile (EspaciosChile). Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-4">
              <span>Términos y Condiciones</span>
              <span>Privacidad de Datos</span>
              <span>Soporte Técnico</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
export default App;
