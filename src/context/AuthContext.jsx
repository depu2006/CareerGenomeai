import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const DEFAULT_USER = {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'user@careergenome.com'
};

export const AuthProvider = ({ children }) => {
    const [user] = useState(DEFAULT_USER);
    const [token] = useState('demo-token');

    const login = async () => true;
    const signup = async () => true;
    const logout = () => {};

    const value = {
        user,
        token,
        loading: false,
        login,
        signup,
        logout,
        isAuthenticated: true
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

