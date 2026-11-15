import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getMember, getCircle } from '../services/circleService';
import type { Member, Circle } from '../types';

interface AuthContextType {
  currentUser: User | null;
  member: Member | null;
  circle: Circle | null;
  loading: boolean;
  logout: () => Promise<void>;
  reloadMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMemberAndCircle = async (uid: string) => {
    try {
      const memberDoc = await getMember(uid);
      if (memberDoc) {
        setMember(memberDoc);
        const circleDoc = await getCircle(memberDoc.circleId);
        setCircle(circleDoc);
      } else {
        setMember(null);
        setCircle(null);
      }
    } catch (err) {
      console.error('Error fetching member/circle profile:', err);
      setMember(null);
      setCircle(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchMemberAndCircle(user.uid);
      } else {
        setMember(null);
        setCircle(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setMember(null);
    setCircle(null);
  };

  const reloadMember = async () => {
    if (currentUser) {
      await fetchMemberAndCircle(currentUser.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        member,
        circle,
        loading,
        logout,
        reloadMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
