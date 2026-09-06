import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Officer, FirestoreUser } from '../types/models';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  officer: Officer | null;
  role: 'OFFICER' | 'ADMIN' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  jurisdictionLabel: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [role, setRole] = useState<'OFFICER' | 'ADMIN' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Set persistent session
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Could not set persistence to browserLocalPersistence:', err);
    });
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          // Fetch user profile from Firestore or server sync
          let roleValue: 'OFFICER' | 'ADMIN' = user.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'OFFICER';
          let badgeNumber = `FSO-${user.uid.slice(0, 5).toUpperCase()}`;
          let displayName = user.displayName || user.email?.split('@')[0] || 'Officer';
          let jurisdiction = 'State Food Safety Enforcement Division';
          let district = 'Sonipat & Rohtak Zone';

          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              const data = userSnap.data() as FirestoreUser;
              roleValue = data.role === 'ADMIN' ? 'ADMIN' : 'OFFICER';
              if (data.displayName) displayName = data.displayName;
              if (data.badgeNumber) badgeNumber = data.badgeNumber;
              if (data.jurisdiction) jurisdiction = data.jurisdiction;
              if (data.district) district = data.district;

              // Update lastLoginAt
              await setDoc(userDocRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
            } else {
              // Create user document if it does not exist yet
              const newProfile: FirestoreUser = {
                uid: user.uid,
                email: user.email || '',
                displayName,
                role: roleValue,
                badgeNumber,
                jurisdiction,
                district,
                department: 'Food Safety Enforcement Cell',
                clearanceLevel: roleValue === 'ADMIN' ? 'L3_DIRECTOR' : 'L2_ENFORCEMENT',
                active: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };
              await setDoc(userDocRef, newProfile);
            }
          } catch (firestoreErr) {
            console.warn('Firestore user fetch failed, calling server-side /api/auth/sync-user:', firestoreErr);
            // Fallback: sync user on server using verified token
            const token = await user.getIdToken();
            const res = await fetch('/api/auth/sync-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ displayName, badgeNumber, jurisdiction, district })
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData.user) {
                roleValue = resData.user.role;
              }
            }
          }

          setRole(roleValue);

          // Construct Officer model
          const mappedOfficer: Officer = {
            id: user.uid,
            email: user.email || '',
            displayName,
            role: roleValue,
            badgeNumber,
            jurisdiction,
            district,
            department: 'Food Safety Enforcement Cell',
            clearanceLevel: roleValue === 'ADMIN' ? 'L3_DIRECTOR' : 'L2_ENFORCEMENT',
            activeCaseCount: 4,
            createdAt: user.metadata.creationTime || new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };
          setOfficer(mappedOfficer);
        } catch (err) {
          console.error('Error synchronizing authenticated user profile:', err);
          setRole('OFFICER');
        }
      } else {
        setFirebaseUser(null);
        setOfficer(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setOfficer(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(true);
  };

  const jurisdictionLabel = officer 
    ? `${officer.jurisdiction} • Clearance ${officer.clearanceLevel} • Role ${role}`
    : 'State Food Safety Authority — Unauthenticated';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        officer,
        role,
        isAuthenticated: !!firebaseUser,
        isLoading,
        login,
        logout,
        getIdToken,
        jurisdictionLabel
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
