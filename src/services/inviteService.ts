import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/db';
import type { Invite, Member } from '../types';

export type InviteRole = 'caretaker' | 'family';

// Unambiguous alphabet (no 0/O, 1/I/L) so codes survive being read aloud.
const TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateInviteToken(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) out += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  return out;
}

// Invite codes carry everything the joiner needs: inviteId-token-roleLetter.
// The role letter is a UI hint only; the security rules bind the actual
// role to the invite document server-side.
export function buildInviteCode(invite: Pick<Invite, 'inviteId' | 'token' | 'role'>): string {
  return `${invite.inviteId}-${invite.token}-${invite.role === 'caretaker' ? 'C' : 'F'}`;
}

export function parseInviteCode(
  code: string
): { inviteId: string; token: string; role: InviteRole } | null {
  const m = code.trim().match(/^([A-Za-z0-9_-]+)-([A-Za-z0-9]{8,64})-([CF])$/i);
  if (!m) return null;
  return {
    inviteId: m[1],
    token: m[2].toUpperCase(),
    role: m[3].toUpperCase() === 'C' ? 'caretaker' : 'family',
  };
}

export async function createInvite(
  circleId: string,
  role: InviteRole,
  createdBy: string
): Promise<Invite> {
  const inviteRef = doc(collection(db, 'circles', circleId, 'invites'));
  const invite: Invite = {
    inviteId: inviteRef.id,
    circleId,
    role,
    token: generateInviteToken(),
    used: false,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  await setDoc(inviteRef, {
    circleId: invite.circleId,
    role: invite.role,
    token: invite.token,
    used: false,
    createdBy: invite.createdBy,
    createdAt: invite.createdAt,
    createdAtServer: serverTimestamp(),
  });
  return invite;
}

export async function listInvites(circleId: string): Promise<Invite[]> {
  const snap = await getDocs(collection(db, 'circles', circleId, 'invites'));
  return snap.docs
    .map((d) => ({ inviteId: d.id, ...(d.data() as Omit<Invite, 'inviteId'>) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function revokeInvite(circleId: string, inviteId: string): Promise<void> {
  await deleteDoc(doc(db, 'circles', circleId, 'invites', inviteId));
}

// Join a circle with a single-use invite code. The invite consumption and
// the member doc are one atomic batched write: the security rules bind them
// both ways (getAfter), so a used invite, a wrong token, or a role mismatch
// fails the whole batch and leaves no partial state behind.
export async function joinCircleWithInvite(params: {
  userId: string;
  userName: string;
  userEmail: string;
  circleId: string;
  inviteCode: string;
}): Promise<void> {
  const parsed = parseInviteCode(params.inviteCode);
  if (!parsed) {
    throw new Error(
      'That invite code does not look right. It should look like XXXX-XXXX-C (caretaker) or XXXX-XXXX-F (family).'
    );
  }
  const circleId = params.circleId.trim();

  const memberData: Member = {
    memberId: params.userId,
    circleId,
    name: params.userName.trim(),
    email: params.userEmail.trim(),
    role: parsed.role,
    status: 'active',
    inviteId: parsed.inviteId,
    inviteToken: parsed.token,
  };

  const batch = writeBatch(db);
  batch.update(doc(db, 'circles', circleId, 'invites', parsed.inviteId), {
    used: true,
    usedBy: params.userId,
  });
  batch.set(doc(db, 'members', params.userId), {
    ...memberData,
    createdAtServer: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code ?? '';
    if (code === 'permission-denied' || code.endsWith('/permission-denied')) {
      throw new Error(
        'Circle ID or invite code is incorrect, or this invite was already used. Please ask the Elder or Caretaker for a fresh invite code.'
      );
    }
    throw err;
  }
}
