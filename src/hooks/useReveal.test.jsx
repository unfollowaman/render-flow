import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, act, screen, cleanup } from '@testing-library/react';
import useReveal from './useReveal';

function TestComponent({ threshold }) {
  const [ref, visible] = useReveal({ threshold });
  return <div ref={ref} data-testid="reveal-target" data-visible={visible ? 'true' : 'false'} />;
}

describe('useReveal hook', () => {
  let observerCallback = null;
  let mockObserve = vi.fn();
  let mockDisconnect = vi.fn();
  let originalIntersectionObserver = window.IntersectionObserver;
  let originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    window.IntersectionObserver = vi.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn()
      };
    });

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  });

  afterEach(() => {
    cleanup();
    window.IntersectionObserver = originalIntersectionObserver;
    window.matchMedia = originalMatchMedia;
  });

  it('updates visible state based on intersection status on scroll in and out', () => {
    render(<TestComponent />);
    const target = screen.getByTestId('reveal-target');

    expect(mockObserve).toHaveBeenCalledWith(target);
    expect(target.getAttribute('data-visible')).toBe('false');

    // Scroll in
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });
    expect(target.getAttribute('data-visible')).toBe('true');

    // Scroll out
    act(() => {
      observerCallback([{ isIntersecting: false }]);
    });
    expect(target.getAttribute('data-visible')).toBe('false');

    // Scroll in again
    act(() => {
      observerCallback([{ isIntersecting: true }]);
    });
    expect(target.getAttribute('data-visible')).toBe('true');
  });

  it('sets visible to true immediately when prefers-reduced-motion is enabled', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query
    }));

    render(<TestComponent />);
    const target = screen.getByTestId('reveal-target');
    expect(target.getAttribute('data-visible')).toBe('true');
  });

  it('sets visible to true immediately when IntersectionObserver is not supported', () => {
    delete window.IntersectionObserver;

    render(<TestComponent />);
    const target = screen.getByTestId('reveal-target');
    expect(target.getAttribute('data-visible')).toBe('true');
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<TestComponent />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
