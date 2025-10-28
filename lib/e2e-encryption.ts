/**
 * End-to-End Encryption Library for PulseLink
 * Uses Web Crypto API for secure message encryption
 *
 * Features:
 * - ECDH key exchange for peer-to-peer encryption
 * - AES-GCM for symmetric encryption
 * - Secure key storage
 * - Group chat encryption with shared room keys
 */

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedPublicKey {
  type: 'public';
  key: JsonWebKey;
}

export interface EncryptedMessage {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  tag?: string; // Authentication tag (included in ciphertext for AES-GCM)
}

export class E2EEncryption {
  private keyPair: KeyPair | null = null;
  private sharedKeys: Map<string, CryptoKey> = new Map(); // peerId -> shared key
  private groupKeys: Map<string, CryptoKey> = new Map(); // roomId -> group key
  private isSupported: boolean;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.isSupported = this.checkCryptoSupport();
  }

  private checkCryptoSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.crypto && window.crypto.subtle);
  }

  isCryptoSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Generate ECDH key pair for this user
   */
  async generateKeyPair(): Promise<KeyPair> {
    if (!this.isSupported) {
      throw new Error('Web Crypto API not supported');
    }

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['deriveKey']
    );

    this.keyPair = keyPair as KeyPair;

    // Store in localStorage for persistence
    await this.saveKeyPair();

    return this.keyPair;
  }

  /**
   * Load existing key pair from storage or generate new one
   */
  async initializeKeys(): Promise<KeyPair> {
    if (this.keyPair) return this.keyPair;

    // Try to load from storage
    const stored = await this.loadKeyPair();
    if (stored) {
      this.keyPair = stored;
      return stored;
    }

    // Generate new keys
    return await this.generateKeyPair();
  }

  /**
   * Export public key for sharing with peers
   */
  async exportPublicKey(): Promise<ExportedPublicKey> {
    if (!this.keyPair) {
      await this.initializeKeys();
    }

    const exported = await window.crypto.subtle.exportKey('jwk', this.keyPair!.publicKey);

    return {
      type: 'public',
      key: exported,
    };
  }

  /**
   * Import peer's public key
   */
  async importPublicKey(exportedKey: ExportedPublicKey): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
      'jwk',
      exportedKey.key,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  }

  /**
   * Derive shared key with a peer using ECDH
   */
  async deriveSharedKey(peerId: string, peerPublicKey: CryptoKey): Promise<CryptoKey> {
    if (!this.keyPair) {
      await this.initializeKeys();
    }

    // Derive shared secret using ECDH
    const sharedSecret = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      this.keyPair!.privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    this.sharedKeys.set(peerId, sharedSecret);
    return sharedSecret;
  }

  /**
   * Encrypt a message for a specific peer
   */
  async encryptForPeer(peerId: string, message: string): Promise<EncryptedMessage> {
    const sharedKey = this.sharedKeys.get(peerId);

    if (!sharedKey) {
      throw new Error(`No shared key established with peer ${peerId}`);
    }

    return await this.encryptWithKey(sharedKey, message);
  }

  /**
   * Decrypt a message from a peer
   */
  async decryptFromPeer(peerId: string, encrypted: EncryptedMessage): Promise<string> {
    const sharedKey = this.sharedKeys.get(peerId);

    if (!sharedKey) {
      throw new Error(`No shared key established with peer ${peerId}`);
    }

    return await this.decryptWithKey(sharedKey, encrypted);
  }

  /**
   * Encrypt message with a specific key (used for both P2P and group)
   */
  private async encryptWithKey(key: CryptoKey, message: string): Promise<EncryptedMessage> {
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Convert message to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Encrypt
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    // Convert to base64 for transmission
    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv.buffer),
    };
  }

  /**
   * Decrypt message with a specific key
   */
  private async decryptWithKey(key: CryptoKey, encrypted: EncryptedMessage): Promise<string> {
    const ciphertext = this.base64ToArrayBuffer(encrypted.ciphertext);
    const iv = this.base64ToArrayBuffer(encrypted.iv);

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
  }

  /**
   * Generate a random key for group chat encryption
   */
  async generateGroupKey(roomId: string): Promise<CryptoKey> {
    const key = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable so we can share it
      ['encrypt', 'decrypt']
    );

    this.groupKeys.set(roomId, key);
    await this.saveGroupKey(roomId, key);

    return key;
  }

  /**
   * Export group key for sharing with room members
   */
  async exportGroupKey(roomId: string): Promise<JsonWebKey> {
    const key = this.groupKeys.get(roomId);

    if (!key) {
      throw new Error(`No group key found for room ${roomId}`);
    }

    return await window.crypto.subtle.exportKey('jwk', key);
  }

  /**
   * Import group key received from room creator
   */
  async importGroupKey(roomId: string, jwk: JsonWebKey): Promise<CryptoKey> {
    const key = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    this.groupKeys.set(roomId, key);
    await this.saveGroupKey(roomId, key);

    return key;
  }

  /**
   * Encrypt message for group chat
   */
  async encryptForGroup(roomId: string, message: string): Promise<EncryptedMessage> {
    let key = this.groupKeys.get(roomId);

    if (!key) {
      // Generate new key if we're the room creator
      key = await this.generateGroupKey(roomId);
    }

    return await this.encryptWithKey(key, message);
  }

  /**
   * Decrypt group message
   */
  async decryptFromGroup(roomId: string, encrypted: EncryptedMessage): Promise<string> {
    const key = this.groupKeys.get(roomId);

    if (!key) {
      throw new Error(`No group key available for room ${roomId}`);
    }

    return await this.decryptWithKey(key, encrypted);
  }

  /**
   * Encrypt group key for a specific peer (for key distribution)
   */
  async encryptGroupKeyForPeer(peerId: string, roomId: string): Promise<EncryptedMessage> {
    const groupKey = this.groupKeys.get(roomId);
    if (!groupKey) {
      throw new Error(`No group key found for room ${roomId}`);
    }

    const exportedKey = await this.exportGroupKey(roomId);
    const keyString = JSON.stringify(exportedKey);

    return await this.encryptForPeer(peerId, keyString);
  }

  /**
   * Decrypt and import group key from peer
   */
  async decryptAndImportGroupKey(peerId: string, roomId: string, encrypted: EncryptedMessage): Promise<void> {
    const keyString = await this.decryptFromPeer(peerId, encrypted);
    const jwk = JSON.parse(keyString);
    await this.importGroupKey(roomId, jwk);
  }

  // Utility functions

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Storage functions

  private async saveKeyPair(): Promise<void> {
    if (!this.keyPair || typeof window === 'undefined') return;

    try {
      const publicKey = await window.crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey('jwk', this.keyPair.privateKey);

      localStorage.setItem(`pulselink-crypto-public-${this.userId}`, JSON.stringify(publicKey));
      localStorage.setItem(`pulselink-crypto-private-${this.userId}`, JSON.stringify(privateKey));
    } catch (error) {
      console.error('Failed to save key pair:', error);
    }
  }

  private async loadKeyPair(): Promise<KeyPair | null> {
    if (typeof window === 'undefined') return null;

    try {
      const publicKeyJwk = localStorage.getItem(`pulselink-crypto-public-${this.userId}`);
      const privateKeyJwk = localStorage.getItem(`pulselink-crypto-private-${this.userId}`);

      if (!publicKeyJwk || !privateKeyJwk) return null;

      const publicKey = await window.crypto.subtle.importKey(
        'jwk',
        JSON.parse(publicKeyJwk),
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      );

      const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        JSON.parse(privateKeyJwk),
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey']
      );

      return { publicKey, privateKey };
    } catch (error) {
      console.error('Failed to load key pair:', error);
      return null;
    }
  }

  private async saveGroupKey(roomId: string, key: CryptoKey): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const exported = await window.crypto.subtle.exportKey('jwk', key);
      localStorage.setItem(`pulselink-group-key-${roomId}`, JSON.stringify(exported));
    } catch (error) {
      console.error('Failed to save group key:', error);
    }
  }

  async loadGroupKey(roomId: string): Promise<CryptoKey | null> {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`pulselink-group-key-${roomId}`);
      if (!stored) return null;

      const key = await window.crypto.subtle.importKey(
        'jwk',
        JSON.parse(stored),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      this.groupKeys.set(roomId, key);
      return key;
    } catch (error) {
      console.error('Failed to load group key:', error);
      return null;
    }
  }

  /**
   * Load all stored group keys
   */
  async loadAllGroupKeys(): Promise<void> {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('pulselink-group-key-')) {
        const roomId = key.replace('pulselink-group-key-', '');
        await this.loadGroupKey(roomId);
      }
    }
  }

  /**
   * Clear all encryption keys (for logout/reset)
   */
  clearAllKeys(): void {
    this.keyPair = null;
    this.sharedKeys.clear();
    this.groupKeys.clear();

    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('pulselink-crypto-') || key.startsWith('pulselink-group-key-')) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Get encryption status for UI
   */
  getEncryptionStatus(): {
    hasKeyPair: boolean;
    peerCount: number;
    groupCount: number;
  } {
    return {
      hasKeyPair: this.keyPair !== null,
      peerCount: this.sharedKeys.size,
      groupCount: this.groupKeys.size,
    };
  }
}
