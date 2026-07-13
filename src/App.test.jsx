import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders App component', () => {
  render(<App />);
  const headerElement = screen.getByText(/Render Flow/i);
  expect(headerElement).toBeTruthy();
});
