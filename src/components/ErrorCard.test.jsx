import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorCard } from './ErrorCard';

describe('ErrorCard', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('handles empty error message gracefully and hides copy button', () => {
    render(<ErrorCard error="" />);

    expect(screen.getByText('Rendering failed')).toBeTruthy();
    expect(screen.getByText('⚠')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy error details to clipboard' })).toBeNull();
  });

  it('renders non-string error values if passed', () => {
    render(<ErrorCard error={404} />);

    expect(screen.getByText('404')).toBeTruthy();
  });

  it('copies error text to clipboard and shows temporary visual feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const errorMessage = 'SyntaxError: Unexpected token in JSON';
    render(<ErrorCard error={errorMessage} />);

    const copyBtn = screen.getByRole('button', { name: 'Copy error details to clipboard' });
    expect(copyBtn).toBeTruthy();
    expect(copyBtn.textContent).toBe('Copy error');

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeTextMock).toHaveBeenCalledWith(errorMessage);
    expect(screen.getByText('✓ Copied!')).toBeTruthy();
    expect(screen.getByText('Error details copied to clipboard.')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Copy error')).toBeTruthy();
  });
});
