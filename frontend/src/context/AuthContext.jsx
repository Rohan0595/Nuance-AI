// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const fetchUser = async () => {
      const token = localStorage.getItem("news_auth_token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
          } else {
            localStorage.removeItem("news_auth_token");
          }
        } catch (err) {
          console.error("Failed to load user:", err);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("news_auth_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("news_auth_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, AuthLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
};
