/**
 * Client-Side JWT (JSON Web Token) Decoder, Inspector, and Validator Engine
 *
 * Implements RFC 7519 and RFC 7515 specifications locally in browser memory.
 * Decodes Header and Payload without network requests, computes expiration status,
 * parses standard claims, and performs client-side HMAC signature verification
 * via native Web Crypto API.
 */

export interface JwtHeader {
  alg?: string;
  typ?: string;
  cty?: string;
  kid?: string;
  x5t?: string;
  x5c?: string[];
  crit?: string[];
  [key: string]: any;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
  scope?: string;
  permissions?: string[];
  [key: string]: any;
}

export type JwtExpirationStatus =
  | 'active'
  | 'expired'
  | 'immature' // nbf is in the future
  | 'none' // no exp claim
  | 'invalid_date';

export interface JwtClaimMeta {
  key: string;
  value: any;
  standard: boolean;
  label: string;
  description: string;
  humanizedValue?: string;
}

export interface DecodedJwtResult {
  valid: boolean;
  rawToken: string;
  parts: {
    headerBase64: string;
    payloadBase64: string;
    signatureBase64: string;
  };
  header: JwtHeader | null;
  payload: JwtPayload | null;
  signature: string;
  rawHeaderJson: string;
  rawPayloadJson: string;
  expirationStatus: JwtExpirationStatus;
  expirationTime: {
    unix: number | null;
    utcString: string | null;
    localString: string | null;
    relativeText: string | null;
    isExpired: boolean;
    remainingMs: number | null;
  };
  issuedAtTime: {
    unix: number | null;
    utcString: string | null;
    localString: string | null;
    relativeText: string | null;
  };
  notBeforeTime: {
    unix: number | null;
    utcString: string | null;
    localString: string | null;
    relativeText: string | null;
  };
  claimsList: JwtClaimMeta[];
  algorithm: string;
  tokenType: string;
  isJwe: boolean; // 5 parts encrypted token
  error: string | null;
}

export interface SignatureVerificationResult {
  checked: boolean;
  algorithm: string;
  isValid: boolean;
  message: string;
  error?: string;
}

/**
 * Standard RFC 7519 Claim Definitions for tooltips and contextual explanations
 */
export const STANDARD_CLAIMS_MAP: Record<string, { label: string; description: string }> = {
  iss: { label: 'Issuer', description: 'Identifies the principal that issued the JWT (e.g. auth.example.com).' },
  sub: { label: 'Subject', description: 'Identifies the principal that is the subject of the JWT (e.g. user ID).' },
  aud: { label: 'Audience', description: 'Identifies the recipients that the JWT is intended for (e.g. API client ID).' },
  exp: { label: 'Expiration Time', description: 'Identifies the expiration time on or after which the JWT must not be accepted.' },
  nbf: { label: 'Not Before', description: 'Identifies the time before which the JWT must not be accepted for processing.' },
  iat: { label: 'Issued At', description: 'Identifies the time at which the JWT was issued.' },
  jti: { label: 'JWT ID', description: 'Provides a unique identifier for the JWT to prevent replay attacks.' },
  name: { label: 'Full Name', description: 'User full display name.' },
  given_name: { label: 'First Name', description: 'User given/first name.' },
  family_name: { label: 'Last Name', description: 'User surname/family name.' },
  email: { label: 'Email Address', description: 'User verified email address.' },
  email_verified: { label: 'Email Verified', description: 'Whether the user email address has been verified.' },
  roles: { label: 'User Roles', description: 'Assigned RBAC roles or permissions.' },
  role: { label: 'User Role', description: 'Assigned user role.' },
  scope: { label: 'OAuth Scopes', description: 'Space-delimited list of authorized OAuth scopes.' },
  azp: { label: 'Authorized Party', description: 'OAuth 2.0 client ID of the party to which the token was issued.' },
  nonce: { label: 'Nonce', description: 'String value used to associate a Client session with an ID Token.' },
  auth_time: { label: 'Auth Time', description: 'Time when the End-User authentication occurred.' },
};

