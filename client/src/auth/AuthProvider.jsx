
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useAuth,
  useUser,
  useClerk,
} from '@clerk/clerk-react';
import { api, setTokenProvider } from '../api';

const AuthContext = createContext(null);

function ClerkAuthProvider({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    setTokenProvider(async () => {
      if (!isSignedIn) return null;
      return getToken();
    });

    return () => {
      setTokenProvider(async () => null);
    };
  }, [getToken, isSignedIn]);

  useEffect(() => {
    let active = true;

    if (!isLoaded || !userLoaded) return undefined;

    if (!isSignedIn || !clerkUser) {
      setProfile(null);
      setProfileLoading(false);

      return () => {
        active = false;
      };
    }

    setProfileLoading(true);

    const syncProfile = async () => {
      const name =
        clerkUser.fullName ||
        clerkUser.firstName ||
        'Learner';

      const email =
        clerkUser.primaryEmailAddress?.emailAddress || '';

      const avatarUrl = clerkUser.imageUrl || '';

      try {
        const { data } = await api.patch('/users/me/profile', {
          name,
          avatarUrl,
        });

        const backendUser = data?.user || data;

        if (!backendUser || !backendUser.role) {
          throw new Error(
            'The backend profile did not return a user role.',
          );
        }

        if (active) {
          setProfile({
            ...backendUser,
            id: backendUser.id || backendUser._id || clerkUser.id,
            clerkId: clerkUser.id,
            name: backendUser.name || name,
            email: backendUser.email || email,
            avatarUrl: backendUser.avatarUrl || avatarUrl,
            role: backendUser.role,
            profileSyncError: null,
          });
        }
      } catch (error) {
        console.error(
          'Edemy profile synchronization failed:',
          error.response?.data?.message || error.message,
        );

        if (active) {
          setProfile({
            id: clerkUser.id,
            clerkId: clerkUser.id,
            name,
            email,
            avatarUrl,
            role: null,
            profileSyncError:
              error.response?.data?.message ||
              error.message ||
              'Profile synchronization failed',
          });
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    syncProfile();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, userLoaded, clerkUser]);

  const logout = async () => {
    await signOut({ redirectUrl: '/' });
    setProfile(null);
  };

  const value = useMemo(
    () => ({
      user: profile,
      loading: !isLoaded || !userLoaded || profileLoading,
      login: null,
      register: null,
      logout,
      isClerk: true,
    }),
    [profile, isLoaded, userLoaded, profileLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

export function useSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useSession must be used within AuthProvider',
    );
  }

  return context;
}
