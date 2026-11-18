import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/db';
import type { CareActivity, ActivityType, Role } from '../types';

export async function recordCareActivity(params: {
  circleId: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  actorRole: Role | 'system';
  details: string;
  metadata?: Record<string, unknown>;
}): Promise<CareActivity> {
  const actRef = doc(collection(db, 'careActivities'));
  const activityId = actRef.id;

  const activity: CareActivity = {
    activityId,
    circleId: params.circleId,
    type: params.type,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    timestamp: new Date().toISOString(),
    details: params.details,
    metadata: params.metadata || {},
  };

  await setDoc(actRef, {
    ...activity,
    createdAtServer: serverTimestamp(),
  });

  return activity;
}

export function subscribeToCareActivities(
  circleId: string,
  onUpdate: (activities: CareActivity[]) => void,
  maxCount: number = 30,
  onError?: (err: Error) => void
): () => void {
  // Query by circleId to avoid missing composite index errors on (circleId, timestamp)
  const q = query(
    collection(db, 'careActivities'),
    where('circleId', '==', circleId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CareActivity);
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(list.slice(0, maxCount));
    },
    (err) => {
      console.error('CareActivities subscription error:', err);
      if (onError) onError(err);
    }
  );
}