/**
 * Safely decodes a Base64URL string to a UTF-8 string with full Unicode support
 */
export function base64UrlDecode(str: string): string {
  if (!str) return '';

  // Clean whitespace and replace Base64URL URL-safe chars with standard Base64 chars
  let base64 = str.trim().replace(/-/g, '+').replace(/_/g, '/');

  // Strip any pre-existing padding to avoid double-padding
  base64 = base64.replace(/=+$/, '');

  // Validate Base64 characters
  if (!/^[A-Za-z0-9+/=]*$/.test(base64)) {
    throw new Error('Malformed Base64URL characters: Input contains illegal non-base64 characters');
  }

  // Pad with '=' to make length a multiple of 4
  const pad = base64.length % 4;
  if (pad === 2) {
    base64 += '==';
  } else if (pad === 3) {
    base64 += '=';
  } else if (pad === 1) {
    throw new Error('Illegal Base64URL string length (modulo 4 is 1)');
  }

  let binaryStr: string;
  try {
    binaryStr = atob(base64);
  } catch (err: any) {
    throw new Error(`Malformed Base64URL characters: ${err?.message || 'Invalid base64 encoding'}`);
  }

  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (err: any) {
    throw new Error(`Invalid UTF-8 byte sequence in decoded payload: ${err?.message || 'Decoding failed'}`);
  }
}

/**
 * Encodes a UTF-8 string to a Base64URL string (RFC 7515)
 */
export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binaryStr = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Format relative time distance into a concise, human-readable sentence
 */
