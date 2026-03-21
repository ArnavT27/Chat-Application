import CryptoJS from 'crypto-js';

/**
 * Derive a shared encryption key from two user IDs
 * Uses simple deterministic key generation for AES-128
 */
export const deriveSharedKey = (userId1, userId2) => {
  // Sort IDs to ensure same key regardless of order
  const sortedIds = [userId1, userId2].sort().join('-');

  // Generate a 128-bit (16 byte) key using SHA256 and taking first 16 bytes
  const fullHash = CryptoJS.SHA256(sortedIds + 'aes-key-2024').toString();

  // Take first 32 hex characters (16 bytes = 128 bits)
  return fullHash.substring(0, 32);
};

/**
 * Encrypt a message using AES-128-CBC
 */
export const encryptMessage = (text, userId1, userId2) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // Get 128-bit shared key
    const key = deriveSharedKey(userId1, userId2);

    // Generate random 128-bit IV
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt using AES-128-CBC
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Combine IV and ciphertext
    const combined = iv.toString() + ':' + encrypted.toString();
    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    return text;
  }
};

/**
 * Decrypt a message using AES-128-CBC
 */
export const decryptMessage = (encryptedText, userId1, userId2) => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  try {
    if (!userId1 || !userId2) {
      console.warn('Cannot decrypt: missing user IDs');
      return encryptedText;
    }

    // Check if this is an encrypted message (contains IV separator)
    if (!encryptedText.includes(':')) {
      return encryptedText;
    }

    // Extract IV and ciphertext
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return encryptedText;
    }

    const ivHex = parts[0];
    const ciphertext = parts[1];

    // Get 128-bit shared key
    const key = deriveSharedKey(userId1, userId2);

    // Parse IV
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    // Decrypt using AES-128-CBC
    const decrypted = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Hex.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText || decryptedText.trim() === '') {
      console.warn('Decryption failed - empty result');
      return encryptedText;
    }

    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
};

/**
 * Checks if a message is encrypted
 */
export const isEncrypted = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  return text.includes(':') && text.length > 50;
};

/**
 * Get encryption information for display
 */
export const getEncryptionInfo = () => {
  return {
    algorithm: 'AES-128-CBC',
    keyDerivation: 'SHA-256 Hash',
    keySize: '128 bits',
    mode: 'CBC (Cipher Block Chaining)',
    ivSize: '128 bits (random per message)',
    features: [
      '🔐 AES-128 encryption',
      '🔄 Deterministic key derivation',
      '🛡️ Random IV per message',
      '📡 Secure message transmission'
    ]
  };
};

/**
 * Display encryption status in console
 */
export const showEncryptionStatus = () => {
  const info = getEncryptionInfo();
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║        🔐 AES-128 ENCRYPTION ACTIVE 🔐        ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║ Algorithm: ${info.algorithm.padEnd(31)} ║`);
  console.log(`║ Key Derivation: ${info.keyDerivation.padEnd(26)} ║`);
  console.log(`║ Key Size: ${info.keySize.padEnd(34)} ║`);
  console.log('╠════════════════════════════════════════════════╣');
  console.log('║ Features:                                      ║');
  info.features.forEach(feature => {
    console.log(`║ ${feature.padEnd(46)} ║`);
  });
  console.log('╚════════════════════════════════════════════════╝\n');
};