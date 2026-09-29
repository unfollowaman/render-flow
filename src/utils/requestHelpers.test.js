import { describe, it, expect, vi } from 'vitest';
import { runIfLatest } from './requestHelpers';

describe('runIfLatest', () => {
  it('executes callback when myRequestId matches latestRequestIdRef.current', () => {
    const latestRequestIdRef = { current: 5 };
    const callback = vi.fn(() => 'result');

    const res = runIfLatest(5, latestRequestIdRef, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(res).toBe('result');
  });

  it('does not execute callback when myRequestId does not match latestRequestIdRef.current', () => {
    const latestRequestIdRef = { current: 6 };
    const callback = vi.fn();

    const res = runIfLatest(5, latestRequestIdRef, callback);

    expect(callback).not.toHaveBeenCalled();
    expect(res).toBeUndefined();
  });

  it('handles null or undefined latestRequestIdRef gracefully', () => {
    const callback = vi.fn();

    expect(runIfLatest(5, null, callback)).toBeUndefined();
    expect(runIfLatest(5, undefined, callback)).toBeUndefined();
    expect(callback).not.toHaveBeenCalled();
  });
});
