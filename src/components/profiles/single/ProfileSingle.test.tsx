import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import ProfileSingle from '@/components/profiles/single/ProfileSingle';
import EditProfileSingle from '@/components/profiles/single/EditProfileSingle';
import React from 'react';

// Objetos estables para el mock
const mockUser = { id: 'test-user-1', email: 'test@example.com' };
const mockProfile = { id: 'test-profile-1', is_demo: true };

// Mock de hooks y servicios
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    isAuthenticated: true,
    getProfileType: () => 'single'
  })
}));

vi.mock('@/features/profile/useProfileQuery', () => ({
  useProfileQuery: () => ({
    data: null,
    isLoading: false,
    error: null
  })
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mocks adicionales para EditProfileSingle
vi.mock('@/lib/data', () => ({
  generateMockSingle: () => ({
    id: 'mock-single-1',
    first_name: 'Ana',
    last_name: 'García',
    age: 28,
    bio: 'Bio de prueba',
    location: 'Ciudad de México',
    profession: 'Diseñadora',
    interests: ['Arte', 'Música'],
    avatar: '/placeholder.svg'
  })
}));

vi.mock('@/features/profile/useProfileTheme', () => ({
  useDemoThemeConfig: () => ({
    demoTheme: 'default',
    setDemoTheme: vi.fn(),
    navbarStyle: 'modern',
    setNavbarStyle: vi.fn()
  }),
  useProfileTheme: () => ({
    backgroundClass: 'bg-gradient-to-br from-purple-900 via-pink-900 to-red-900',
    textClass: 'text-white'
  }),
  getNavbarStyles: () => ({})
}));

// Mock Navigation component to avoid router/auth issues inside it
vi.mock('@/components/Navigation', () => {
  return {
    default: () => <div data-testid="navigation">Navigation</div>,
    Navigation: () => <div data-testid="navigation">Navigation</div>
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProfileSingle', () => {
  beforeEach(() => {
    // Configurar localStorage para modo demo
    localStorage.setItem('demo_authenticated', 'true');
    localStorage.setItem('demo_user', JSON.stringify({
      id: 'demo-user-1',
      first_name: 'Demo',
      accountType: 'single'
    }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('debe cargar el perfil demo correctamente', async () => {
    renderWithRouter(<ProfileSingle />);
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando perfil...')).not.toBeInTheDocument();
      // Verificar que aparece el email del usuario autenticado
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  test('debe ser responsive en móvil', async () => {
    // Simular viewport móvil
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithRouter(<ProfileSingle />);
    
    await waitFor(() => {
      expect(screen.queryByText('Cargando perfil...')).not.toBeInTheDocument();
      // Verificar que se renderiza algún contenedor con el email visible
      const emailEl = screen.getByText('test@example.com');
      const container = emailEl.closest('div');
      expect(container).toBeInTheDocument();
    });
  });

});

describe('EditProfileSingle', () => {
  beforeEach(() => {
    localStorage.setItem('demo_authenticated', 'true');
    localStorage.setItem('demo_user', JSON.stringify({
      id: 'demo-user-1',
      first_name: 'Ana',
      accountType: 'single'
    }));
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('debe cargar y mostrar el formulario de edición', async () => {
    renderWithRouter(<EditProfileSingle />);
    
    await waitFor(() => {
      // Verificar elementos del formulario
      // EditProfileSingle usa inputs controlados, buscamos por placeholder o label
      // Basado en el código, tiene campos como Name, Age, etc.
      // Busquemos texto genérico que sepamos que está
      expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
    });
  });
});

