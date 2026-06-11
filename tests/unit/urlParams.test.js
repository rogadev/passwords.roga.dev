import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getParamsFromURL, updateURLParams } from '../../src/utils/urlParams'

describe('urlParams', () => {
  // Store the original window.location
  let originalLocation

  beforeEach(() => {
    // Save original location before tests
    originalLocation = window.location

    // Mock window.location for testing
    // We need to delete first because location is a read-only property
    delete window.location
    window.location = new URL('http://localhost:8080/')

    // Mock window.history.replaceState
    window.history = {
      ...window.history,
      replaceState: vi.fn(),
    }
  })

  afterEach(() => {
    // Restore original location after tests
    window.location = originalLocation
    vi.clearAllMocks()
  })

  it('should return default settings when no URL parameters exist', () => {
    const settings = getParamsFromURL()
    expect(settings).toEqual({
      length: 20,
      excludeLowercase: false,
      excludeNumbers: false,
      excludeUppercase: false,
      excludeSymbols: false,
      excludedChars: '',
      ruleNoLeadingSpecial: false,
    })
  })

  it('should parse length parameter correctly', () => {
    // Setup mock URL with length parameter
    window.location = new URL('http://localhost:8080/?len=24')

    const settings = getParamsFromURL()
    expect(settings.length).toBe(24)
  })

  it('should parse excluded character types correctly', () => {
    // Setup mock URL with excluded character types
    window.location = new URL('http://localhost:8080/?exLower&exNum')

    const settings = getParamsFromURL()
    expect(settings.excludeLowercase).toBe(true)
    expect(settings.excludeNumbers).toBe(true)
    expect(settings.excludeUppercase).toBe(false)
    expect(settings.excludeSymbols).toBe(false)
  })

  it('should parse excluded characters correctly', () => {
    // Setup mock URL with excluded characters
    window.location = new URL('http://localhost:8080/?exc=abc123')

    const settings = getParamsFromURL()
    expect(settings.excludedChars).toBe('abc123')
  })

  it('should decode URL-encoded excluded characters', () => {
    // Setup mock URL with URL-encoded characters
    window.location = new URL('http://localhost:8080/?exc=%40%23%24')

    const settings = getParamsFromURL()
    expect(settings.excludedChars).toBe('@#$')
  })

  it('should handle a literal % in excluded characters', () => {
    // URLSearchParams decodes %25 -> '%'; no manual double-decode
    window.location = new URL('http://localhost:8080/?exc=%25a')

    const settings = getParamsFromURL()
    expect(settings.excludedChars).toBe('%a')
  })

  it('should parse rules correctly', () => {
    // Setup mock URL with rule
    window.location = new URL('http://localhost:8080/?ruleNoLead')

    const settings = getParamsFromURL()
    expect(settings.ruleNoLeadingSpecial).toBe(true)
  })

  it('should handle combined parameters correctly', () => {
    // Setup mock URL with multiple parameters
    window.location = new URL(
      'http://localhost:8080/?len=18&exUpper&exSym&ruleNoLead&exc=xyz789',
    )

    const settings = getParamsFromURL()
    expect(settings.length).toBe(18)
    expect(settings.excludeUppercase).toBe(true)
    expect(settings.excludeSymbols).toBe(true)
    expect(settings.excludeLowercase).toBe(false)
    expect(settings.excludeNumbers).toBe(false)
    expect(settings.ruleNoLeadingSpecial).toBe(true)
    expect(settings.excludedChars).toBe('xyz789')
  })

  // Tests for updateURLParams
  describe('updateURLParams', () => {
    it('should update URL with length parameter', () => {
      const settings = { ...getParamsFromURL(), length: 24 }
      updateURLParams(settings)

      // Check that history.replaceState was called with correct URL
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('len=24'),
      )
    })

    it('should update URL with excluded character types', () => {
      const settings = {
        ...getParamsFromURL(),
        excludeLowercase: true,
        excludeNumbers: true,
      }
      updateURLParams(settings)

      // Check that history.replaceState was called with correct URL
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('exLower='),
      )
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('exNum='),
      )
    })

    it('should update URL with excluded characters', () => {
      const settings = { ...getParamsFromURL(), excludedChars: 'abc123' }
      updateURLParams(settings)

      // Check that history.replaceState was called with correct URL
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('exc=abc123'),
      )
    })

    it('should URL-encode special characters in excluded characters', () => {
      const settings = { ...getParamsFromURL(), excludedChars: '@#$' }
      updateURLParams(settings)

      // Check that history.replaceState was called with correct URL
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('exc='), // Just check that it contains the parameter name
      )

      // Get the actual value that was passed to replaceState
      const replaceStateCall = window.history.replaceState.mock.calls[0]
      const url = replaceStateCall[2]

      // Verify the URL contains encoded characters (without being strict about exact encoding format)
      expect(url).not.toContain('@#$') // Raw special chars should not appear
      expect(url).toContain('exc=') // Parameter name should be present
    })

    it('should update URL with rules', () => {
      const settings = { ...getParamsFromURL(), ruleNoLeadingSpecial: true }
      updateURLParams(settings)

      // Check that history.replaceState was called with correct URL
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('ruleNoLead='),
      )
    })

    it('should handle all parameters together', () => {
      const settings = {
        length: 18,
        excludeUppercase: true,
        excludeSymbols: true,
        excludeLowercase: false,
        excludeNumbers: false,
        ruleNoLeadingSpecial: true,
        excludedChars: 'xyz789',
      }
      updateURLParams(settings)

      // Check that history.replaceState was called with correct URL containing all parameters
      const replaceStateCall = window.history.replaceState.mock.calls[0]
      const url = replaceStateCall[2]

      expect(url).toContain('len=18')
      expect(url).toContain('exUpper=')
      expect(url).toContain('exSym=')
      expect(url).toContain('ruleNoLead=')
      expect(url).toContain('exc=xyz789')

      // Check that parameters for default values are not included
      expect(url).not.toContain('exLower')
      expect(url).not.toContain('exNum')
    })

    it('should remove query parameters when all settings are default', () => {
      const settings = {
        length: 20,
        excludeLowercase: false,
        excludeNumbers: false,
        excludeUppercase: false,
        excludeSymbols: false,
        excludedChars: '',
        ruleNoLeadingSpecial: false,
      }
      updateURLParams(settings)

      // Check that history.replaceState was called with URL without query parameters
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        window.location.pathname,
      )
    })
  })
})
