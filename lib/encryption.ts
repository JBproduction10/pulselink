'use client';

// Simple encryption using Web Crypto API
export class MessageEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(message: string, keyString?: string): Promise<{ encrypted: string; iv: string; key?: string }> {
    try {
      let key: CryptoKey;

      if (keyString) {
        // Import existing key
        const keyData = this.base64ToArrayBuffer(keyString);
        key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        key = await this.generateKey();
      }

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedMessage = new TextEncoder().encode(message);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedMessage
      );

      const exportedKey = keyString ? undefined : await crypto.subtle.exportKey('raw', key);

      return {
        encrypted: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv.buffer),
        key: exportedKey ? this.arrayBufferToBase64(exportedKey) : undefined,
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  static async decrypt(encryptedMessage: string, iv: string, keyString: string): Promise<string> {
    try {
      const keyData = this.base64ToArrayBuffer(keyString);
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const encryptedData = this.base64ToArrayBuffer(encryptedMessage);
      const ivData = this.base64ToArrayBuffer(iv);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivData,
        },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted Message - Unable to decrypt]';
    }
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static generateKeyPair(): string {
    // Generate a random key for symmetric encryption
    const key = crypto.getRandomValues(new Uint8Array(32));
    return this.arrayBufferToBase64(key.buffer);
  }
}

// Key management for contacts
export function saveEncryptionKey(contactId: string, key: string) {
  if (typeof window !== 'undefined') {
    const keys = getEncryptionKeys();
    keys[contactId] = key;
    localStorage.setItem('pulselink-encryption-keys', JSON.stringify(keys));
  }
}

export function getEncryptionKey(contactId: string): string | null {
  if (typeof window !== 'undefined') {
    const keys = getEncryptionKeys();
    return keys[contactId] || null;
  }
  return null;
}

export function getEncryptionKeys(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pulselink-encryption-keys');
    return stored ? JSON.parse(stored) : {};
  }
  return {};
}
