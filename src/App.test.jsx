import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders App component', () => {
  render(<App />);
  const headerElement = screen.getByText(/html2png/i);
  expect(headerElement).toBeTruthy();
});
