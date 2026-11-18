import { doc, getDoc, setDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/db';
import type { Circle, Member } from '../types';

export async function createCircleAndMember(params: {
  userId: string;
  userName: string;
  userEmail: string;
  elderName: string;
}): Promise<{ circle: Circle; member: Member }> {
  const circleRef = doc(collection(db, 'circles'));
  const circleId = circleRef.id;

  const circleData: Circle = {
    circleId,
    elderName: params.elderName.trim(),
    createdBy: params.userId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(circleRef, {
    ...circleData,
    createdAtServer: serverTimestamp(),
  });

  // Write authoritative members/{uid} doc. The security rules allow the
  // elder path only for the account recorded as the circle's createdBy.
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
