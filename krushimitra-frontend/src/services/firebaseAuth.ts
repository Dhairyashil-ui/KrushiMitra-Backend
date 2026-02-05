/**
 * Firebase Authentication Service
 * Handles phone number OTP verification for signup
 * Web-compatible using Firebase Web SDK
 */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';

// Global state (module scoped)
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null; // single instance
let recaptchaRendered = false; // render completion flag
let otpAttemptCount = 0;
let lastOtpWindowStart = 0;
// NOTE: No manual site key usage. Using default Firebase Web reCAPTCHA (v2 invisible) via SDK.

/**
 * Dynamically inject the reCAPTCHA Enterprise script if not present.
 */
// We let Firebase SDK inject the appropriate reCAPTCHA script; no manual script loading.

/**
 * Initialize reCAPTCHA verifier for Identity Platform (Enterprise).
 * Ensures script + container + render lifecycle.
 */
export function initRecaptcha(containerId: string = 'recaptcha-container'): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  if (recaptchaVerifier) return true; // already created
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[reCAPTCHA] Missing container #${containerId}`);
    return false;
  }
  try {
    // Invisible v2 reCAPTCHA. Only one instance, rendered once.
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
    recaptchaVerifier.render()
      .then(() => {
        recaptchaRendered = true;
        console.log('[reCAPTCHA] invisible v2 rendered');
      })
      .catch(e => console.error('[reCAPTCHA] render error', e));
    return true;
  } catch (e) {
    console.error('[reCAPTCHA] creation error', e);
    recaptchaVerifier = null;
    return false;
  }
}

/**
 * Send OTP to phone number
 * @param phoneNumber - Phone number in format +91XXXXXXXXXX
 * @returns Promise<boolean> - Success status
 */
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS !== 'web') {
      return { success: false, error: 'Phone auth via reCAPTCHA is only enabled on web build. Use native implementation or backend relay for mobile.' };
    }
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    console.log('[OTP] Sending to:', formattedPhone);

    // Throttle: max 3 attempts per 60s window
    const now = Date.now();
    if (now - lastOtpWindowStart > 60000) {
      lastOtpWindowStart = now;
      otpAttemptCount = 0;
    }
    if (otpAttemptCount >= 3) {
      return { success: false, error: 'Too many attempts. Please wait 60 seconds before retrying.' };
    }

    if (!recaptchaVerifier) {
      return { success: false, error: 'Security check initializing. Retry shortly.' };
    }
    if (!recaptchaRendered) {
      return { success: false, error: 'Security check loading. Retry.' };
    }

    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier!);
    console.log('[OTP] Sent OK');
    otpAttemptCount++;
    return { success: true };
  } catch (error: any) {
    console.error('[OTP] send error:', error);
    let errorMessage = 'Failed to send OTP';
    switch (error.code) {
      case 'auth/invalid-phone-number': errorMessage = 'Invalid phone number format'; break;
      case 'auth/too-many-requests': errorMessage = 'Too many requests or suspicious activity detected. Wait and try later.'; break;
      case 'auth/quota-exceeded': errorMessage = 'SMS quota exceeded. Try later.'; break;
      case 'auth/invalid-app-credential': errorMessage = 'Invalid app credential. Please reload page and retry.'; break;
    }
    otpAttemptCount++; // count failed attempts too
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify OTP entered by user
 * @param otp - 6-digit OTP code
 * @returns Promise with verification result
 */
export async function verifyOTP(otp: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'Request OTP first' };
    }
    const result = await confirmationResult.confirm(otp);
    return { success: true, userId: result.user.uid };
  } catch (error: any) {
    console.error('[OTP] verify error:', error);
    let errorMessage = 'Invalid OTP';
    switch (error.code) {
      case 'auth/invalid-verification-code': errorMessage = 'Invalid OTP code'; break;
      case 'auth/code-expired': errorMessage = 'OTP expired. Request new code.'; break;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await auth.signOut();
  confirmationResult = null;
  console.log('[Auth] Signed out');
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Get current OTP attempt throttle state
 */
export function getOtpAttemptState() {
  return { attempts: otpAttemptCount, windowStart: lastOtpWindowStart };
}

/**
 * Reset the reCAPTCHA state (useful if container re-mounted)
 */
export function resetRecaptcha(): void {
  // Soft reset: do not clear DOM contents (avoids double-render errors)
  recaptchaVerifier = null;
  recaptchaRendered = false;
  console.log('[reCAPTCHA] Soft reset performed');
}
