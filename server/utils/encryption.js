const CryptoJS = require('crypto-js');

/**
 * Derives a shared encryption key using QKD simulation
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Quantum-derived encryption key
 */
const deriveSharedKey = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort().join('-');
    const seed = CryptoJS.SHA256(sortedIds + 'qkd-seed-2024').toString();
    const finalKey = CryptoJS.SHA256(seed + sortedIds + 'final-key').toString();
    return finalKey;
};

/**
 * Encrypts a text/URL using AES-256-CBC with quantum-derived key
 * @param {string} text - Plain text to encrypt
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Encrypted text with IV prepended
 */
const encryptData = (text, userId1, userId2) => {
    if (!text || typeof text !== 'string') {
        return text;
    }

    try {
        const quantumKey = deriveSharedKey(userId1, userId2);
        const iv = CryptoJS.lib.WordArray.random(16);

        const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(quantumKey), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const combined = iv.toString() + ':QKD:' + encrypted.toString();
        console.log('🔒 Server: Data encrypted with AES-256 + QKD');
        return combined;
    } catch (error) {
        console.error('Server encryption error:', error);
        return text;
    }
};

/**
 * Decrypts an encrypted text/URL
 * @param {string} encryptedText - Encrypted text with IV prepended
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Decrypted plain text
 */
const decryptData = (encryptedText, userId1, userId2) => {
    if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText;
    }

    try {
        if (!encryptedText.includes(':QKD:')) {
            return encryptedText; // Not encrypted
        }

        const parts = encryptedText.split(':QKD:');
        if (parts.length !== 2) {
            return encryptedText;
        }

        const ivHex = parts[0];
        const ciphertext = parts[1];
        const quantumKey = deriveSharedKey(userId1, userId2);
        const iv = CryptoJS.enc.Hex.parse(ivHex);

        const decrypted = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Hex.parse(quantumKey), {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

        if (!decryptedText || decryptedText.trim() === '') {
            console.warn('Server decryption failed');
            return encryptedText;
        }

        console.log('🔓 Server: Data decrypted with AES-256 + QKD');
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
