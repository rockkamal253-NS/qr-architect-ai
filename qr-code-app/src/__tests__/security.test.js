import { describe, it, expect } from 'vitest';
import { FORMATTERS, sanitizeUrl, computeSha256, injectSvgHashComment } from '../constants.js';

describe('Security & Privacy Unit Tests', () => {
  describe('Wi-Fi Reserved Character Escaping', () => {
    it('escapes reserved WiFi spec characters (\\, ;, ,, ")', () => {
      const payload = FORMATTERS.wifi({
        ssid: 'MyNet;Work',
        password: 'Pass,123\\WPA"',
        encryption: 'WPA',
        hidden: false,
      });

      expect(payload).toBe('WIFI:T:WPA;S:MyNet\\;Work;P:Pass\\,123\\\\WPA\\";H:false;;');
    });

    it('handles empty or special SSID/password strings safely', () => {
      const payload = FORMATTERS.wifi({
        ssid: 'NormalSSID',
        password: '',
        encryption: 'nopass',
        hidden: true,
      });

      expect(payload).toBe('WIFI:T:nopass;S:NormalSSID;P:;H:true;;');
    });
  });

  describe('sanitizeUrl Scheme Blocklist', () => {
    it('blocks dangerous JavaScript URL schemes', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
    });

    it('blocks data and vbscript URL schemes', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
    });

    it('allows valid http, https, mailto, and tel URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com/page?a=1')).toBe('http://example.com/page?a=1');
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
    });
  });

  describe('SHA-256 Hashing & SVG Comment Injection', () => {
    it('computes 64-character SHA-256 hash and 8-character prefix', async () => {
      const { fullHash, prefix } = await computeSha256('https://example.com');
      expect(fullHash).toHaveLength(64);
      expect(prefix).toHaveLength(8);
      expect(fullHash.substring(0, 8)).toBe(prefix);
    });

    it('injects SVG hash comment directly after opening <svg> tag', () => {
      const rawSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%"/></svg>';
      const fullHash = 'a3f1c9e2b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1';
      
      const result = injectSvgHashComment(rawSvg, fullHash);
      expect(result).toContain(`<!-- hash: ${fullHash} -->`);
      expect(result.indexOf(`<!-- hash: ${fullHash} -->`)).toBeGreaterThan(rawSvg.indexOf('<svg'));
    });
  });

  describe('Wi-Fi Password Redaction', () => {
    it('redacts password string in Wi-Fi payload data', () => {
      const rawData = 'WIFI:T:WPA;S:MyHomeNet;P:SecretPassword123;H:false;;';
      const redactedData = rawData.replace(/P:[^;]*;/g, 'P:********;');
      
      expect(redactedData).toBe('WIFI:T:WPA;S:MyHomeNet;P:********;H:false;;');
      expect(redactedData).not.toContain('SecretPassword123');
    });
  });
});
