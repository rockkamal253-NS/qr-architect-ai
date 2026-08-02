import { describe, it, expect } from 'vitest';
import { getContrastRatio, getQuietZoneThreshold } from '../constants.js';

describe('QR Reliability Hardening Unit Tests (P1.5)', () => {
  describe('getContrastRatio (WCAG 2.1 Formula)', () => {
    it('UT-03: calculates 21.0:1 for #000000 vs #FFFFFF', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21.0, 1);
    });

    it('UT-04: calculates ~7.87:1 contrast ratio for #333333 vs #CCCCCC', () => {
      const ratio = getContrastRatio('#333333', '#CCCCCC');
      expect(ratio).toBeGreaterThan(7.0);
      expect(ratio).toBeLessThan(8.5);
    });

    it('UT-05: calculates ~2.91:1 contrast ratio for #FF0000 vs #00FF00', () => {
      const ratio = getContrastRatio('#FF0000', '#00FF00');
      expect(ratio).toBeGreaterThan(2.0);
      expect(ratio).toBeLessThan(3.5);
    });

    it('UT-06: calculates same 21.0:1 ratio for #FFFFFF vs #000000 (reversed order)', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21.0, 1);
    });

    it('handles transparent background by falling back to white', () => {
      const ratio = getContrastRatio('#000000', 'transparent');
      expect(ratio).toBeCloseTo(21.0, 1);
    });

    it('handles shorthand hex codes (#000 and #fff)', () => {
      const ratio = getContrastRatio('#000', '#fff');
      expect(ratio).toBeCloseTo(21.0, 1);
    });
  });

  describe('getQuietZoneThreshold (Minimum 4-module Margin)', () => {
    it('UT-01: calculates quiet-zone threshold for 29x29 matrix, designSize = 600', () => {
      const mockQrInstance = {
        _qrCode: {
          getModuleCount: () => 29,
        },
      };

      const threshold = getQuietZoneThreshold(mockQrInstance, 600);
      // 4 * (600 / 29) = 82.75 -> Math.ceil = 83px
      expect(threshold).toBe(83);
    });

    it('UT-02: calculates quiet-zone threshold for 177x177 matrix, designSize = 800', () => {
      const mockQrInstance = {
        _qrCode: {
          getModuleCount: () => 177,
        },
      };

      const threshold = getQuietZoneThreshold(mockQrInstance, 800);
      // 4 * (800 / 177) = 18.079 -> Math.ceil = 19px
      expect(threshold).toBe(19);
    });

    it('returns 0 safely for null instance or missing module count', () => {
      expect(getQuietZoneThreshold(null, 600)).toBe(0);
      expect(getQuietZoneThreshold({}, 600)).toBe(0);
      expect(getQuietZoneThreshold({ _qrCode: {} }, 600)).toBe(0);
    });
  });
});
