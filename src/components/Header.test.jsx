import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders logo image and text correctly', () => {
    render(<Header />);

    const logoImg = screen.getByAltText('Logo');
    expect(logoImg).toBeTruthy();

    const logoText = screen.getByText('render-flow');
    expect(logoText).toBeTruthy();
  });

  it('renders navigation links with correct attributes', () => {
    render(<Header />);

    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toBeTruthy();
    expect(githubLink.getAttribute('href')).toBe('https://github.com');
    expect(githubLink.getAttribute('target')).toBe('_blank');
    expect(githubLink.getAttribute('rel')).toBe('noopener');

    const deployLink = screen.getByRole('link', { name: 'Deploy' });
    expect(deployLink).toBeTruthy();
    expect(deployLink.getAttribute('href')).toBe('https://pages.github.com');
    expect(deployLink.getAttribute('target')).toBe('_blank');
    expect(deployLink.getAttribute('rel')).toBe('noopener');
  });
});
