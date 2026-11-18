import { doc, getDoc, setDoc, updateDoc, deleteField, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/db';
import type { Circle, Member } from '../types';
import { hashPasscode } from '../utils/crypto';

export async function createCircleAndMember(params: {
  userId: string;
  userName: string;
  userEmail: string;
  elderName: string;
  passcode: string;
}): Promise<{ circle: Circle; member: Member }> {
  const passcodeHash = await hashPasscode(params.passcode);
  const circleRef = doc(collection(db, 'circles'));
  const circleId = circleRef.id;

  const circleData: Circle = {
    circleId,
    elderName: params.elderName.trim(),
    passcodeHash,
    createdBy: params.userId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(circleRef, {
    ...circleData,
    createdAtServer: serverTimestamp(),
  });

  // Write authoritative members/{uid} doc
  // joinProof lets the security rules verify server-side that this member
  // knows the circle passcode (it equals the circle's stored passcodeHash).
  const memberData: Member = {
    memberId: params.userId,
    circleId,
    name: params.userName.trim(),
    email: params.userEmail.trim(),
    role: 'elder',
    status: 'active',
    joinProof: passcodeHash,
  };

  const memberRef = doc(db, 'members', params.userId);
  await setDoc(memberRef, {
    ...memberData,
    createdAtServer: serverTimestamp(),
  });
  await clearJoinProof(memberRef);

  return { circle: circleData, member: memberData };
}

// joinProof is a one-time credential checked by the security rules at
// create/join. Remove it right after so it is never stored long-term or
// exposed to other circle members reading member docs.
async function clearJoinProof(memberRef: ReturnType<typeof doc>): Promise<void> {
  try {
    await updateDoc(memberRef, { joinProof: deleteField() });
  } catch (err) {
    console.warn('Could not clear transient joinProof field:', err);
  }
}

export async function joinCircleAndCreateMember(params: {
  userId: string;
  userName: string;
  userEmail: string;
  circleId: string;
  passcode: string;
  role: 'caretaker' | 'family';
}): Promise<{ circle: Circle; member: Member }> {
  const trimmedCircleId = params.circleId.trim();
  const circleRef = doc(db, 'circles', trimmedCircleId);
  const computedHash = await hashPasscode(params.passcode);

  // Under the locked-down security rules a non-member cannot read the circle
  // document; the rules verify joinProof server-side instead. When the read
  // is permitted, keep the friendly up-front passcode check.
  let circleData: Circle | null = null;
  try {
    const circleSnap = await getDoc(circleRef);
    if (circleSnap.exists()) {
      circleData = circleSnap.data() as Circle;
      if (circleData.passcodeHash !== computedHash) {
        throw new Error('Invalid Circle Passcode. Please verify with the Elder or Caretaker.');
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('Invalid Circle Passcode')) {
      throw err;
    }
    // Permission denied is expected for non-members under the locked-down
    // rules; the joinProof check below enforces the passcode server-side.
  }

  // Write authoritative members/{uid} doc; joinProof proves passcode knowledge.
  const memberData: Member = {
    memberId: params.userId,
    circleId: trimmedCircleId,
    name: params.userName.trim(),
    email: params.userEmail.trim(),
    role: params.role,
    status: 'active',
    joinProof: computedHash,
  };

  const memberRef = doc(db, 'members', params.userId);
  try {
    await setDoc(memberRef, {
      ...memberData,
      createdAtServer: serverTimestamp(),
    });
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code ?? '';
    if (code === 'permission-denied' || code.endsWith('/permission-denied')) {
      throw new Error('Circle ID or passcode is incorrect. Please verify with the Elder or Caretaker.');
    }
    throw err;
  }

  await clearJoinProof(memberRef);

  // Membership is established now, so the circle document is readable.
  if (!circleData) {
    try {
      const snap = await getDoc(circleRef);
      if (snap.exists()) circleData = snap.data() as Circle;
    } catch {
      // Non-fatal: AuthContext reloads the circle after joining.
    }
  }

  return {
    circle: circleData ?? { circleId: trimmedCircleId, elderName: '', passcodeHash: '', createdAt: '' },
    member: memberData,
  };
}

export async function getMember(userId: string): Promise<Member | null> {
  const memberRef = doc(db, 'members', userId);
  const snap = await getDoc(memberRef);
  if (!snap.exists()) return null;
  return snap.data() as Member;
}

export async function getCircle(circleId: string): Promise<Circle | null> {
  const circleRef = doc(db, 'circles', circleId);
  const snap = await getDoc(circleRef);
  if (!snap.exists()) return null;
  return snap.data() as Circle;
}

export function subscribeToCircleMembers(
  circleId: string,
  onUpdate: (members: Member[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'members'), where('circleId', '==', circleId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Member);
      onUpdate(list);
    },
    (err) => {
      console.error('Circle members subscription error:', err);
      if (onError) onError(err);
    }
  );
}
