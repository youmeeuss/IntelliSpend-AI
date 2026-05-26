"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isFirebaseEnabled, auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification as fbSendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { saveUserDb } from '@/app/actions/db';

export interface UserSession {
  id: string;
  deviceName: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: 'User' | 'Admin';
  sessions: UserSession[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isMock: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string; role?: 'User' | 'Admin' }) => Promise<void>;
  terminateSession: (sessionId: string) => Promise<void>;
  verifyOTPCode: (code: string) => Promise<boolean>;
  setupSandboxUsers: () => Promise<void>;
  getSessionToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse User Agent
function getDeviceDetails(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'OS';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';

  return `${browser} on ${os}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper for mock session management
  const generateMockSessions = (): UserSession[] => {
    const currentDevice = getDeviceDetails();
    return [
      { id: 'session_1', deviceName: currentDevice, lastActive: 'Active now', isCurrent: true },
      { id: 'session_2', deviceName: 'Safari on iPhone', lastActive: '2 hours ago', isCurrent: false },
      { id: 'session_3', deviceName: 'Chrome on Windows', lastActive: '3 days ago', isCurrent: false }
    ];
  };

  useEffect(() => {
    if (isFirebaseEnabled && auth) {
      // Firebase auth state observer
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            // Get additional profile data (like role) from Firestore
            let role: 'User' | 'Admin' = 'User';
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              role = userDoc.data().role || 'User';
            } else {
              // Create user record in Firestore
              await setDoc(userDocRef, {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                role: 'User',
                createdAt: new Date().toISOString()
              });
            }

            // Sync user profile to MongoDB
            await saveUserDb({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              role,
            });

            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              emailVerified: fbUser.emailVerified,
              role,
              sessions: generateMockSessions() // In real app, sessions are managed by auth backend; we simulate here
            });
          } catch (e) {
            console.error("Error loading user profile:", e);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName,
              photoURL: fbUser.photoURL,
              emailVerified: fbUser.emailVerified,
              role: 'User',
              sessions: generateMockSessions()
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock Authentication Initialization
      const savedUser = localStorage.getItem('intellispend_auth_user');
      if (savedUser) {
        try {
          const profile = JSON.parse(savedUser);
          setUser(profile);
          if (!localStorage.getItem('intellispend_auth_jwt')) {
            localStorage.setItem('intellispend_auth_jwt', `mock_jwt_token_${profile.uid}_${Date.now()}`);
          }
        } catch (e) {
          localStorage.removeItem('intellispend_auth_user');
        }
      }
      setLoading(false);
    }
  }, []);

  // Sign In / Login
  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Mock Authentication Login
        const mockUsersRaw = localStorage.getItem('intellispend_mock_users');
        const mockUsers = mockUsersRaw ? JSON.parse(mockUsersRaw) : [];
        
        // Include default preset accounts
        const defaultUsers = [
          { email: 'admin@intellispend.ai', password: 'password123', name: 'IntelliSpend Admin', role: 'Admin', photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', emailVerified: true },
          { email: 'user@intellispend.ai', password: 'password123', name: 'Sujitha Finance', role: 'User', photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sujitha', emailVerified: true }
        ];

        const allUsers = [...defaultUsers, ...mockUsers];
        const matchedUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (!matchedUser) {
          throw new Error('Invalid email or password.');
        }

        const profile: UserProfile = {
          uid: `mock_${matchedUser.email}`,
          email: matchedUser.email,
          displayName: matchedUser.name,
          photoURL: matchedUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${matchedUser.name}`,
          emailVerified: matchedUser.emailVerified || false,
          role: matchedUser.role as 'User' | 'Admin',
          sessions: generateMockSessions()
        };

        setUser(profile);
        localStorage.setItem('intellispend_auth_user', JSON.stringify(profile));
        // Mock JWT Token
        localStorage.setItem('intellispend_auth_jwt', `mock_jwt_token_${profile.uid}_${Date.now()}`);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign Up / Registration
  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await fbUpdateProfile(credentials.user, { displayName: name });
        // Set default user profile in Firestore
        const newUserProfile = {
          uid: credentials.user.uid,
          email,
          displayName: name,
          photoURL: null,
          role: 'User' as const,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', credentials.user.uid), newUserProfile);
        
        // Sync default profile to MongoDB
        await saveUserDb({
          uid: credentials.user.uid,
          email,
          displayName: name,
          photoURL: null,
          role: 'User',
        });
      } else {
        // Mock Signup
        const mockUsersRaw = localStorage.getItem('intellispend_mock_users');
        const mockUsers = mockUsersRaw ? JSON.parse(mockUsersRaw) : [];

        if (mockUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase()) || email === 'admin@intellispend.ai' || email === 'user@intellispend.ai') {
          throw new Error('An account with this email already exists.');
        }

        const newMockUser = {
          email,
          password,
          name,
          role: 'User',
          photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
          emailVerified: false // Needs verification
        };

        mockUsers.push(newMockUser);
        localStorage.setItem('intellispend_mock_users', JSON.stringify(mockUsers));

        const profile: UserProfile = {
          uid: `mock_${email}`,
          email,
          displayName: name,
          photoURL: newMockUser.photoURL,
          emailVerified: false,
          role: 'User',
          sessions: generateMockSessions()
        };

        setUser(profile);
        localStorage.setItem('intellispend_auth_user', JSON.stringify(profile));
        localStorage.setItem('intellispend_auth_jwt', `mock_jwt_token_${profile.uid}_${Date.now()}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Log Out
  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem('intellispend_auth_user');
        localStorage.removeItem('intellispend_auth_jwt');
        setUser(null);
      }
      router.push('/auth');
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password (Forgot Password)
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      if (isFirebaseEnabled && auth) {
        await sendPasswordResetEmail(auth, email);
      } else {
        // Mock password reset simulation
        console.log(`Password reset email sent to ${email}`);
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
      throw err;
    }
  };

  // Send Email Verification
  const sendVerificationEmail = async () => {
    try {
      if (isFirebaseEnabled && auth?.currentUser) {
        await fbSendEmailVerification(auth.currentUser);
      } else {
        console.log(`Email verification link sent to mock user ${user?.email}`);
      }
    } catch (err: any) {
      console.error('Email verification error:', err);
      throw err;
    }
  };

  // OTP Verification Simulation (or 2FA)
  const verifyOTPCode = async (code: string): Promise<boolean> => {
    // Standard mock verification code is 123456
    if (code === '123456') {
      if (user) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        if (!isFirebaseEnabled) {
          localStorage.setItem('intellispend_auth_user', JSON.stringify(updatedUser));
          
          // Update in mock database
          const mockUsersRaw = localStorage.getItem('intellispend_mock_users');
          if (mockUsersRaw) {
            const mockUsers = JSON.parse(mockUsersRaw);
            const userIndex = mockUsers.findIndex((u: any) => u.email === user.email);
            if (userIndex > -1) {
              mockUsers[userIndex].emailVerified = true;
              localStorage.setItem('intellispend_mock_users', JSON.stringify(mockUsers));
            }
          }
        }
      }
      return true;
    }
    return false;
  };

  // Google Login
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isFirebaseEnabled && auth) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // Simulated Google popup sign-in
        const googleProfile: UserProfile = {
          uid: 'google_mock_12345',
          email: 'google.user@gmail.com',
          displayName: 'Google Partner',
          photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=google',
          emailVerified: true,
          role: 'User',
          sessions: generateMockSessions()
        };

        setUser(googleProfile);
        localStorage.setItem('intellispend_auth_user', JSON.stringify(googleProfile));
        localStorage.setItem('intellispend_auth_jwt', `mock_jwt_token_google_12345`);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update User Profile (e.g. Avatar, Display Name, Role)
  const updateUserProfile = async (data: { displayName?: string; photoURL?: string; role?: 'User' | 'Admin' }) => {
    if (!user) return;
    setError(null);
    try {
      if (isFirebaseEnabled && auth?.currentUser) {
        if (data.displayName || data.photoURL) {
          await fbUpdateProfile(auth.currentUser, {
            displayName: data.displayName || auth.currentUser.displayName,
            photoURL: data.photoURL || auth.currentUser.photoURL
          });
        }
        if (data.role) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), { role: data.role }, { merge: true });
        }
        
        // Sync updated profile to MongoDB
        await saveUserDb({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: data.displayName || auth.currentUser.displayName,
          photoURL: data.photoURL || auth.currentUser.photoURL,
          role: data.role || user.role,
        });

        setUser(prev => prev ? {
          ...prev,
          displayName: data.displayName || prev.displayName,
          photoURL: data.photoURL || prev.photoURL,
          role: data.role || prev.role
        } : null);
      } else {
        // Mock profile update
        const updatedUser = {
          ...user,
          displayName: data.displayName !== undefined ? data.displayName : user.displayName,
          photoURL: data.photoURL !== undefined ? data.photoURL : user.photoURL,
          role: data.role !== undefined ? data.role : user.role
        };
        setUser(updatedUser);
        localStorage.setItem('intellispend_auth_user', JSON.stringify(updatedUser));

        // Update in mock registration list
        const mockUsersRaw = localStorage.getItem('intellispend_mock_users');
        if (mockUsersRaw) {
          const mockUsers = JSON.parse(mockUsersRaw);
          const userIndex = mockUsers.findIndex((u: any) => u.email === user.email);
          if (userIndex > -1) {
            if (data.displayName !== undefined) mockUsers[userIndex].name = data.displayName;
            if (data.photoURL !== undefined) mockUsers[userIndex].photoURL = data.photoURL;
            if (data.role !== undefined) mockUsers[userIndex].role = data.role;
            localStorage.setItem('intellispend_mock_users', JSON.stringify(mockUsers));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      throw err;
    }
  };

  // Terminate Device Session (Multi-device login)
  const terminateSession = async (sessionId: string) => {
    if (!user) return;
    try {
      const targetSession = user.sessions.find(s => s.id === sessionId);
      if (targetSession?.isCurrent) {
        // If they terminate current session, logout
        await logout();
        return;
      }
      
      const updatedSessions = user.sessions.filter(s => s.id !== sessionId);
      const updatedUser = { ...user, sessions: updatedSessions };
      
      setUser(updatedUser);
      if (!isFirebaseEnabled) {
        localStorage.setItem('intellispend_auth_user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      console.error('Error terminating session:', err);
    }
  };

  // Provision Sandbox Users in Firebase
  const setupSandboxUsers = async () => {
    if (!isFirebaseEnabled || !auth || !db) {
      console.log("Firebase is not enabled, sandbox provisioning skipped.");
      return;
    }

    const sandboxUsers = [
      {
        email: 'admin@intellispend.ai',
        password: 'password123',
        displayName: 'IntelliSpend Admin',
        role: 'Admin' as const,
        photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin'
      },
      {
        email: 'user@intellispend.ai',
        password: 'password123',
        displayName: 'Sujitha Finance',
        role: 'User' as const,
        photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sujitha'
      }
    ];

    for (const u of sandboxUsers) {
      let uid = '';
      try {
        // Create user in Firebase Auth
        const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        uid = cred.user.uid;
        await fbUpdateProfile(cred.user, {
          displayName: u.displayName,
          photoURL: u.photoURL
        });
        console.log(`Created Firebase Auth user: ${u.email}`);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(`Firebase Auth user already exists: ${u.email}`);
          try {
            const tempCred = await signInWithEmailAndPassword(auth, u.email, u.password);
            uid = tempCred.user.uid;
            await signOut(auth);
          } catch (signInErr) {
            console.error(`Could not sign in to resolve UID for existing user ${u.email}:`, signInErr);
          }
        } else {
          console.error(`Error creating Firebase Auth user ${u.email}:`, err);
          throw err;
        }
      }

      // If we got a UID, update/set their user profile in Firestore
      if (uid) {
        try {
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, {
            uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            role: u.role,
            createdAt: new Date().toISOString()
          }, { merge: true });
          
          // Sync sandbox profiles to MongoDB
          await saveUserDb({
            uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            role: u.role,
          });

          console.log(`Provisioned/updated Firestore and MongoDB profiles for ${u.email} with role ${u.role}`);
        } catch (firestoreErr) {
          console.error('Error writing Firestore doc for ${u.email}:', firestoreErr);
          throw firestoreErr;
        }
      }
    }
  };

  const getSessionToken = async (): Promise<string | null> => {
    if (isFirebaseEnabled && auth) {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          unsubscribe();
          if (fbUser) {
            resolve(await fbUser.getIdToken());
          } else {
            resolve(null);
          }
        });
      });
    }
    return typeof window !== 'undefined' ? localStorage.getItem('intellispend_auth_jwt') : null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isMock: !isFirebaseEnabled,
      login,
      signup,
      logout,
      resetPassword,
      sendVerificationEmail,
      loginWithGoogle,
      updateUserProfile,
      terminateSession,
      verifyOTPCode,
      setupSandboxUsers,
      getSessionToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
