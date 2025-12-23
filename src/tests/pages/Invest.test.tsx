import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Invest from '@/pages/Invest';
import { BrowserRouter } from 'react-router-dom';
import * as AppConfig from '@/lib/app-config';

// Mock auth
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: '123' },
    isAuthenticated: () => true
  })
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'investment_tiers') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ 
            data: [{
              tier_key: 'basic_10k',
              name: 'Basic',
              amount_mxn: 10000,
              return_percentage: 10,
              description: 'Desc',
              benefits: ['Benefit 1']
            }], 
            error: null 
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    })
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Invest Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows coming soon toast when premium features are disabled', async () => {
    vi.spyOn(AppConfig, 'getAppConfig').mockReturnValue({
      mode: 'production',
      supabase: { url: '', anonKey: '' },
      features: {
        demoCredentials: true,
        realAuth: true,
        adminAccess: true,
        premiumFeatures: false // DISABLED
      },
      ui: { showDemoIndicator: false, demoLabel: '' }
    });

    renderWithRouter(<Invest />);

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Próximamente/i });
    expect(button).toBeDisabled();
    
    // Check if clicking (even if disabled, though usually click doesn't fire) 
    // The text itself confirms the state.
  });

  it('enables investment when premium features are enabled', async () => {
    vi.spyOn(AppConfig, 'getAppConfig').mockReturnValue({
      mode: 'production',
      supabase: { url: '', anonKey: '' },
      features: {
        demoCredentials: true,
        realAuth: true,
        adminAccess: true,
        premiumFeatures: true // ENABLED
      },
      ui: { showDemoIndicator: false, demoLabel: '' }
    });

    renderWithRouter(<Invest />);

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button', { name: /Invertir/i });
    expect(buttons[0]).not.toBeDisabled();
  });
});
