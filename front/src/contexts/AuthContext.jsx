"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    logout: () => { },
    checkAuth: () => { }
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/status`, {
                method: "GET",
                credentials: "include", // Important: include cookies
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Redirect to backend logout endpoint
            window.location.href = `${API_URL}/auth/logout`;
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        checkAuth
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
