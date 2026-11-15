// Standard Web Crypto API hashing for circle passcode
export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  // Salt with platform namespace to avoid precomputed rainbow tables
  const salted = `sahaara_salt_v1:${passcode.trim().toUpperCase()}`;
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate an easy-to-read 6-character alphanumeric passcode (e.g. SAH-492)
export function generatePasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
