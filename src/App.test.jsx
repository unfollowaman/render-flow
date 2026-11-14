import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { expect, test, vi } from 'vitest';

test('renders App component', () => {
  render(<App />);
  const headerElement = screen.getByText(/Render Flow/i);
  expect(headerElement).toBeTruthy();
});

test('tapping a feature card switches mode and scrolls to input', async () => {
  const scrollIntoViewMock = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

  render(<App />);

  // Wait for lazy converter to load
  await screen.findByRole('tablist', { name: /input mode selector/i }, { timeout: 4000 });

  const latexButtons = screen.getAllByRole('button', { name: /Try LaTeX Renderer for LaTeX to Image/i });
  fireEvent.click(latexButtons[0]);

  await waitFor(() => {
    expect(document.title).toBe('LaTeX to PNG Converter');
  });
  expect(scrollIntoViewMock).toHaveBeenCalled();
});
