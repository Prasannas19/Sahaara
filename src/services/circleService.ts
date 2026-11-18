import { doc, getDoc, setDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
    createdAt: new Date().toISOString(),
  };

  await setDoc(circleRef, {
    ...circleData,
    createdAtServer: serverTimestamp(),
  });

  // Write authoritative members/{uid} doc
  const memberData: Member = {
    memberId: params.userId,
    circleId,
    name: params.userName.trim(),
    email: params.userEmail.trim(),
    role: 'elder',
    status: 'active',
  };

  const memberRef = doc(db, 'members', params.userId);
  await setDoc(memberRef, {
    ...memberData,
    createdAtServer: serverTimestamp(),
  });

  return { circle: circleData, member: memberData };
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
  const circleSnap = await getDoc(circleRef);

  if (!circleSnap.exists()) {
    throw new Error('Circle not found. Please check the Circle ID.');
  }

  const circleData = circleSnap.data() as Circle;
  const computedHash = await hashPasscode(params.passcode);

  if (circleData.passcodeHash !== computedHash) {
    throw new Error('Invalid Circle Passcode. Please verify with the Elder or Caretaker.');
  }

  // Write authoritative members/{uid} doc
  const memberData: Member = {
    memberId: params.userId,
    circleId: trimmedCircleId,
    name: params.userName.trim(),
    email: params.userEmail.trim(),
    role: params.role,
    status: 'active',
  };

  const memberRef = doc(db, 'members', params.userId);
  await setDoc(memberRef, {
    ...memberData,
    createdAtServer: serverTimestamp(),
  });

  return { circle: circleData, member: memberData };
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
