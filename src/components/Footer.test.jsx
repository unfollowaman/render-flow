import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders marquee tracks with footer badges', () => {
    render(<Footer />);

    const badgeText = 'YOUR CODE STAYS ON YOUR DEVICE, ALWAYS';
    const badges = screen.getAllByText(badgeText);
    expect(badges.length).toBe(2);

    expect(screen.getAllByText('ONE TOOL FOR HTML, MERMAID, AND LATEX').length).toBe(2);
    expect(screen.getAllByText('FREE, AND IT STAYS THAT WAY').length).toBe(2);
  });

  it('renders social links section with correct attributes for external and mailto links', () => {
    render(<Footer />);

    const socialRow = screen.getByLabelText('Social links');
    expect(socialRow).toBeTruthy();

    const githubLink = screen.getByRole('link', { name: /Github/i });
    expect(githubLink).toBeTruthy();
    expect(githubLink.getAttribute('href')).toBe('https://github.com/unfollowaman');
    expect(githubLink.getAttribute('target')).toBe('_blank');
    expect(githubLink.getAttribute('rel')).toBe('noopener');

    const twitterLink = screen.getByRole('link', { name: /Twitter/i });
    expect(twitterLink).toBeTruthy();
    expect(twitterLink.getAttribute('href')).toBe('https://x.com/unfollowaman');
    expect(twitterLink.getAttribute('target')).toBe('_blank');
    expect(twitterLink.getAttribute('rel')).toBe('noopener');

    const gmailLink = screen.getByRole('link', { name: /Gmail/i });
    expect(gmailLink).toBeTruthy();
    expect(gmailLink.getAttribute('href')).toBe('mailto:unfollowaman@gmail.com');
    expect(gmailLink.getAttribute('target')).toBeNull();
    expect(gmailLink.getAttribute('rel')).toBeNull();
  });

  it('renders author handle correctly', () => {
    render(<Footer />);

    const handle = screen.getByText('@unfollowaman');
    expect(handle).toBeTruthy();
  });
});
