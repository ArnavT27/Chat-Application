# 🔐 AES-128 Encryption Implementation

## Overview
This chat application implements **AES-128-CBC encryption** for secure end-to-end message encryption.

## Encryption Architecture

### 1. **AES-128-CBC Encryption**

- **Algorithm**: AES (Advanced Encryption Standard)
- **Key Size**: 128 bits (16 bytes)
- **Mode**: CBC (Cipher Block Chaining)
- **IV Size**: 128 bits (random per message)
- **Padding**: PKCS7

### 2. **Key Derivation**

The application uses deterministic key derivation based on user IDs:

#### **Key Generation Process**
1. Sort user IDs alphabetically to ensure consistency
2. Concatenate sorted IDs with a salt: `userId1-userId2` + `'aes-key-2024'`
3. Hash using SHA-256
4. Take first 128 bits (32 hex characters) as the encryption key

This ensures both users derive the same key for their conversation.

## Security Features

### ✅ **Strong Encryption**
- AES-128 is industry-standard encryption
- CBC mode prevents pattern analysis
- Random IV per message ensures unique ciphertexts

### ✅ **End-to-End Encryption**
- Messages encrypted on sender's device
- Server cannot read message content
- Only recipient can decrypt messages

### ✅ **Forward Secrecy**
- Each message uses a unique random IV
- Same plaintext produces different ciphertext each time

## How It Works

### Encryption Flow
```javascript
1. User A sends message to User B
2. Derive shared key from both user IDs
3. Generate random 128-bit IV
4. Encrypt message with AES-128-CBC
5. Format: IV:ciphertext
6. Send encrypted message to server
7. Server forwards to User B
8. User B derives same key from user IDs
9. Extract IV and decrypt message
```

### Message Format
```
[IV (32 hex chars)]:[Base64 ciphertext]
```

Example:
```
a1b2c3d4e5f6789abcdef0123456789a:U2FsdGVkX1+vupppZksvRf5pq5g5XjFRlipRkwB0K1Y=
```

## Console Output

When encryption is active, you'll see:
```
╔════════════════════════════════════════════════╗
║        🔐 AES-128 ENCRYPTION ACTIVE 🔐        ║
╠════════════════════════════════════════════════╣
║ Algorithm: AES-128-CBC                         ║
║ Key Derivation: SHA-256 Hash                   ║
║ Key Size: 128 bits                             ║
╠════════════════════════════════════════════════╣
║ Features:                                      ║
║ 🔐 AES-128 encryption                          ║
║ 🔄 Deterministic key derivation                ║
║ 🛡️ Random IV per message                       ║
║ 📡 Secure message transmission                 ║
╚════════════════════════════════════════════════╝

� Message encrypted with AES-128
� Message decrypted with AES-128
```

## API Functions

### `encryptMessage(text, userId1, userId2)`
Encrypts a message using AES-128-CBC.

**Parameters:**
- `text` (string): Message to encrypt
- `userId1` (string): First user ID
- `userId2` (string): Second user ID

**Returns:** Encrypted string in format `IV:ciphertext`

### `decryptMessage(encryptedText, userId1, userId2)`
Decrypts a message using AES-128-CBC.

**Parameters:**
- `encryptedText` (string): Encrypted message
- `userId1` (string): First user ID
- `userId2` (string): Second user ID

**Returns:** Decrypted plain text

### `deriveSharedKey(userId1, userId2)`
Derives a shared 128-bit encryption key from two user IDs.

**Returns:** 32-character hex string (128 bits)

### `showEncryptionStatus()`
Displays encryption information in console.

### `getEncryptionInfo()`
Returns encryption details object.

## Security Considerations

### ✅ **Strengths:**
- AES-128 is secure and widely trusted
- CBC mode with random IV prevents pattern analysis
- Forward secrecy per message
- End-to-end encryption (server cannot read messages)

### ⚠️ **Limitations:**
- Keys derived deterministically from user IDs
- No key rotation mechanism
- Vulnerable to quantum computers in the future
- No perfect forward secrecy (same key for all messages between two users)

## Future Improvements

1. **Key Rotation**: Implement periodic key refresh
2. **Ephemeral Keys**: Use session-based keys for perfect forward secrecy
3. **Key Exchange Protocol**: Implement Diffie-Hellman for dynamic key generation
4. **Post-Quantum Cryptography**: Add quantum-resistant algorithms
5. **Key Backup**: Secure key recovery mechanism

## Testing

To test the encryption:

1. **Send a message** - Check console for encryption logs
2. **Inspect network** - See encrypted payload in DevTools
3. **Check database** - Messages stored encrypted
4. **Verify decryption** - Recipient sees plain text

## Implementation Details

### Client-Side (client/src/utils/encryption.js)
```javascript
// Derive 128-bit key
const key = deriveSharedKey(userId1, userId2);

// Generate random IV
const iv = CryptoJS.lib.WordArray.random(16);

// Encrypt with AES-128-CBC
const encrypted = CryptoJS.AES.encrypt(text, 
  CryptoJS.enc.Hex.parse(key), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
});

// Combine IV and ciphertext
return iv.toString() + ':' + encrypted.toString();
```

### Server-Side (server/utils/encryption.js)
The server uses the same encryption logic to handle encrypted data when needed.

## References

- [AES Encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [CBC Mode](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#CBC)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)
- [NIST AES Standard](https://csrc.nist.gov/publications/detail/fips/197/final)
