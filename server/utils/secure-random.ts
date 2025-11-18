import crypto from 'crypto';

/**
 * Secure Random Utility
 * Security: MEDIUM (6.1) - Fixes Weak PRNG vulnerability
 * 
 * This module provides cryptographically secure random number generation
 * using Node.js crypto module instead of Math.random() or new Random()
 * 
 * NEVER use Math.random() for:
 * - Password generation
 * - Token generation
 * - OTP/Reset code generation
 * - Session IDs
 * - API keys
 * - Cryptographic operations
 */

/**
 * Generate a cryptographically secure random integer between min and max (inclusive)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Secure random integer
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const randomBytes = crypto.randomBytes(bytesNeeded);
  let randomValue = 0;
  
  for (let i = 0; i < bytesNeeded; i++) {
    randomValue = randomValue * 256 + randomBytes[i];
  }
  
  // Rejection sampling to avoid modulo bias
  if (randomValue >= maxValue - (maxValue % range)) {
    return secureRandomInt(min, max);
  }
  
  return min + (randomValue % range);
}

/**
 * Generate a cryptographically secure random floating point number between 0 and 1
 * @returns Secure random float between 0 and 1
 */
export function secureRandom(): number {
  const randomBytes = crypto.randomBytes(8);
  const randomValue = randomBytes.readBigUInt64BE();
  const maxValue = BigInt("18446744073709551615"); // 0xFFFFFFFFFFFFFFFF
  return Number(randomValue) / Number(maxValue);
}

/**
 * Generate a secure random password
 * @param length Password length (default: 12)
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = secureRandomInt(0, chars.length - 1);
    password += chars[randomIndex];
  }
  
  return password;
}

/**
 * Generate a secure 6-digit OTP/reset code
 * @returns Secure 6-digit code as string
 */
export function generateSecureOTP(): string {
  return secureRandomInt(100000, 999999).toString();
}

/**
 * Generate a secure alphanumeric token
 * @param length Token length (default: 32)
 * @returns Secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate a cryptographically secure UUID v4
 * @returns UUID v4 string
 */
export function generateSecureUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a secure patient ID in format: P-YYYYMM-XXXXXX
 * where YYYYMM is current year/month and XXXXXX is a secure random 6-digit number
 * Example: P-202511-847362
 * 
 * Security: MEDIUM (3.5) - Fixes Weak PRNG vulnerability for patient IDs
 * Uses cryptographically secure random instead of Math.random()
 * 
 * @returns Secure patient ID string
 */
export function generateSecurePatientId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const secureRandom = secureRandomInt(100000, 999999); // 6-digit secure random
  
  return `P-${year}${month}-${secureRandom}`;
}
