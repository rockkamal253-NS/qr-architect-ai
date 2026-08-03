import { describe, it, expect } from 'vitest';
import { FORMATTERS, sanitizeUrl, computeSha256, injectSvgHashComment, escapeRegExp, redactWifiPassword } from '../constants.js';

describe('Security & Privacy Unit Tests', () => {
  describe('escapeRegExp Helper', () => {
    it('escapes all special regex characters correctly', () => {
      const raw = '.*+?^${}()|[\\]\\';
      const escaped = escapeRegExp(raw);
      expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\\\\\]\\\\');
    });
  });

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

  describe('Wi-Fi Password Redaction (Special Character Handling)', () => {
    it('redacts a simple password', () => {
      const result = redactWifiPassword('WIFI:S:MyNet;T:WPA;P:hello123;;', 'hello123');
      expect(result).not.toContain('hello123');
      expect(result).toContain('P:********;');
    });

    it('redacts password with $ sign', () => {
      const result = redactWifiPassword('WIFI:S:MyNet;T:WPA;P:Pa$$word;;', 'Pa$$word');
      expect(result).not.toContain('Pa$$word');
      expect(result).toContain('P:********;');
    });

    it('redacts password with backslash', () => {
      const result = redactWifiPassword('WIFI:S:MyNet;T:WPA;P:pass\\word;;', 'pass\\word');
      expect(result).not.toContain('pass\\word');
      expect(result).toContain('P:********;');
    });

    it('redacts password with dots', () => {
      const result = redactWifiPassword('WIFI:S:MyNet;T:WPA;P:pass.word;;', 'pass.word');
      expect(result).not.toContain('pass.word');
      expect(result).toContain('P:********;');
    });

    it('redacts password with multiple special chars', () => {
      const result = redactWifiPassword('WIFI:S:MyNet;T:WPA;P:P@$$w.rd+test;;', 'P@$$w.rd+test');
      expect(result).not.toContain('P@$$w.rd+test');
      expect(result).toContain('P:********;');
    });

    it('fallback redaction works even if password string is omitted', () => {
      const result = redactWifiPassword('WIFI:S:MyNet;T:WPA;P:SecretPass123;;');
      expect(result).not.toContain('SecretPass123');
      expect(result).toContain('P:********;');
    });
  });
});
