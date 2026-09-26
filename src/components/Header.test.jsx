import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders skip to main content link targeting #main-content', () => {
    render(<Header />);

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
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

    const githubLink = screen.getByRole('link', { name: 'GitHub (opens in a new tab)' });
    expect(githubLink).toBeTruthy();
    expect(githubLink.getAttribute('href')).toBe('https://github.com');
    expect(githubLink.getAttribute('target')).toBe('_blank');
    expect(githubLink.getAttribute('rel')).toBe('noopener');

    const docsLink = screen.getByRole('link', { name: 'Docs' });
    expect(docsLink).toBeTruthy();
    expect(docsLink.getAttribute('href')).toBe('docs.html');
    expect(docsLink.getAttribute('aria-current')).toBeNull();
  });

  it('marks Docs as active when activePage is "docs"', () => {
    render(<Header activePage="docs" />);

    const docsLink = screen.getByRole('link', { name: 'Docs' });
    expect(docsLink).toBeTruthy();
    expect(docsLink.getAttribute('aria-current')).toBe('page');
  });
});
