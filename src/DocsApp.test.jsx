import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import DocsApp from './DocsApp';

describe('DocsApp', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders header with active Docs link and footer', () => {
    render(<DocsApp />);

    const docsLink = screen.getByRole('link', { name: 'Docs' });
    expect(docsLink).toBeTruthy();
    expect(docsLink.getAttribute('aria-current')).toBe('page');

    const githubLinks = screen.getAllByRole('link', { name: /GitHub/i });
    expect(githubLinks.length).toBeGreaterThan(0);
  });

  it('renders kicker, H1 title, and subhead', () => {
    render(<DocsApp />);

    expect(screen.getByText('DOCUMENTATION')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Render Flow Docs' })).toBeTruthy();
    expect(
      screen.getByText(
        'How the tool works, how each mode behaves, and what happens to your code once you hit convert.'
      )
    ).toBeTruthy();
  });

  it('renders table of contents sidebar groups and anchor links', () => {
    render(<DocsApp />);

    expect(screen.getByText('GETTING STARTED')).toBeTruthy();
    expect(screen.getByText('ARCHITECTURE')).toBeTruthy();
    expect(screen.getByText('ABOUT')).toBeTruthy();

    const overviewLinks = screen.getAllByRole('link', { name: 'Overview' });
    expect(overviewLinks.some((l) => l.getAttribute('href') === '#overview')).toBe(true);

    const modeLinks = screen.getAllByRole('link', { name: 'Using each mode' });
    expect(modeLinks.some((l) => l.getAttribute('href') === '#using-each-mode')).toBe(true);

    const howItWorksLinks = screen.getAllByRole('link', { name: 'How it works' });
    expect(howItWorksLinks.some((l) => l.getAttribute('href') === '#how-it-works')).toBe(true);

    const pipelinesLinks = screen.getAllByRole('link', { name: 'Render pipelines' });
    expect(pipelinesLinks.some((l) => l.getAttribute('href') === '#render-pipelines')).toBe(true);

    const privacyLinks = screen.getAllByRole('link', { name: 'Privacy & security' });
    expect(privacyLinks.some((l) => l.getAttribute('href') === '#privacy-security')).toBe(true);

    const creditsLinks = screen.getAllByRole('link', { name: 'Credits & stack' });
    expect(creditsLinks.some((l) => l.getAttribute('href') === '#credits-stack')).toBe(true);
  });

  it('renders all section headings and deepened copy', () => {
    render(<DocsApp />);

    // Overview
    expect(
      screen.getByText(
        /Render Flow turns HTML, Mermaid diagrams, and LaTeX into clean PNG images/i
      )
    ).toBeTruthy();

    // Badges for IN DEVELOPMENT
    const badges = screen.getAllByText('IN DEVELOPMENT');
    expect(badges.length).toBeGreaterThanOrEqual(2);

    // Callout
    expect(
      screen.getByText(
        "Nothing is uploaded, cached, or stored. Refresh the tab and it's gone — every conversion starts clean."
      )
    ).toBeTruthy();

    // Deepened How it works copy
    expect(
      screen.getByText(
        /An iframe provides structural isolation without needing a server-side sandbox/i
      )
    ).toBeTruthy();

    // Deepened Render pipelines copy
    expect(
      screen.getByText(
        /Target dimensions are read from explicit width and height properties on the body element/i
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Custom fonts are base64-encoded and embedded inline directly inside the SVG/i
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Rendering takes place in a container separated from global page styles/i
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        /A size guardrail caps any single conversion's canvas at 200 million pixels/i
      )
    ).toBeTruthy();

    // Deepened Privacy & security copy
    expect(
      screen.getByText(
        /This isolation is designed to protect your browser tab from your own pasted code/i
      )
    ).toBeTruthy();

    // Overview Diagram Caption
    expect(
      screen.getByText("Every mode follows this same shape — only step 2 differs.")
    ).toBeTruthy();

    // Credits links
    const unfollowLink = screen.getByRole('link', { name: '@unfollowaman' });
    expect(unfollowLink.getAttribute('href')).toBe('https://x.com/unfollowaman');
  });

  it('handles mobile dropdown navigation change', () => {
    render(<DocsApp />);

    const select = screen.getByRole('combobox', { name: 'Table of contents' });
    expect(select).toBeTruthy();

    fireEvent.change(select, { target: { value: '#how-it-works' } });
    expect(window.location.hash).toBe('#how-it-works');
  });
});
