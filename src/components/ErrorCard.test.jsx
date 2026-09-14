import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
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
});
