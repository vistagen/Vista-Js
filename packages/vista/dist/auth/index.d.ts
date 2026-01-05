import React from 'react';
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare const useAuth: () => {
    user: any;
    login: () => void;
};
