import CryptoJS from 'crypto-js';

/**
 * Derives a shared encryption key from two user IDs
 * This ensures both users can encrypt/decrypt messages using the same key
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Derived encryption key
 */
export const deriveSharedKey = (userId1, userId2) => {
  // Sort IDs to ensure consistent key regardless of order
  const sortedIds = [userId1, userId2].sort().join('-');
  
  // Use a secret salt (in production, this should be stored securely)
  // For now, we'll use a constant salt. In production, consider:
  // - Storing salt in environment variables
  // - Using a key derivation function (PBKDF2)
  const salt = 'chat-app-e2e-salt-2024';
  
  // Derive key using SHA256 hash
  const key = CryptoJS.SHA256(sortedIds + salt).toString();
  
  return key;
};

/**
 * Encrypts a text message using AES encryption
 * @param {string} text - Plain text message to encrypt
 * @param {string} userId1 - First user ID (sender or receiver)
 * @param {string} userId2 - Second user ID (receiver or sender)
 * @returns {string} - Encrypted message (base64 encoded)
 */
export const encryptMessage = (text, userId1, userId2) => {
  if (!text || typeof text !== 'string') {
    return text; // Return as-is if not a string (e.g., images)
  }
  
  try {
    const key = deriveSharedKey(userId1, userId2);
    
    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Return original text if encryption fails
    return text;
  }
};

/**
 * Decrypts an encrypted message
 * @param {string} encryptedText - Encrypted message (base64 encoded)
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Decrypted plain text message
 */
export const decryptMessage = (encryptedText, userId1, userId2) => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText; // Return as-is if not a string
  }
  
  // Always try to decrypt if it looks like encrypted data
  // Encrypted messages from CryptoJS typically start with "U2FsdGVkX1" (base64 for "Salted__")
  const looksEncrypted = encryptedText.includes('U2FsdGVkX1') || encryptedText.length > 30;
  
  if (!looksEncrypted) {
    // Likely not encrypted, return as-is (for backward compatibility)
    return encryptedText;
  }
  
  try {
    if (!userId1 || !userId2) {
      console.warn('Cannot decrypt: missing user IDs');
      return encryptedText;
    }
    
    const key = deriveSharedKey(userId1, userId2);
    
    // Decrypt using AES
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails, decryptedText will be empty
    if (!decryptedText || decryptedText.trim() === '') {
      console.warn('Decryption failed - empty result, returning original text');
      console.log('Encrypted text length:', encryptedText.length);
      console.log('User IDs:', userId1, userId2);
      return encryptedText;
    }
    
    console.log('Successfully decrypted message');
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    console.log('Encrypted text:', encryptedText.substring(0, 50) + '...');
    // Return original text if decryption fails (for backward compatibility)
    return encryptedText;
  }
};

/**
 * Checks if a message is encrypted
 * @param {string} text - Message text to check
 * @returns {boolean} - True if message appears to be encrypted
 */
export const isEncrypted = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // Encrypted messages typically start with "U2FsdGVkX1" (base64 for "Salted__")
  return text.includes('U2FsdGVkX1') || text.length > 50;
};

