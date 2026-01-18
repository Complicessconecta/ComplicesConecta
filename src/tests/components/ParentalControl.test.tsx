import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ParentalControl } from "@/components/profiles/shared/ParentalControl";

// Mock dependencies
const mockToast = vi.fn();
vi.mock("@/hooks/useToast", () => ({
  toast: (...args: any[]) => mockToast(...args),
}));

vi.mock("@/hooks/usePersistedState", () => ({
  usePersistedState: (key: string, initialValue: any) => {
    let value = initialValue;
    const setValue = (newValue: any) => {
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
    expect(screen.getByText(/Control Parental/i)).toBeInTheDocument();
    expect(screen.getByText(/Contenido restringido/i)).toBeInTheDocument();
  });

  it("shows PIN input when unlock button is clicked", () => {
    render(<ParentalControl {...defaultProps} />);
    fireEvent.click(
      screen.getByText(/Desbloquear/i) as unknown as Element,
    );
    expect(screen.getByText(/Ingresa PIN/i)).toBeInTheDocument();
  });

  it("handles correct PIN entry", () => {
    render(<ParentalControl {...defaultProps} />);

    // Open PIN input
    fireEvent.click(
      screen.getByText(/Desbloquear/i) as unknown as Element,
    );

    // Enter PIN "1234" (default mock)
    const input = screen.getByPlaceholderText("••••");
    fireEvent.change(input as unknown as Element, {
      target: { value: "1234" },
    });

    // Click Confirm
    fireEvent.click(screen.getByText(/Confirmar/i) as unknown as Element);

    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
    expect(defaultProps.onUnlock).toHaveBeenCalled();
  });

  it("handles incorrect PIN entry and lockout", async () => {
    render(<ParentalControl {...defaultProps} />);
    fireEvent.click(
      screen.getByText(/Desbloquear/i) as unknown as Element,
    );
    const input = screen.getByPlaceholderText("••••");
    const confirmBtn = screen.getByText(/Confirmar/i);

    // Attempt 1
    fireEvent.change(input as unknown as Element, {
      target: { value: "0000" },
    });
    fireEvent.click(confirmBtn as unknown as Element);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "PIN incorrecto",
      }),
    );

    // Attempt 2
    fireEvent.change(input as unknown as Element, {
      target: { value: "0000" },
    });
    fireEvent.click(confirmBtn as unknown as Element);

    // Attempt 3 (Lockout)
    fireEvent.change(input as unknown as Element, {
      target: { value: "0000" },
    });
    fireEvent.click(confirmBtn as unknown as Element);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Bloqueo temporal",
        variant: "destructive",
      }),
    );
  });

  it("submits PIN on Enter key press", () => {
    render(<ParentalControl {...defaultProps} />);
    fireEvent.click(
      screen.getByText(/Desbloquear/i) as unknown as Element,
    );
    const input = screen.getByPlaceholderText("••••");

    fireEvent.change(input as unknown as Element, {
      target: { value: "1234" },
    });
    fireEvent.keyDown(input as unknown as Element, {
      key: "Enter",
      code: "Enter",
    });

    expect(defaultProps.onToggle).toHaveBeenCalledWith(false);
  });
});
