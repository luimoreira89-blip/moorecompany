
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User } from './types';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { useLocalStorage } from './hooks/useLocalStorage';

declare global {
    interface Window {
        signInWithEmailPassword: (email: string, password: string) => Promise<any>;
        signUpWithEmailPassword: (email: string, password: string) => Promise<any>;
        signOutFirebase: () => void;
        saveUserData: (data: Partial<User>) => Promise<void>;
        watchUserData: (callback: (data: User | {}) => void) => () => void;
    }
}


export const AuthContext = React.createContext<{
    user: User | null;
    logout: () => void;
} | null>(null);

type AuthUser = { uid: string; email?: string; displayName?: string; photoURL?: string } | null;
type AuthState = { loggedIn: boolean; user: AuthUser };

interface AppProps {
  authState?: AuthState;
}


const App: React.FC<AppProps> = ({ authState }) => {
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

    const logout = useCallback(() => {
        // Se for um usuário Firebase (tem uid), desloga do Firebase
        if (currentUser?.uid) {
            window.signOutFirebase();
        }
        // Limpa o usuário local para todos os casos
        setCurrentUser(null);
    }, [setCurrentUser, currentUser]);

     useEffect(() => {
        const handleAuthStateChange = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { loggedIn, user: firebaseUser } = customEvent.detail;
            
            if (loggedIn) {
                // Seta o usuário no estado do React
                setCurrentUser({
                    username: firebaseUser.displayName || firebaseUser.email,
                    ...firebaseUser
                });
            } else {
                // Limpa o usuário ao deslogar
                setCurrentUser(null);
            }
        };

        window.addEventListener('firebase-auth-state-changed', handleAuthStateChange);
        return () => {
            window.removeEventListener('firebase-auth-state-changed', handleAuthStateChange);
        };
    }, [setCurrentUser]);


    const authContextValue = useMemo(() => ({
        user: currentUser,
        logout,
    }), [currentUser, logout]);

    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="min-h-screen bg-gray-900 text-gray-200">
                {currentUser ? <Dashboard user={currentUser} logout={logout} /> : <AuthPage />}
            </div>
        </AuthContext.Provider>
    );
};

export default App;