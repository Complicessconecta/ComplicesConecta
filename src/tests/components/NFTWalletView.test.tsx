import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NFTWalletView } from '@/components/tokens/NFTWalletView';

describe('NFTWalletView', () => {
  it('renders loading state initially', () => {
    render(<NFTWalletView />);
    expect(screen.getByText('Cargando colecciÃ³n NFT...')).toBeInTheDocument();
  });

  it('renders NFTs after loading', async () => {
    render(<NFTWalletView />);
    
    await waitFor(() => {
      expect(screen.getByText(/Tu ColecciÃ³n NFT/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check if NFTs are rendered (should be 4)
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});

