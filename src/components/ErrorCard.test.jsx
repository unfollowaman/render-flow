import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorCard } from './ErrorCard';

describe('ErrorCard', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders the error message and static content correctly', () => {
    const errorMessage = 'Invalid HTML structure';
    const { container } = render(<ErrorCard error={errorMessage} />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Rendering failed')).toBeTruthy();
    const iconElement = screen.getByText('⚠');
    expect(iconElement.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText(errorMessage)).toBeTruthy();

    const cardElement = container.querySelector('.neu-card');
    expect(cardElement).not.toBeNull();
  });

  it('handles empty error message gracefully', () => {
    render(<ErrorCard error="" />);

    expect(screen.getByText('Rendering failed')).toBeTruthy();
    expect(screen.getByText('⚠')).toBeTruthy();
  });

  it('renders non-string error values if passed', () => {
    render(<ErrorCard error={404} />);

    expect(screen.getByText('404')).toBeTruthy();
  });

  it('allows copying error text to clipboard with status announcement', async () => {
    vi.useFakeTimers();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const errorMessage = 'SyntaxError: Unexpected token < in JSON at position 0';
    render(<ErrorCard error={errorMessage} />);

    const copyBtn = screen.getByRole('button', { name: /copy error details to clipboard/i });
    expect(copyBtn).toBeTruthy();
    expect(copyBtn.textContent).toBe('Copy error');

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(errorMessage);
    expect(copyBtn.textContent).toBe('✓ Copied!');

    const statusRegion = screen.getByRole('status', { name: /copy error status/i });
    expect(statusRegion.textContent).toBe('Error message copied to clipboard.');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(copyBtn.textContent).toBe('Copy error');
    expect(statusRegion.textContent).toBe('');

    vi.useRealTimers();
  });
});
