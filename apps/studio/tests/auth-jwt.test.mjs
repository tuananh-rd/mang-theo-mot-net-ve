import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyCloudflareAccessJwt,
  decodeJwt,
  isPlaceholderOrUnconfigured,
  AuthConfigMissingError,
  AuthError,
  clearJwksCache,
} from '../dist/auth/jwt.js';

// Helper tạo cặp khóa RSA cho test Web Crypto
async function generateTestRsaKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createSignedTestJwt(header, payload, privateKey) {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data);
  const sigBytes = new Uint8Array(signature);
  let binarySig = '';
  for (let i = 0; i < sigBytes.length; i++) {
    binarySig += String.fromCharCode(sigBytes[i]);
  }
  const sigB64 = btoa(binarySig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

test('JWT: Fail-secure khi thiếu cấu hình hoặc dùng giá trị placeholder', () => {
  assert.equal(isPlaceholderOrUnconfigured(''), true);
  assert.equal(isPlaceholderOrUnconfigured(undefined), true);
  assert.equal(isPlaceholderOrUnconfigured('example-team.cloudflareaccess.com'), true);
  assert.equal(isPlaceholderOrUnconfigured('00000000-0000-0000-0000-000000000000'), true);
  assert.equal(isPlaceholderOrUnconfigured('valid-org.cloudflareaccess.com'), false);

  assert.rejects(
    async () => {
      await verifyCloudflareAccessJwt('some.token.value', {
        teamDomain: '',
        expectedAud: 'valid-aud',
      });
    },
    AuthConfigMissingError
  );

  assert.rejects(
    async () => {
      await verifyCloudflareAccessJwt('some.token.value', {
        teamDomain: 'example-team.cloudflareaccess.com',
        expectedAud: '00000000000000000000000000000000',
      });
    },
    AuthConfigMissingError
  );
});

test('JWT: Giải mã và xác thực chữ ký RS256 hợp lệ', async () => {
  const keyPair = await generateTestRsaKeyPair();
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  publicJwk.kid = 'test-key-1';

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: 'test-key-1', typ: 'JWT' };
  const payload = {
    iss: 'https://real-team.cloudflareaccess.com',
    aud: 'aud-app-12345',
    sub: 'user-sub-001',
    email: 'admin@mangtheomotnetve.vn',
    exp: now + 3600,
    nbf: now - 10,
  };

  const token = await createSignedTestJwt(header, payload, keyPair.privateKey);

  const verified = await verifyCloudflareAccessJwt(token, {
    teamDomain: 'real-team.cloudflareaccess.com',
    expectedAud: 'aud-app-12345',
    jwks: { keys: [publicJwk] },
    now,
  });

  assert.equal(verified.email, 'admin@mangtheomotnetve.vn');
  assert.equal(verified.sub, 'user-sub-001');
});

test('JWT: Từ chối token hết hạn (exp)', async () => {
  const keyPair = await generateTestRsaKeyPair();
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const now = Math.floor(Date.now() / 1000);

  const token = await createSignedTestJwt(
    { alg: 'RS256', kid: 'test-key-1' },
    {
      iss: 'https://real-team.cloudflareaccess.com',
      aud: 'aud-app-12345',
      sub: 'usr-1',
      email: 'user@test.vn',
      exp: now - 10, // đã hết hạn
    },
    keyPair.privateKey
  );

  await assert.rejects(
    async () => {
      await verifyCloudflareAccessJwt(token, {
        teamDomain: 'real-team.cloudflareaccess.com',
        expectedAud: 'aud-app-12345',
        jwks: { keys: [publicJwk] },
        now,
      });
    },
    (err) => err instanceof AuthError && err.code === 'TOKEN_EXPIRED'
  );
});

test('JWT: Từ chối token sai issuer hoặc audience', async () => {
  const keyPair = await generateTestRsaKeyPair();
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const now = Math.floor(Date.now() / 1000);

  const token = await createSignedTestJwt(
    { alg: 'RS256', kid: 'test-key-1' },
    {
      iss: 'https://attacker.cloudflareaccess.com', // sai iss
      aud: 'aud-app-12345',
      sub: 'usr-1',
      email: 'user@test.vn',
      exp: now + 3600,
    },
    keyPair.privateKey
  );

  await assert.rejects(
    async () => {
      await verifyCloudflareAccessJwt(token, {
        teamDomain: 'real-team.cloudflareaccess.com',
        expectedAud: 'aud-app-12345',
        jwks: { keys: [publicJwk] },
        now,
      });
    },
    (err) => err instanceof AuthError && err.code === 'ISSUER_MISMATCH'
  );
});

test('JWT: Từ chối token có chữ ký bị giả mạo / sửa đổi', async () => {
  const keyPair = await generateTestRsaKeyPair();
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const now = Math.floor(Date.now() / 1000);

  const token = await createSignedTestJwt(
    { alg: 'RS256', kid: 'test-key-1' },
    {
      iss: 'https://real-team.cloudflareaccess.com',
      aud: 'aud-app-12345',
      sub: 'usr-1',
      email: 'user@test.vn',
      exp: now + 3600,
    },
    keyPair.privateKey
  );

  // Giả mạo payload bằng cách thay thế phần giữa
  const parts = token.split('.');
  const forgedPayload = base64UrlEncode(JSON.stringify({
    iss: 'https://real-team.cloudflareaccess.com',
    aud: 'aud-app-12345',
    sub: 'usr-hacker',
    email: 'hacker@test.vn',
    exp: now + 3600,
  }));
  const forgedToken = `${parts[0]}.${forgedPayload}.${parts[2]}`;

  await assert.rejects(
    async () => {
      await verifyCloudflareAccessJwt(forgedToken, {
        teamDomain: 'real-team.cloudflareaccess.com',
        expectedAud: 'aud-app-12345',
        jwks: { keys: [publicJwk] },
        now,
      });
    },
    (err) => err instanceof AuthError && err.code === 'SIGNATURE_INVALID'
  );
});
