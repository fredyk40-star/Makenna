/**
 * BiometricService - WebAuthn integration for Face ID/Fingerprint login
 * Provides secure biometric authentication as an alternative to PIN
 */
import { StorageService } from './StorageService';
import { ChildAccountService } from './ChildAccountService';

const BIOMETRIC_KEY = 'makenna_biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'makenna_biometric_enabled';

export class BiometricService {
  /**
   * Check if WebAuthn is supported on this device
   */
  static isSupported() {
    return !!(
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      window.navigator &&
      window.navigator.credentials &&
      (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ||
        window.PublicKeyCredential.isUserVerifyingAuthenticatorAvailable)
    );
  }

  /**
   * Check if biometric is available (platform authenticator like Face ID/Touch ID)
   */
  static async isAvailable() {
    if (!this.isSupported()) return false;
    
    try {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (e) {
      console.warn('WebAuthn availability check failed:', e);
      return false;
    }
  }

  /**
   * Check if biometric login is enabled for a child
   * @param {string} childId - The child's ID
   */
  static isEnabled(childId) {
    const enabled = StorageService.get(`${BIOMETRIC_ENABLED_KEY}_${childId}`);
    return !!enabled;
  }

  /**
   * Get stored credential ID for a child
   * @param {string} childId - The child's ID
   */
  static getCredentialId(childId) {
    return StorageService.get(`${BIOMETRIC_KEY}_${childId}`);
  }

  /**
   * Enable biometric login for a child account
   * @param {string} childId - The child's ID
   * @param {string} fullName - The child's full name
   */
  static async enableBiometric(childId, fullName) {
    if (!await this.isAvailable()) {
      throw new Error('Biometric authentication is not available on this device');
    }

    try {
      const credential = await this.createCredential(childId, fullName);
      StorageService.set(`${BIOMETRIC_KEY}_${childId}`, credential);
      StorageService.set(`${BIOMETRIC_ENABLED_KEY}_${childId}`, true);
      return true;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric login for a child account
   * @param {string} childId - The child's ID
   */
  static disableBiometric(childId) {
    StorageService.remove(`${BIOMETRIC_KEY}_${childId}`);
    StorageService.remove(`${BIOMETRIC_ENABLED_KEY}_${childId}`);
  }

  /**
   * Create a WebAuthn credential
   */
  static async createCredential(childId, fullName) {
    // Generate a challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKey = {
      challenge,
      rp: {
        name: 'Makenna Learning Lab',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(childId),
        name: childId,
        displayName: fullName || childId,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await window.navigator.credentials.create({ publicKey });
    
    return btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  }

  /**
   * Authenticate using biometric
   * @param {string} childId - The child's ID
   */
  static async authenticate(childId) {
    if (!await this.isAvailable()) {
      throw new Error('Biometric authentication is not available on this device');
    }

    const storedCredentialId = this.getCredentialId(childId);
    if (!storedCredentialId) {
      throw new Error('No biometric credential found. Please enable biometric login first.');
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKey = {
        challenge,
        allowCredentials: [{
          type: 'public-key',
          id: Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0)),
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await window.navigator.credentials.get({ publicKey });
      
      // If we get here, authentication succeeded
      return {
        success: true,
        childId,
      };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      throw new Error('Authentication failed. Please try again.');
    }
  }

  /**
   * Get guidance text for parents
   */
  static getParentGuidance() {
    return {
      title: "How to Enable Biometric Login",
      steps: [
        "📱 Make sure your device supports Face ID, Touch ID, or fingerprint",
        "⚙️ Go to your child's Profile page after creating an account",
        "🔐 Tap 'Enable Biometric Login' button",
        "👆 Follow the device prompt to scan your face/fingerprint",
        "✅ Next time, your child can log in with just their face/fingerprint!"
      ],
      notes: [
        "• Works on iPhone/iPad with Face ID/Touch ID",
        "• Works on Android phones with fingerprint sensor",
        "• Works on Windows laptops with Windows Hello",
        "• PIN will still work as backup if biometric fails"
      ]
    };
  }

  /**
   * Get supported platforms list
   */
  static getSupportedPlatforms() {
    return [
      { platform: 'iOS Safari', icon: '📱', support: 'Face ID & Touch ID' },
      { platform: 'Android Chrome', icon: '🤖', support: 'Fingerprint' },
      { platform: 'Windows Edge/Chrome', icon: '💻', support: 'Windows Hello' },
      { platform: 'macOS Safari', icon: '🍏', support: 'Touch ID' }
    ];
  }
}

// Singleton instance
export const biometricService = new BiometricService();