export function formatRelativeTime(targetUnixSec: number, nowUnixSec = Math.floor(Date.now() / 1000)): string {
  const diffSec = targetUnixSec - nowUnixSec;
  const isFuture = diffSec > 0;
  const absSec = Math.abs(diffSec);

  if (absSec < 5) {
    return isFuture ? 'in a few seconds' : 'just now';
  }

  if (absSec < 60) {
    return isFuture ? `in ${absSec} seconds` : `${absSec} seconds ago`;
  }

  const minutes = Math.floor(absSec / 60);
  if (minutes < 60) {
    return isFuture
      ? `in ${minutes} minute${minutes === 1 ? '' : 's'}`
      : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remMins = minutes % 60;
    const minSuffix = remMins > 0 ? ` ${remMins}m` : '';
    return isFuture
      ? `in ${hours}h${minSuffix}`
      : `${hours}h${minSuffix} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return isFuture
      ? `in ${days} day${days === 1 ? '' : 's'}`
      : `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  return isFuture
    ? `in ${months} month${months === 1 ? '' : 's'}`
    : `${months} month${months === 1 ? '' : 's'} ago`;
}

/**
 * Decodes and inspects a JWT token string
 */
export function decodeJwt(tokenInput: string, customNowUnixSec?: number): DecodedJwtResult {
  const cleanToken = tokenInput.trim();

  const emptyResult: DecodedJwtResult = {
    valid: false,
    rawToken: cleanToken,
    parts: { headerBase64: '', payloadBase64: '', signatureBase64: '' },
    header: null,
    payload: null,
    signature: '',
    rawHeaderJson: '',
    rawPayloadJson: '',
    expirationStatus: 'none',
    expirationTime: { unix: null, utcString: null, localString: null, relativeText: null, isExpired: false, remainingMs: null },
    issuedAtTime: { unix: null, utcString: null, localString: null, relativeText: null },
    notBeforeTime: { unix: null, utcString: null, localString: null, relativeText: null },
    claimsList: [],
    algorithm: 'none',
    tokenType: 'JWT',
    isJwe: false,
    error: null
  };

  if (!cleanToken) {
    return { ...emptyResult, error: 'Please enter or paste a JWT token to decode.' };
  }

  // Remove possible "Bearer " prefix if user copied from Authorization header
  const token = cleanToken.replace(/^Bearer\s+/i, '').trim();

  const segments = token.split('.');

  // Check for JWE (JSON Web Encryption) with 5 parts
  if (segments.length === 5) {
    return {
      ...emptyResult,
      isJwe: true,
      error: 'This is an encrypted JWE (JSON Web Encryption) token consisting of 5 compact segments (Header.EncryptedKey.IV.Ciphertext.Tag). The payload is encrypted and cannot be decoded as plaintext claims without the decryption key.'
    };
  }

  if (segments.length !== 3) {
    return {
      ...emptyResult,
      error: `Invalid JWT format. A standard JSON Web Token consists of exactly 3 dot-separated segments (Header.Payload.Signature). Found ${segments.length} segment${segments.length === 1 ? '' : 's'}.`
    };
  }

  const [headerB64, payloadB64, signatureB64] = segments;

  if (!headerB64.trim()) {
    return {
      ...emptyResult,
      parts: { headerBase64: headerB64, payloadBase64: payloadB64, signatureBase64: signatureB64 },
      error: 'Invalid JWT Header: Header segment is empty.'
    };
  }

  if (!payloadB64.trim()) {
    return {
      ...emptyResult,
      parts: { headerBase64: headerB64, payloadBase64: payloadB64, signatureBase64: signatureB64 },
      error: 'Invalid JWT Payload: Payload segment is empty.'
    };
  }

  let decodedHeader: JwtHeader | null = null;
  let decodedPayload: JwtPayload | null = null;
  let headerJsonStr = '';
  let payloadJsonStr = '';

  // 1. Decode Header
  try {
    headerJsonStr = base64UrlDecode(headerB64);
    decodedHeader = JSON.parse(headerJsonStr);
    if (!decodedHeader || typeof decodedHeader !== 'object' || Array.isArray(decodedHeader)) {
      throw new Error('Header must be a valid JSON object');
    }
  } catch (err: any) {
    return {
      ...emptyResult,
      parts: { headerBase64: headerB64, payloadBase64: payloadB64, signatureBase64: signatureB64 },
      error: `Invalid JWT Header: ${err?.message || 'Failed to parse Base64URL header into JSON'}`
    };
  }

  // 2. Decode Payload
  try {
    payloadJsonStr = base64UrlDecode(payloadB64);
    decodedPayload = JSON.parse(payloadJsonStr);
    if (!decodedPayload || typeof decodedPayload !== 'object' || Array.isArray(decodedPayload)) {
      throw new Error('Payload must be a valid JSON object');
    }
  } catch (err: any) {
    return {
      ...emptyResult,
      parts: { headerBase64: headerB64, payloadBase64: payloadB64, signatureBase64: signatureB64 },
      header: decodedHeader,
      rawHeaderJson: JSON.stringify(decodedHeader, null, 2),
      algorithm: decodedHeader.alg || 'unknown',
      tokenType: decodedHeader.typ || 'JWT',
      error: `Invalid JWT Payload: ${err?.message || 'Failed to parse Base64URL payload into JSON'}`
    };
  }

  // 3. Process Timestamps & Expiration
  const nowUnixSec = typeof customNowUnixSec === 'number' ? customNowUnixSec : Math.floor(Date.now() / 1000);
  let expStatus: JwtExpirationStatus = 'none';
  let isExpired = false;
  let remainingMs: number | null = null;

  const expirationTime: DecodedJwtResult['expirationTime'] = {
    unix: null,
    utcString: null,
    localString: null,
    relativeText: null,
    isExpired: false,
    remainingMs: null
  };

  if (decodedPayload.exp !== undefined) {
    const expNum = Number(decodedPayload.exp);
    if (!isNaN(expNum) && isFinite(expNum)) {
      const expDate = new Date(expNum * 1000);
      if (!isNaN(expDate.getTime())) {
        isExpired = nowUnixSec >= expNum;
        remainingMs = (expNum - nowUnixSec) * 1000;
        expStatus = isExpired ? 'expired' : 'active';

        expirationTime.unix = expNum;
        expirationTime.utcString = expDate.toUTCString();
        expirationTime.localString = expDate.toLocaleString();
        expirationTime.relativeText = formatRelativeTime(expNum, nowUnixSec);
        expirationTime.isExpired = isExpired;
        expirationTime.remainingMs = remainingMs;
      } else {
        expStatus = 'invalid_date';
      }
    } else {
      expStatus = 'invalid_date';
    }
  }

  // Not Before (nbf)
  const notBeforeTime: DecodedJwtResult['notBeforeTime'] = {
    unix: null,
    utcString: null,
    localString: null,
    relativeText: null
  };
  if (decodedPayload.nbf !== undefined) {
    const nbfNum = Number(decodedPayload.nbf);
    if (!isNaN(nbfNum) && isFinite(nbfNum)) {
      const nbfDate = new Date(nbfNum * 1000);
      if (!isNaN(nbfDate.getTime())) {
        if (nowUnixSec < nbfNum) {
          expStatus = 'immature';
        }
        notBeforeTime.unix = nbfNum;
        notBeforeTime.utcString = nbfDate.toUTCString();
        notBeforeTime.localString = nbfDate.toLocaleString();
        notBeforeTime.relativeText = formatRelativeTime(nbfNum, nowUnixSec);
      }
    }
  }

  // Issued At (iat)
  const issuedAtTime: DecodedJwtResult['issuedAtTime'] = {
    unix: null,
    utcString: null,
    localString: null,
    relativeText: null
  };
  if (decodedPayload.iat !== undefined) {
    const iatNum = Number(decodedPayload.iat);
    if (!isNaN(iatNum) && isFinite(iatNum)) {
      const iatDate = new Date(iatNum * 1000);
      if (!isNaN(iatDate.getTime())) {
        issuedAtTime.unix = iatNum;
        issuedAtTime.utcString = iatDate.toUTCString();
        issuedAtTime.localString = iatDate.toLocaleString();
        issuedAtTime.relativeText = formatRelativeTime(iatNum, nowUnixSec);
      }
    }
  }

  // 4. Construct Claims Breakdown List
  const claimsList: JwtClaimMeta[] = [];
  const payloadKeys = Object.keys(decodedPayload);

  for (const key of payloadKeys) {
    const val = decodedPayload[key];
    const stdDef = STANDARD_CLAIMS_MAP[key];

    let humanizedValue: string | undefined;
    if (key === 'exp' && expirationTime.utcString) {
      humanizedValue = `${expirationTime.utcString} (${expirationTime.relativeText})`;
    } else if (key === 'iat' && issuedAtTime.utcString) {
      humanizedValue = `${issuedAtTime.utcString} (${issuedAtTime.relativeText})`;
    } else if (key === 'nbf' && notBeforeTime.utcString) {
      humanizedValue = `${notBeforeTime.utcString} (${notBeforeTime.relativeText})`;
    } else if (typeof val === 'boolean') {
      humanizedValue = val ? 'true' : 'false';
    } else if (Array.isArray(val)) {
      humanizedValue = val.join(', ');
    } else if (typeof val === 'object' && val !== null) {
      humanizedValue = JSON.stringify(val);
    }

    claimsList.push({
      key,
      value: val,
      standard: !!stdDef,
      label: stdDef?.label || key,
      description: stdDef?.description || 'Custom application-defined claim.',
      humanizedValue
    });
  }

  return {
    valid: true,
    rawToken: token,
    parts: {
      headerBase64: headerB64,
      payloadBase64: payloadB64,
      signatureBase64: signatureB64
    },
    header: decodedHeader,
    payload: decodedPayload,
    signature: signatureB64,
    rawHeaderJson: JSON.stringify(decodedHeader, null, 2),
    rawPayloadJson: JSON.stringify(decodedPayload, null, 2),
    expirationStatus: expStatus,
    expirationTime,
    issuedAtTime,
    notBeforeTime,
    claimsList,
    algorithm: decodedHeader.alg || 'none',
    tokenType: decodedHeader.typ || 'JWT',
    isJwe: false,
    error: null
  };
}

/**
 * Client-Side HMAC Signature Verification using Web Crypto API (SubtleCrypto)
 * Verifies HS256, HS384, and HS512 signatures in browser memory without network requests.
 */
export async function verifyHmacSignature(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  algorithm: string,
  secretOrKey: string,
  isBase64Secret = false
): Promise<SignatureVerificationResult> {
  const upperAlg = (algorithm || '').toUpperCase().trim();

  const algMap: Record<string, { hash: string; bitLen: number }> = {
    HS256: { hash: 'SHA-256', bitLen: 256 },
    HS384: { hash: 'SHA-384', bitLen: 384 },
    HS512: { hash: 'SHA-512', bitLen: 512 }
  };

  const algConfig = algMap[upperAlg];
  if (!algConfig) {
    if (upperAlg === 'NONE' || !upperAlg) {
      return {
        checked: false,
        algorithm: 'none',
        isValid: false,
        message: 'Unsigned Token: The algorithm is "none", meaning this token does not contain a cryptographic signature and cannot be authenticated.'
      };
    }

    if (upperAlg.startsWith('RS') || upperAlg.startsWith('ES') || upperAlg.startsWith('PS')) {
      return {
        checked: false,
        algorithm: upperAlg,
        isValid: false,
        message: `Asymmetric algorithm (${upperAlg}) requires public key certificate verification (PEM/JWK). Symmetric HMAC secrets cannot authenticate this token.`
      };
    }

    return {
      checked: false,
      algorithm: upperAlg,
      isValid: false,
      message: `Unsupported signature algorithm "${upperAlg}". Zapixal supports in-memory HMAC verification for HS256, HS384, and HS512.`
    };
  }

  if (!secretOrKey || secretOrKey.trim().length === 0) {
    return {
      checked: false,
      algorithm: upperAlg,
      isValid: false,
      message: 'Please provide the secret key to verify the HMAC signature.'
    };
  }

  try {
    // 1. Prepare key bytes
    let keyBytes: Uint8Array;
    if (isBase64Secret) {
      const cleanB64 = secretOrKey.trim().replace(/-/g, '+').replace(/_/g, '/');
      try {
        const binStr = atob(cleanB64);
        keyBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          keyBytes[i] = binStr.charCodeAt(i);
        }
      } catch (e: any) {
        return {
          checked: false,
          algorithm: upperAlg,
          isValid: false,
          message: 'Invalid Base64 secret format: secret string cannot be decoded as Base64.'
        };
      }
    } else {
      keyBytes = new TextEncoder().encode(secretOrKey);
    }

    // 2. Import key into Web Crypto API
    const subtle = (typeof window !== 'undefined' && window.crypto?.subtle) ? window.crypto.subtle : (globalThis as any).crypto?.subtle;
    if (!subtle) {
      return {
        checked: false,
        algorithm: upperAlg,
        isValid: false,
        message: 'Web Crypto API (SubtleCrypto) is not supported in this runtime environment.'
      };
    }

    const cryptoKey = await subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: algConfig.hash } },
      false,
      ['verify', 'sign']
    );

    // 3. Compute expected signature over "header.payload"
    const messageData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    // Decode provided signature bytes
    let cleanSigB64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    const pad = cleanSigB64.length % 4;
    if (pad === 2) cleanSigB64 += '==';
    else if (pad === 3) cleanSigB64 += '=';
    else if (pad === 1) {
      return {
        checked: true,
        algorithm: upperAlg,
        isValid: false,
        message: '✕ Invalid Signature! The signature segment is malformed or illegal length for Base64URL.'
      };
    }

    let signatureBytes: Uint8Array;
    try {
      const sigBinary = atob(cleanSigB64);
      signatureBytes = new Uint8Array(sigBinary.length);
      for (let i = 0; i < sigBinary.length; i++) {
        signatureBytes[i] = sigBinary.charCodeAt(i);
      }
    } catch (e: any) {
      return {
        checked: true,
        algorithm: upperAlg,
        isValid: false,
        message: '✕ Invalid Signature! The signature segment contains malformed Base64URL characters.'
      };
    }

    // 4. Verify signature
    const isValid = await subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes,
      messageData
    );

    return {
      checked: true,
      algorithm: upperAlg,
      isValid,
      message: isValid
        ? '✓ Signature Verified! The token has not been tampered with and was signed using this HMAC secret.'
        : '✕ Invalid Signature! The secret key did not match or the token payload has been modified.'
    };
  } catch (err: any) {
    return {
      checked: false,
      algorithm: upperAlg,
      isValid: false,
      message: `Signature verification error: ${err?.message || 'Internal crypto failure'}`,
      error: err?.message
    };
  }
}

