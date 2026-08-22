import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderImageToPngBlobUrl } from './canvasToBlob';

describe('renderImageToPngBlobUrl', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('throws an error when scaled image area exceeds 200,000,000 pixels', async () => {
    const mockImg = {};
    const intrinsicWidth = 10000;
    const intrinsicHeight = 10000;
    const customErrorMessage = 'Image resolution is too large to render';

    // finalWidth * finalHeight = (10000 * 2) * (10000 * 2) = 400,000,000 > 200,000,000
    await expect(
      renderImageToPngBlobUrl(mockImg, intrinsicWidth, intrinsicHeight, customErrorMessage)
    ).rejects.toThrow(customErrorMessage);
  });

  it('throws an error when 2D canvas context is not available', async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

    const mockImg = {};
    await expect(
      renderImageToPngBlobUrl(mockImg, 100, 100, 'Error')
    ).rejects.toThrow('Failed to get canvas context.');
  });

  it('successfully renders image to PNG blob URL without fillStyle', async () => {
    const mockCtx = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: null,
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);

    const fakeBlob = new Blob(['dummy content'], { type: 'image/png' });
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback, type) => {
      expect(type).toBe('image/png');
      callback(fakeBlob);
    });

    const mockObjectUrl = 'blob:http://localhost/fake-blob-id';
    URL.createObjectURL = vi.fn().mockReturnValue(mockObjectUrl);

    const mockImg = { src: 'fake-image.png' };
    const intrinsicWidth = 100;
    const intrinsicHeight = 150;

    const result = await renderImageToPngBlobUrl(
      mockImg,
      intrinsicWidth,
      intrinsicHeight,
      'Error'
    );

    expect(result).toEqual({
      resultObjectUrl: mockObjectUrl,
      finalWidth: 200,
      finalHeight: 300,
    });

    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockImg, 0, 0, 200, 300);
    expect(mockCtx.fillRect).not.toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('fills background when fillStyle is provided', async () => {
    const mockCtx = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: null,
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);

    const fakeBlob = new Blob(['dummy content'], { type: 'image/png' });
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback) => {
      callback(fakeBlob);
    });

    URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-blob-id');

    const mockImg = { src: 'fake-image.png' };
    const fillStyle = '#ffffff';

    await renderImageToPngBlobUrl(
      mockImg,
      50,
      50,
      'Error',
      fillStyle
    );

    expect(mockCtx.fillStyle).toBe(fillStyle);
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockImg, 0, 0, 100, 100);
  });

  it('rejects with error when toBlob produces a null blob', async () => {
    const mockCtx = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: null,
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback) => {
      callback(null);
    });

    const mockImg = {};
    await expect(
      renderImageToPngBlobUrl(mockImg, 100, 100, 'Error')
    ).rejects.toThrow('Failed to create PNG blob.');
  });
});
