import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/tests/setup/test-utils';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Shop from '@/pages/Shop';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/features/auth/useAuth');
vi.mock('@/hooks/useToast');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/config/app-config', () => ({
  AppConfig: {
    features: {
      premiumFeatures: true,
    },
    supabase: {
        url: 'https://test.supabase.co',
        anonKey: 'test-key'
    }
  },
}));

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
  };
});

describe('Shop Page', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockPackages = [
    {
      id: 'pkg-1',
      name: 'Starter Pack',
      cmpx_amount: 100,
      bonus_cmpx: 0,
      price_mxn: 50,
      is_popular: false,
      description: 'Starter package',
      display_order: 1,
      is_active: true,
    },
    {
      id: 'pkg-2',
      name: 'Pro Pack',
      cmpx_amount: 500,
      bonus_cmpx: 50,
      price_mxn: 200,
      is_popular: true,
      description: 'Pro package',
      display_order: 2,
      is_active: true,
    },
  ];

  const mockPurchases = [
    {
      id: 'pur-1',
      user_id: 'user-123',
      package_id: 'pkg-1',
      total_cmpx: 100,
      bonus_cmpx: 0,
      price_mxn: 50,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
  ];

  const mockToast = vi.fn();

  // Helper to create a chainable mock object
  const createMockChain = (data: any = null, error: any = null) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
      then: (resolve: any) => Promise.resolve({ data, error }).then(resolve),
    };
    // Override specific terminators if needed
    (chain.order as any).mockReturnValue(chain);
    (chain.limit as any).mockReturnValue(Promise.resolve({ data, error }));
    // For packages query which ends with order()
    // We need to make order return a promise resolving to data if it's the end of chain
    // But in the implementation below, we specifically mock the chain structure.
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams(); // Reset params
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: () => true,
    });
    (useToast as any).mockReturnValue({ toast: mockToast });

    // Setup Supabase mocks
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'cmpx_shop_packages') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockPackages, error: null }),
            }),
          }),
        };
      }
      if (table === 'cmpx_purchases') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockPurchases, error: null }),
              }),
            }),
          }),
        };
      }
      // Fallback for other tables or if logic changes
      return createMockChain([]);
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'fake-token' } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<Shop />);
    expect(screen.getByText(/Cargando shop.../i)).toBeInTheDocument();
  });

  it('renders packages after loading', async () => {
    render(<Shop />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Cargando shop.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Shop CMPX Tokens')).toBeInTheDocument();
    expect(screen.getByText('Starter Pack')).toBeInTheDocument();
    expect(screen.getByText('Pro Pack')).toBeInTheDocument();
    expect(screen.getByText('POPULAR')).toBeInTheDocument();
  });

  it('renders user purchases when authenticated', async () => {
    render(<Shop />);
    
    await waitFor(() => {
      expect(screen.getByText('Mis Compras')).toBeInTheDocument();
    });

    // 100 CMPX appears in the package card AND in the purchase history
    const cmpxElements = screen.getAllByText(/100 CMPX/);
    expect(cmpxElements.length).toBeGreaterThanOrEqual(2);
    
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  it('redirects to auth if trying to buy without login', async () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: () => false,
    });

    render(<Shop />);
    
    await waitFor(() => {
      expect(screen.getByText('Starter Pack')).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole('button', { name: /Comprar/i });
    fireEvent.click(buyButtons[0]);

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Inicia sesión',
      variant: 'destructive',
    }));
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('initiates purchase flow correctly', async () => {
    const mockCheckoutUrl = 'https://checkout.stripe.com/test';
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { url: mockCheckoutUrl },
      error: null,
    });

    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<Shop />);
    
    await waitFor(() => {
      expect(screen.getByText('Starter Pack')).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole('button', { name: /Comprar/i });
    fireEvent.click(buyButtons[0]);

    expect(buyButtons[0]).toHaveTextContent('Procesando...');

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-cmpx-checkout',
        expect.objectContaining({
          body: { package_id: 'pkg-1' },
        })
      );
    });

    expect(window.location.href).toBe(mockCheckoutUrl);
    (window as any).location = originalLocation;
  });

  it('handles purchase errors', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: new Error('Function error'),
    });

    render(<Shop />);
    
    await waitFor(() => {
      expect(screen.getByText('Starter Pack')).toBeInTheDocument();
    });

    const buyButtons = screen.getAllByRole('button', { name: /Comprar/i });
    fireEvent.click(buyButtons[0]);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Function error',
        variant: 'destructive',
      }));
    });
  });

  it('handles empty package list gracefully', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'cmpx_shop_packages') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        // Return a safe chain for other queries (like purchases)
        return createMockChain([]);
    });

    render(<Shop />);
    
    await waitFor(() => {
      expect(screen.queryByText(/Cargando shop.../i)).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Starter Pack')).not.toBeInTheDocument();
  });

  it('handles successful purchase return params', async () => {
    mockSearchParams = new URLSearchParams({ success: 'true', purchase_id: '123' });
    
    render(<Shop />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Compra exitosa',
      }));
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/shop', { replace: true });
  });

  it('handles canceled purchase return params', async () => {
    mockSearchParams = new URLSearchParams({ canceled: 'true' });
    
    render(<Shop />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Compra cancelada',
        variant: 'destructive',
      }));
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/shop', { replace: true });
  });
});
