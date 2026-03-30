import { describe, it, expect } from 'vitest';
import { generatePassword } from '../../src/utils/password';

const defaults = {
  length: 20,
  excludeLowercase: false,
  excludeUppercase: false,
  excludeNumbers: false,
  excludeSymbols: false,
  excludedChars: '',
  ruleNoLeadingSpecial: false,
};

describe('generatePassword', () => {
  // --- Basic output ---

  it('returns a string of the requested length', () => {
    const pw = generatePassword({ ...defaults, length: 32 });
    expect(pw).toHaveLength(32);
  });

  it('works at minimum length (6)', () => {
    const pw = generatePassword({ ...defaults, length: 6 });
    expect(pw).toHaveLength(6);
  });

  it('works at maximum length (128)', () => {
    const pw = generatePassword({ ...defaults, length: 128 });
    expect(pw).toHaveLength(128);
  });

  // --- Guaranteed character types ---

  it('includes at least one char from each included set', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...defaults, length: 20 });
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^a-zA-Z0-9]/); // symbol
    }
  });

  it('contains only lowercase when other types excluded', () => {
    const pw = generatePassword({
      ...defaults,
      length: 30,
      excludeUppercase: true,
      excludeNumbers: true,
      excludeSymbols: true,
    });
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it('contains only uppercase when other types excluded', () => {
    const pw = generatePassword({
      ...defaults,
      length: 30,
      excludeLowercase: true,
      excludeNumbers: true,
      excludeSymbols: true,
    });
    expect(pw).toMatch(/^[A-Z]+$/);
  });

  it('contains only numbers when other types excluded', () => {
    const pw = generatePassword({
      ...defaults,
      length: 30,
      excludeLowercase: true,
      excludeUppercase: true,
      excludeSymbols: true,
    });
    expect(pw).toMatch(/^[0-9]+$/);
  });

  it('contains only symbols when other types excluded', () => {
    const pw = generatePassword({
      ...defaults,
      length: 30,
      excludeLowercase: true,
      excludeUppercase: true,
      excludeNumbers: true,
    });
    expect(pw).toMatch(/^[^a-zA-Z0-9]+$/);
  });

  // --- Excluded characters ---

  it('excludes specific characters via excludedChars', () => {
    const excluded = 'aeiouAEIOU';
    for (let i = 0; i < 10; i++) {
      const pw = generatePassword({ ...defaults, length: 40, excludedChars: excluded });
      for (const ch of excluded) {
        expect(pw).not.toContain(ch);
      }
    }
  });

  it('handles excludedChars that deplete an entire character set', () => {
    // Exclude all digits via excludedChars (not the excludeNumbers flag)
    const pw = generatePassword({
      ...defaults,
      length: 20,
      excludedChars: '0123456789',
    });
    expect(pw).not.toMatch(/[0-9]/);
    expect(pw).toHaveLength(20);
  });

  it('works when excludedChars partially depletes multiple sets', () => {
    const pw = generatePassword({
      ...defaults,
      length: 20,
      excludedChars: 'abcABC123!@#',
    });
    expect(pw).toHaveLength(20);
    for (const ch of 'abcABC123!@#') {
      expect(pw).not.toContain(ch);
    }
  });

  // --- ruleNoLeadingSpecial ---

  it('ensures first char is a letter when ruleNoLeadingSpecial is true', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...defaults, length: 20, ruleNoLeadingSpecial: true });
      expect(pw[0]).toMatch(/[a-zA-Z]/);
    }
  });

  it('ruleNoLeadingSpecial works with only lowercase+numbers', () => {
    for (let i = 0; i < 30; i++) {
      const pw = generatePassword({
        ...defaults,
        length: 20,
        excludeUppercase: true,
        excludeSymbols: true,
        ruleNoLeadingSpecial: true,
      });
      expect(pw[0]).toMatch(/[a-z]/);
    }
  });

  it('ruleNoLeadingSpecial works with only uppercase+symbols', () => {
    for (let i = 0; i < 30; i++) {
      const pw = generatePassword({
        ...defaults,
        length: 20,
        excludeLowercase: true,
        excludeNumbers: true,
        ruleNoLeadingSpecial: true,
      });
      expect(pw[0]).toMatch(/[A-Z]/);
    }
  });

  // --- Error cases ---

  it('returns error for length 0', () => {
    const result = generatePassword({ ...defaults, length: 0 });
    expect(result).toMatch(/^Error:/);
  });

  it('returns error for negative length', () => {
    const result = generatePassword({ ...defaults, length: -5 });
    expect(result).toMatch(/^Error:/);
  });

  it('returns error for length > 128', () => {
    const result = generatePassword({ ...defaults, length: 200 });
    expect(result).toMatch(/^Error:/);
  });

  it('returns error when all character types are excluded', () => {
    const result = generatePassword({
      ...defaults,
      length: 20,
      excludeLowercase: true,
      excludeUppercase: true,
      excludeNumbers: true,
      excludeSymbols: true,
    });
    expect(result).toMatch(/^Error:/);
  });

  it('returns error when all characters are excluded via excludedChars', () => {
    // Exclude every character in every set
    const allChars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=\\';
    const result = generatePassword({
      ...defaults,
      length: 20,
      excludedChars: allChars,
    });
    expect(result).toMatch(/^Error:/);
  });

  it('returns error when length is shorter than required character types', () => {
    // With all 4 types included, minimum is 4 chars — but length is 6 minimum in the UI.
    // However generatePassword itself only checks length <= 0 || > 128 and requiredChars > length.
    // With all 4 types, requiredChars = 4, so length=3 should fail.
    const result = generatePassword({ ...defaults, length: 3 });
    expect(result).toMatch(/^Error:/);
  });

  it('returns error when ruleNoLeadingSpecial cannot be satisfied (no letters)', () => {
    const result = generatePassword({
      ...defaults,
      length: 20,
      excludeLowercase: true,
      excludeUppercase: true,
      ruleNoLeadingSpecial: true,
    });
    expect(result).toMatch(/^Error:/);
  });

  // --- Randomness sanity checks ---

  it('generates different passwords on successive calls', () => {
    const passwords = new Set();
    for (let i = 0; i < 20; i++) {
      passwords.add(generatePassword({ ...defaults, length: 20 }));
    }
    // With 20 random 20-char passwords, collisions are astronomically unlikely
    expect(passwords.size).toBe(20);
  });

  it('distributes characters across the full pool over many generations', () => {
    const seen = new Set();
    for (let i = 0; i < 100; i++) {
      const pw = generatePassword({ ...defaults, length: 40 });
      for (const ch of pw) seen.add(ch);
    }
    // With 100 passwords of length 40 from a pool of ~92 chars,
    // we should see at least 60 distinct characters
    expect(seen.size).toBeGreaterThan(60);
  });

  // --- Edge cases ---

  it('minimum viable password: single type at exact required length', () => {
    // Only lowercase, length=1 → requires 1 from lowercase, exactly fits
    const pw = generatePassword({
      ...defaults,
      length: 1,
      excludeUppercase: true,
      excludeNumbers: true,
      excludeSymbols: true,
    });
    expect(pw).toHaveLength(1);
    expect(pw).toMatch(/^[a-z]$/);
  });

  it('two types at length 2', () => {
    const pw = generatePassword({
      ...defaults,
      length: 2,
      excludeNumbers: true,
      excludeSymbols: true,
    });
    expect(pw).toHaveLength(2);
    // Must contain at least one lowercase and one uppercase
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[A-Z]/);
  });

  it('handles empty excludedChars string', () => {
    const pw = generatePassword({ ...defaults, length: 20, excludedChars: '' });
    expect(pw).toHaveLength(20);
  });
});
