import { describe, it, expect } from 'vitest';
import { getContrastRatio, getQuietZoneThreshold } from '../constants.js';

describe('QR Reliability Hardening Unit Tests (P1.5)', () => {
  describe('getContrastRatio (WCAG 2.1 Formula)', () => {
    it('calculates 21:1 for pure black (#000000) on white (#ffffff)', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('calculates ~1.6:1 for low-contrast grays (#777777 on #999999)', () => {
      const ratio = getContrastRatio('#777777', '#999999');
      expect(ratio).toBeGreaterThan(1.0);
      expect(ratio).toBeLessThan(3.0);
    });

    it('handles transparent background by falling back to white', () => {
      const ratio = getContrastRatio('#000000', 'transparent');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('handles shorthand hex codes (#000 and #fff)', () => {
      const ratio = getContrastRatio('#000', '#fff');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('handles identical colors returning 1:1 ratio', () => {
      const ratio = getContrastRatio('#4f46e5', '#4f46e5');
      expect(ratio).toBeCloseTo(1, 1);
    });
  });

  describe('getQuietZoneThreshold (Minimum 4-module Margin)', () => {
    it('calculates quiet-zone threshold for module count = 29 and size = 600px', () => {
      const mockQrInstance = {
        _qrCode: {
          getModuleCount: () => 29,
        },
      };

      const threshold = getQuietZoneThreshold(mockQrInstance, 600);
      // 4 * (600 / 29) = 82.75 -> Math.ceil = 83px
      expect(threshold).toBe(83);
    });

    it('supports alternative _qr.moduleCount property layout', () => {
      const mockQrInstance = {
        _qr: {
          moduleCount: 33,
        },
      };

      const threshold = getQuietZoneThreshold(mockQrInstance, 600);
      // 4 * (600 / 33) = 72.72 -> Math.ceil = 73px
      expect(threshold).toBe(73);
    });

    it('returns 0 safely for null instance or missing module count', () => {
      expect(getQuietZoneThreshold(null, 600)).toBe(0);
      expect(getQuietZoneThreshold({}, 600)).toBe(0);
      expect(getQuietZoneThreshold({ _qrCode: {} }, 600)).toBe(0);
    });
  });
});
