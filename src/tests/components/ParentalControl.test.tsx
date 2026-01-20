import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ParentalControl } from "@/components/profiles/shared/ParentalControl";

// Mock dependencies
const mockToast = vi.fn();
vi.mock("@/hooks/useToast", () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

vi.mock("@/hooks/usePersistedState", () => ({
  usePersistedState: <T,>(key: string, initialValue: T) => {
    let value = initialValue;
    const setValue = (newValue: T) => {
      value = newValue;
    };
    return [value, setValue];
  },
}));

describe("ParentalControl", () => {
  const defaultProps = {
    isLocked: true,
    onToggle: vi.fn(),
    onUnlock: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders locked state correctly", () => {
    render(<ParentalControl {...defaultProps} />);
    expect(screen.getAllByText(/Control Parental/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Contenido restringido/i)).toBeInTheDocument();
  });

  it("shows PIN input when unlock button is clicked", () => {
    render(<ParentalControl {...defaultProps} />);
    fireEvent.click(screen.getByText(/Desbloquear/i));
    expect(screen.getByText(/Ingresa PIN/i)).toBeInTheDocument();
  });

  it("handles correct PIN entry", () => {
    render(<ParentalControl {...defaultProps} />);

    // Open PIN input
    fireEvent.click(screen.getByText(/Desbloquear/i));

    // Enter PIN "1234" (default mock)
    const input = screen.getByPlaceholderText("••••");
    fireEvent.change(input, {
      target: { value: "1234" },
    });

    // Click Confirm
    fireEvent.click(screen.getByText(/Confirmar/i));

    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
    expect(defaultProps.onUnlock).toHaveBeenCalled();
  });

  it("handles incorrect PIN entry and lockout", async () => {
    render(<ParentalControl {...defaultProps} />);
    fireEvent.click(screen.getByText(/Desbloquear/i));
    const input = screen.getByPlaceholderText("••••");
    const confirmBtn = screen.getByText(/Confirmar/i);

    // Attempt 1
    fireEvent.change(input, {
      target: { value: "0000" },
    });
    fireEvent.click(confirmBtn);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "PIN incorrecto",
      }),
    );

    // Attempt 2
    fireEvent.change(input, {
      target: { value: "0000" },
    });
    fireEvent.click(confirmBtn);

    // Attempt 3 (Lockout)
    fireEvent.change(input, {
      target: { value: "0000" },
    });
    fireEvent.click(confirmBtn);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Bloqueo temporal",
        variant: "destructive",
      }),
    );
  });

  it("submits PIN on Enter key press", () => {
    render(<ParentalControl {...defaultProps} />);
    fireEvent.click(screen.getByText(/Desbloquear/i));
    const input = screen.getByPlaceholderText("••••");

    fireEvent.change(input, {
      target: { value: "1234" },
    });
    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
    });

    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
  });

  it("permite re-bloquear después de desbloquear", () => {
    const { rerender } = render(<ParentalControl {...defaultProps} />);

    fireEvent.click(screen.getByText(/Desbloquear/i));
    const input = screen.getByPlaceholderText("••••");
    fireEvent.change(input, {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByText(/Confirmar/i));

    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);

    rerender(
      <ParentalControl
        {...defaultProps}
        isLocked={false}
      />,
    );

    fireEvent.click(screen.getByText(/Bloquear Ahora/i));
    expect(defaultProps.onToggle).toHaveBeenCalledWith(true);

    rerender(
      <ParentalControl
        {...defaultProps}
        isLocked={true}
      />,
    );

    expect(screen.getByText(/Desbloquear/i)).toBeInTheDocument();
  });
});
