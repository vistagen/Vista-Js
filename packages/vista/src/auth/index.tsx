import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({ user: null, login: () => { } });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);

    const login = () => {
        setUser({ name: "Vista User" });
    };

    return (
        <AuthContext.Provider value={{ user, login }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
