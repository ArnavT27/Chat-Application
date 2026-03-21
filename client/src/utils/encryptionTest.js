/**
 * Encryption Test Suite
 * Tests AES-128 encryption functionality
 */

import { encryptMessage, decryptMessage, showEncryptionStatus } from './encryption.js';

export const testEncryption = () => {
    console.log('\n🧪 Starting Encryption Tests...\n');

    // Show encryption status
    showEncryptionStatus();

    // Test user IDs
    const userId1 = '507f1f77bcf86cd799439011';
    const userId2 = '507f191e810c19729de860ea';
    'Testing AES-128 encryption',
    const testMessages = [
        'Hello, World!',
        'Testing AES-128 encryption',
        'This is a longer message with special characters: !@#$%^&*()',
        '🔐 Emoji test 🚀',
        'Multi\nline\ntest'
    ];

    console.log('📝 Test Messages:', testMessages.length);
    console.log('👥 User IDs:', userId1, userId2);
    console.log('\n' + '='.repeat(60) + '\n');

    let passedTests = 0;
    let failedTests = 0;

    testMessages.forEach((message, index) => {
        console.log(`\n🧪 Test ${index + 1}: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
        console.log('-'.repeat(60));

        // Verify format
        const hasIVSeparator = encrypted.includes(':');
        console.log(`Format check: ${hasIVSeparator ? '✅' : '❌'} IV separator present`);
        console.log('📏 Encrypted length:', encrypted.length);

        // Verify format
        const hasIVSeparator = encrypted.includes(':');
        console.log(`Format check: ${hasIVSeparator ? '✅' : '❌'} IV separator present`);

        // Decrypt
        const decrypted = decryptMessage(encrypted, userId1, userId2);
decrypted);

    // Verify
    const isCorrect = decrypted === message;
    console.log(`Verification: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

    if (isCorrect) {
        passedTests++;
    } else {
        failedTests++;
        console.error('❌ Expected:', message);
        console.error('❌ Got:', decrypted);
        // Test with reversed user IDs (should produce same key)
        console.log('🔄 Testing key consistency with reversed user IDs...');
        const testMsg = 'Test message for key consistency';
        const enc = encryptMessage(testMsg, userId1, userId2);
        console.log('\n🔄 Testing key consistency with reversed user IDs...');
        const testMsg = 'Test message for key consistency';
, userId1, userId2);
const dec1 = decryptMessage(enc1, userId2, userId1); // Reversed IDs
const keyConsistent = dec1 === testMsg;
console.log(`Key consistency: ${keyConsistent ? '✅ PASS' : '❌ FAIL'}`);
if (keyConsistent) passedTests++; else failedTests++;

// Test uniqueness (same message should produce different ciphertext due to random IV)
console.log('\n🔄 Testing IV randomness...');
const msg = 'Same message';
const enc2 = encryptMessage(msg, userId1, userId2);
const enc3 = encryptMessage(msg, userId1, userId2);
const isUnique = enc2 !== enc3;
console.log(`IV randomness: ${isUnique ? '✅ PASS' : '❌ FAIL'}`);
console.log('First encryption:', enc2.substring(0, 50) + '...');
console.log('Second encryption:', enc3.substring(0, 50) + '...');
if (isUnique) passedTests++; else failedTests++;

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n� Test Summary:');
assedTests,
    failed: failedTests,
        total: passedTests + failedTests
    };
};

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
    console.log('💡 Run testEncryption() in console to test encryption');
}
sole.log('\n' + '='.repeat(60) + '\n');

return {
    passed: pcon    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
