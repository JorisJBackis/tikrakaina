/**
 * Device Fingerprinting Utility
 * Generates a unique fingerprint based on browser/device characteristics
 * Makes it harder to bypass the free trial limit
 */

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server'

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let canvasFingerprint = ''

  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('fingerprint', 2, 2)
    canvasFingerprint = canvas.toDataURL().slice(-50)
  }

  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 0,
    screenResolution: `${screen.width}x${screen.height}`,
    screenColorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    canvas: canvasFingerprint,
    // Add more signals
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || 'unknown',
  }

  // Create a hash from the fingerprint object
  const fingerprintString = JSON.stringify(fingerprint)
  return simpleHash(fingerprintString)
}

// Simple hash function (good enough for fingerprinting)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export function getLocalAnalysisCount(): number {
  if (typeof window === 'undefined') return 0
  const count = localStorage.getItem('free_analyses_used')
  return count ? parseInt(count, 10) : 0
}

export function incrementLocalAnalysisCount(): void {
  if (typeof window === 'undefined') return
  const current = getLocalAnalysisCount()
  localStorage.setItem('free_analyses_used', String(current + 1))
  localStorage.setItem('free_analyses_fingerprint', generateDeviceFingerprint())
}

export function hasUsedFreeTrial(): boolean {
  return getLocalAnalysisCount() >= 1
}

// Get user's IP address
export async function getUserIP(): Promise<string | null> {
  try {
    // Use ipify API (free, no rate limits for reasonable use)
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
    })
    const data = await response.json()
    return data.ip || null
  } catch (error) {
    console.error('Failed to get IP:', error)
    return null
  }
}
