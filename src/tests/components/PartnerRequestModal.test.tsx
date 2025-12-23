import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartnerRequestModal } from '@/components/clubs/PartnerRequestModal';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  }
}));

const mockToast = vi.fn();
// Mock toast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('PartnerRequestModal', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('renders correctly', async () => {
    render(<PartnerRequestModal />);
    
    // Open modal
    fireEvent.click(screen.getByText('Solicitar Partner'));
    
    await waitFor(() => {
       expect(screen.getByText('Únete como Partner')).toBeInTheDocument();
     });
     expect(screen.getByLabelText(/Nombre del Club/i)).toBeInTheDocument();
   });

   it('validates required fields', async () => {
     render(<PartnerRequestModal />);
     
     // Open modal
     fireEvent.click(screen.getByText('Solicitar Partner'));
     
     await waitFor(() => {
       expect(screen.getByText('Únete como Partner')).toBeInTheDocument();
     });
 
     const submitButton = screen.getByText('Enviar Solicitud');
    fireEvent.click(submitButton);

    // HTML5 validation prevents submission if fields are empty, 
    // so toast should NOT be called
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('submits form successfully', async () => {
     render(<PartnerRequestModal />);
     
     // Open modal
     fireEvent.click(screen.getByText('Solicitar Partner'));
     
     await waitFor(() => {
       expect(screen.getByText('Únete como Partner')).toBeInTheDocument();
     });
     
     fireEvent.change(screen.getByLabelText(/Nombre del Club/i), { target: { value: 'Test Club' } });
    fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: 'Mexico City' } });
    fireEvent.change(screen.getByLabelText(/Dirección/i), { target: { value: 'Reform 123' } });
    fireEvent.change(screen.getByLabelText(/Nombre de Contacto/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/Email Corporativo/i), { target: { value: 'test@club.com' } });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '5512345678' } });
    
    const submitButton = screen.getByText('Enviar Solicitud');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Solicitud enviada"
      }));
    });
  });
});
