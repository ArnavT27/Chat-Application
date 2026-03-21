const CryptoJS = require('crypto-js');

/**
 * Derive a shared encryption key from two user IDs
 * Uses simple deterministic key generation for AES-128
 */
const deriveSharedKey = (userId1, userId2) => {
    // Sort IDs to ensure same key regardless of order
    const sortedIds = [userId1, userId2].sort().join('-');

    // Generate a 128-bit (16 byte) key using SHA256 and taking first 16 bytes
    const fullHash = CryptoJS.SHA256(sortedIds + 'aes-key-2024').toString();

    // Take first 32 hex characters (16 bytes = 128 bits)
    return fullHash.substring(0, 32);
};

/**
 * Encrypt data using AES-128-CBC
 */
const encryptData = (text, userId1, userId2) => {
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
        console.log('🔒 Server: Data encrypted with AES-128');
        return combined;
    } catch (error) {
        console.error('Server encryption error:', error);
        return text;
    }
};

/**
 * Decrypt data using AES-128-CBC
 */
const decryptData = (encryptedText, userId1, userId2) => {
    if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText;
    }

    try {
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
            console.warn('Server decryption failed');
            return encryptedText;
        }

        console.log('🔓 Server: Data decrypted with AES-128');
        return decryptedText;
    } catch (error) {
        console.error('Server decryption error:', error);
        return encryptedText;
    }
};

module.exports = {
    encryptData,
    decryptData,
    deriveSharedKey
};