/**
 * Sample JWT tokens for quick 1-click testing and demonstration
 */
export const SAMPLE_JWTS = {
  auth0: {
    name: 'Auth0 / OIDC Standard Token',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20vIiwic3ViIjoiYXV0aDB8NjU3MzgxOTIzODk0IiwibmFtZSI6IkFsZXggTW9yZ2FuIiwiZW1haWwiOiJhbGV4Lm1vcmdhbkBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJyb2xlcyI6WyJhZG1pbiIsImRldmVsb3BlciJdLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIHJlYWQ6ZGF0YSIsImlhdCI6MTcwNDAwMDAwMCwiZXhwIjoyMDgwMDAwMDAwfQ.gP2WwzZ4zXgHekB9bNnI966Q9p_3fT9h2BvYj0w_fHw'
  },
  firebase: {
    name: 'Firebase Auth ID Token',
    token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1YTMyNmEzZGY4ZTc0MjFiNGUyNDBhODk4MGRkYTkwMWJkYzFkYjciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vemFwaXhhbC1hdXRoLWRlbW8iLCJhdWQiOiJ6YXBpeGFsLWF1dGgtZGVtbyIsImF1dGhfdGltZSI6MTcwNDAwMDAwMCwidXNlcl9pZCI6IjhkRjIxODlhOTFmYiIsInN1YiI6IjhkRjIxODlhOTFmYiIsImlhdCI6MTcwNDAwMDAwMCwiZXhwIjoyMDgwMDAwMDAwLCJlbWFpbCI6ImRldmVsb3BlckB6YXBpeGFsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImRldmVsb3BlckB6YXBpeGFsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.D8J_9c0Z1P9Kq4T7B_2x3X1z_W8kY0n-p'
  },
  expired: {
    name: 'Expired Staging Token',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1NiIsIm5hbWUiOiJKb2huIERvZSIsImFkbWluIjpmYWxzZSwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMzJ9.4S86_y-Uo8c5Ea4t4qMvCg9vN6A41PqE-gqg0Q-d'
  },
  nested: {
    name: 'Complex RBAC & Permissions Token',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FwaS56YXBpeGFsLmNvbSIsInN1YiI6InVzcl85OTAxMDAiLCJvcmdfaWQiOiJvcmdfY29ycF8wMDEiLCJvcmdfbmFtZSI6IlphcGl4YWwgRW50ZXJwcmlzZSIsInJvbGVzIjpbIm93bmVyIl0sInBlcm1pc3Npb25zIjp7ImltYWdlcyI6WyJyZWFkIiwid3JpdGUiLCJkZWxldGUiXSwiZG9jdW1lbnRzIjpbInJlYWQiLCJ3cml0ZSJdLCJiaWxsaW5nIjpbIm1hbmFnZSJdfSwidXNhZ2VfbGltaXRzIjp7Im1heF9iYXRjaF9zaXplIjoxMDAwLCJhbGxvd2VkX2NvZGVjcyI6WyJqcGVnIiwicG5nIiwid2VicCIsImF2aWYiLCJoZWljIl19LCJpYXQiOjE3MDQwMDAwMDAsImV4cCI6MjA4MDAwMDAwMH0.1D7_v0P9x-W6B5p-j3f'
  }
};
