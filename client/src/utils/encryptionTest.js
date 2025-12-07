/**
 * Test file to verify encryption/decryption is working
 * Run this in browser console: import('./utils/encryptionTest.js')
 */

import { encryptMessage, decryptMessage, showEncryptionStatus, refreshQuantumKeys } from './encryption.js';

export const testEncryption = () => {
    console.clear();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║        🧪 ENCRYPTION TEST SUITE 🧪            ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Show encryption status
    showEncryptionStatus();

    // Test data
    const userId1 = 'user123';
    const userId2 = 'user456';
    const testMessages = [
        'Hello, World!',
        'This is a secret message 🔐',
        'Testing quantum-safe encryption with AES-256',
        'Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
        'Unicode test: 你好世界 🌍 مرحبا بالعالم'
    ];

    console.log('📝 Test Messages:');
    testMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. "${msg}"`);
    });
    console.log('\n' + '─'.repeat(50) + '\n');

    // Test encryption/decryption
    let allPassed = true;
    testMessages.forEach((originalMessage, index) => {
        console.log(`\n🔬 Test ${index + 1}/${testMessages.length}`);
        console.log(`Original: "${originalMessage}"`);

        // Encrypt
        const encrypted = encryptMessage(originalMessage, userId1, userId2);
        console.log(`Encrypted: ${encrypted.substring(0, 60)}...`);
        console.log(`Length: ${encrypted.length} characters`);

        // Verify format
        const hasQKDMarker = encrypted.includes(':QKD:');
        console.log(`Format check: ${hasQKDMarker ? '✅' : '❌'} QKD marker present`);

        // Decrypt
        const decrypted = decryptMessage(encrypted, userId1, userId2);
        console.log(`Decrypted: "${decrypted}"`);

        // Verify
        const passed = originalMessage === decrypted;
        console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

        if (!passed) {
            allPassed = false;
            console.error('❌ Mismatch detected!');
            console.error('Expected:', originalMessage);
            console.error('Got:', decrypted);
        }
    });

    console.log('\n' + '═'.repeat(50));
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

    // Test key refresh
    console.log('🔄 Testing key refresh...');
    refreshQuantumKeys();
    const testMsg = 'Test after key refresh';
    const enc = encryptMessage(testMsg, userId1, userId2);
    const dec = decryptMessage(enc, userId1, userId2);
    console.log(`Key refresh test: ${testMsg === dec ? '✅ PASS' : '❌ FAIL'}\n`);

    // Test cross-user decryption (should fail)
    console.log('🔒 Testing security (wrong user should fail)...');
    const secureMsg = 'Secret message';
    const encSecure = encryptMessage(secureMsg, userId1, userId2);
    const wrongUser = 'user789';
    const decWrong = decryptMessage(encSecure, userId1, wrongUser);
    const securityPassed = decWrong !== secureMsg;
    console.log(`Security test: ${securityPassed ? '✅ PASS (cannot decrypt with wrong user)' : '❌ FAIL (security breach!)'}\n`);

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║           ✅ TEST SUITE COMPLETE ✅            ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    return allPassed;
};

// Auto-run tests
console.log('🚀 Running encryption tests...\n');
testEncryption();
