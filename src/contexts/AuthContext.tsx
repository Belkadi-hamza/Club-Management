import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set, get, onValue, off } from 'firebase/database';
import { auth, db, googleProvider } from '../lib/firebase';
import { Club } from '../types';

interface AuthContextType {
  currentUser: User | null;
  club: Club | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, clubData: Omit<Club, 'id'>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await loadClubData(userCredential.user.uid);
  };

  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if club exists, if not create one
    const clubRef = ref(db, `clubs/${user.uid}`);
    const clubSnapshot = await get(clubRef);
    if (!clubSnapshot.exists()) {
      const clubData: Club = {
        id: user.uid,
        name: user.displayName || 'Mon Club',
        email: user.email || '',
        phone: '',
        imageUrl: user.photoURL || undefined,
        created_at: new Date().toISOString().split('T')[0],
        sports: {},
        athletes: {}
      };
      await set(clubRef, clubData);
      setClub(clubData);
    } else {
      await loadClubData(user.uid);
    }
  };

  const register = async (email: string, password: string, clubData: Omit<Club, 'id'>) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const clubId = userCredential.user.uid;
    
    // Create club document
    const clubWithId: Club = {
      ...clubData,
      id: clubId,
      sports: {},
      athletes: {}
    };
    
    const clubRef = ref(db, `clubs/${clubId}`);
    await set(clubRef, clubWithId);
    
    setClub(clubWithId);
  };

  const logout = async () => {
    await signOut(auth);
    setClub(null);
  };

  const loadClubData = async (userId: string) => {
    try {
      // Use the authenticated user's UID as the club document ID
      const clubRef = ref(db, `clubs/${userId}`);
      
      // Set up real-time listener
      const unsubscribe = onValue(clubRef, (snapshot) => {
        if (snapshot.exists()) {
          const clubData = snapshot.val();
          setClub({ id: userId, ...clubData } as Club);
        } else {
          // Create a new club document for this user
          const defaultClub: Club = {
            id: userId,
            name: 'Mon Club',
            email: auth.currentUser?.email || '',
            phone: '',
            created_at: new Date().toISOString().split('T')[0],
            sports: {},
            athletes: {}
          };
          
          // Save the new club to Realtime Database
          set(clubRef, defaultClub);
          setClub(defaultClub);
        }
      });
      
      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading club data:', error);
      
      // Fallback: create local club data if Firestore fails
      const defaultClub: Club = {
        id: userId,
        name: 'Mon Club',
        email: auth.currentUser?.email || '',
        phone: '',
        created_at: new Date().toISOString().split('T')[0],
        sports: {},
        athletes: {}
      };
      setClub(defaultClub);
    }
  };

  useEffect(() => {
    let clubUnsubscribe: (() => void) | null = null;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        clubUnsubscribe = await loadClubData(user.uid);
      } else {
        setClub(null);
        if (clubUnsubscribe) {
          clubUnsubscribe();
          clubUnsubscribe = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (clubUnsubscribe) {
        clubUnsubscribe();
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    club,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};