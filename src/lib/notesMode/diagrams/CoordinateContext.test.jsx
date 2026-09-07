import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  CoordinateContext,
  useCoordinateContext,
  createCoordinateTransformers,
  resolveLabelPosition,
  LABEL_OFFSETS
} from './CoordinateContext';

describe('CoordinateContext Helpers & Hooks', () => {
  describe('useCoordinateContext', () => {
    it('throws error when called outside CoordinateContext.Provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useCoordinateContext());
      }).toThrow('Coordinate components (Point, LineSegment, Shape) must be rendered inside a CoordinatePlane.');
      consoleSpy.mockRestore();
    });

    it('returns context value when rendered inside CoordinateContext.Provider', () => {
      const mockValue = {
        toSvgX: (x) => x,
        toSvgY: (y) => y,
        width: 400,
        height: 400
      };

      const wrapper = ({ children }) => (
        <CoordinateContext.Provider value={mockValue}>
          {children}
        </CoordinateContext.Provider>
      );

      const { result } = renderHook(() => useCoordinateContext(), { wrapper });
      expect(result.current).toBe(mockValue);
    });
  });

  describe('createCoordinateTransformers', () => {
    it('uses default values when no parameters are provided', () => {
      const transformers = createCoordinateTransformers();

      expect(transformers.xRange).toEqual([-5, 5]);
      expect(transformers.yRange).toEqual([-5, 5]);
      expect(transformers.width).toBe(400);
      expect(transformers.height).toBe(400);
      expect(transformers.padding).toBe(40);
      expect(transformers.xMin).toBe(-5);
      expect(transformers.xMax).toBe(5);
      expect(transformers.yMin).toBe(-5);
      expect(transformers.yMax).toBe(5);
      expect(transformers.scaleX).toBe(32); // (400 - 80) / 10 = 32
      expect(transformers.scaleY).toBe(32);
    });

    it('accurately maps data coordinates to SVG coordinates at boundaries and origin', () => {
      // Default: xRange=[-5,5], yRange=[-5,5], width=400, height=400, padding=40
      // innerWidth = 320, scaleX = 32
      // innerHeight = 320, scaleY = 32
      const { toSvgX, toSvgY } = createCoordinateTransformers();

      // xMin (-5) -> padding (40)
      expect(toSvgX(-5)).toBe(40);
      // Origin x (0) -> 40 + 5 * 32 = 200
      expect(toSvgX(0)).toBe(200);
      // xMax (5) -> 40 + 10 * 32 = 360
      expect(toSvgX(5)).toBe(360);

      // yMin (-5) -> height - padding (360)
      expect(toSvgY(-5)).toBe(360);
      // Origin y (0) -> 360 - 5 * 32 = 200
      expect(toSvgY(0)).toBe(200);
      // yMax (5) -> 360 - 10 * 32 = 40
      expect(toSvgY(5)).toBe(40);
    });

    it('correctly calculates transformations with custom ranges, dimensions, and padding', () => {
      // Custom: xRange=[0, 10], yRange=[-100, 100], width=500, height=300, padding=50
      // innerWidth = 400, scaleX = 400 / 10 = 40
      // innerHeight = 200, scaleY = 200 / 200 = 1
      const transformers = createCoordinateTransformers({
        xRange: [0, 10],
        yRange: [-100, 100],
        width: 500,
        height: 300,
        padding: 50
      });

      expect(transformers.scaleX).toBe(40);
      expect(transformers.scaleY).toBe(1);

      // x=0 -> padding=50
      expect(transformers.toSvgX(0)).toBe(50);
      // x=5 -> 50 + 5 * 40 = 250
      expect(transformers.toSvgX(5)).toBe(250);
      // x=10 -> 50 + 10 * 40 = 450
      expect(transformers.toSvgX(10)).toBe(450);

      // y=-100 -> height - padding = 250
      expect(transformers.toSvgY(-100)).toBe(250);
      // y=0 -> 250 - 100 * 1 = 150
      expect(transformers.toSvgY(0)).toBe(150);
      // y=100 -> 250 - 200 * 1 = 50
      expect(transformers.toSvgY(100)).toBe(50);
    });
  });

  describe('LABEL_OFFSETS', () => {
    it('contains all required label position offsets with valid properties', () => {
      const requiredPositions = [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
        'top',
        'bottom',
        'left',
        'right'
      ];

      for (const pos of requiredPositions) {
        expect(LABEL_OFFSETS).toHaveProperty(pos);
        const offset = LABEL_OFFSETS[pos];
        expect(typeof offset.dx).toBe('number');
        expect(typeof offset.dy).toBe('number');
        expect(typeof offset.textAnchor).toBe('string');
        expect(typeof offset.dominantBaseline).toBe('string');
      }
    });
  });

  describe('resolveLabelPosition', () => {
    it('returns default top-right when neighbors list is empty or undefined', () => {
      expect(resolveLabelPosition(0, 0)).toBe('top-right');
      expect(resolveLabelPosition(0, 0, [])).toBe('top-right');
    });

    it('returns default top-right when all neighbors are beyond threshold distance', () => {
      const neighbors = [{ x: 10, y: 10 }];
      expect(resolveLabelPosition(0, 0, neighbors, 1.5)).toBe('top-right');
    });

    it('ignores self point if present in neighbors list', () => {
      const neighbors = [{ x: 0, y: 0 }];
      expect(resolveLabelPosition(0, 0, neighbors)).toBe('top-right');
    });

    it('resolves position to top-right when close neighbor is to bottom-left (vecX >= 0, vecY >= 0)', () => {
      // Point at (1, 1), neighbor at (0.5, 0.5) -> dx = 0.5, dy = 0.5 -> vecX > 0, vecY > 0
      const neighbors = [{ x: 0.5, y: 0.5 }];
      expect(resolveLabelPosition(1, 1, neighbors)).toBe('top-right');
    });

    it('resolves position to top-left when close neighbor is to bottom-right (vecX < 0, vecY >= 0)', () => {
      // Point at (1, 1), neighbor at (1.5, 0.5) -> dx = -0.5, dy = 0.5 -> vecX < 0, vecY > 0
      const neighbors = [{ x: 1.5, y: 0.5 }];
      expect(resolveLabelPosition(1, 1, neighbors)).toBe('top-left');
    });

    it('resolves position to bottom-left when close neighbor is to top-right (vecX < 0, vecY < 0)', () => {
      // Point at (1, 1), neighbor at (1.5, 1.5) -> dx = -0.5, dy = -0.5 -> vecX < 0, vecY < 0
      const neighbors = [{ x: 1.5, y: 1.5 }];
      expect(resolveLabelPosition(1, 1, neighbors)).toBe('bottom-left');
    });

    it('resolves position to bottom-right when close neighbor is to top-left (vecX >= 0, vecY < 0)', () => {
      // Point at (1, 1), neighbor at (0.5, 1.5) -> dx = 0.5, dy = -0.5 -> vecX > 0, vecY < 0
      const neighbors = [{ x: 0.5, y: 1.5 }];
      expect(resolveLabelPosition(1, 1, neighbors)).toBe('bottom-right');
    });

    it('returns top-right when close neighbors are perfectly balanced (vecX === 0 && vecY === 0)', () => {
      // Point at (0, 0), two symmetric neighbors at (0.5, 0) and (-0.5, 0)
      const neighbors = [{ x: 0.5, y: 0 }, { x: -0.5, y: 0 }];
      expect(resolveLabelPosition(0, 0, neighbors)).toBe('top-right');
    });

    it('respects custom threshold value', () => {
      const neighbors = [{ x: 2, y: 0 }]; // distance = 2
      // Default threshold (1.5) ignores neighbor
      expect(resolveLabelPosition(0, 0, neighbors, 1.5)).toBe('top-right');
      // Custom threshold (2.5) includes neighbor -> dx = -2, dy = 0 -> vecX < 0, vecY = 0 -> top-left
      expect(resolveLabelPosition(0, 0, neighbors, 2.5)).toBe('top-left');
    });
  });
});
