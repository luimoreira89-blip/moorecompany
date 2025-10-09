
import React, { useState, useMemo, useCallback } from 'react';
import { User } from './types';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { useLocalStorage } from './hooks/useLocalStorage';

export const AuthContext = React.createContext<{
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    register: (user: User) => boolean;
} | null>(null);


const App: React.FC = () => {
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

    const login = useCallback((user: User) => {
        const foundUser = users.find(u => u.username === user.username && u.password === user.password);
        if (foundUser) {
            setCurrentUser(foundUser);
            return true;
        }
        return false;
    }, [users, setCurrentUser]);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, [setCurrentUser]);

    const register = useCallback((user: User): boolean => {
        const userExists = users.some(u => u.username === user.username);
        if (userExists) {
            return false;
        }
        setUsers(prevUsers => [...prevUsers, user]);
        return true;
    }, [users, setUsers]);

    const authContextValue = useMemo(() => ({
        user: currentUser,
        login: (user: User) => {
            if (login(user)) {
                return true;
            }
            return false;
        },
        logout,
        register,
    }), [currentUser, login, logout, register]);

    return (
        <AuthContext.Provider value={authContextValue}>
            <div className="min-h-screen bg-gray-900 text-gray-200">
                {currentUser ? <Dashboard user={currentUser} logout={logout} /> : <AuthPage login={login} register={register} />}
            </div>
        </AuthContext.Provider>
    );
};

export default App;
