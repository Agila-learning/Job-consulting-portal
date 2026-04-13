import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    const userData = res.data.data;
                    
                    // Standardize branchId to always be a string ID for consistent filtering
                    const standardizedUser = {
                        ...userData,
                        id: userData._id, // Add id alias for consistency
                        branchId: userData.branchId?._id || userData.branchId,
                        branchName: userData.branchId?.name || 'N/A'
                    };
                    
                    setUser(standardizedUser);
                } catch (err) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/auth/login', { identifier, password });
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return user;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/auth/register', userData);
            const { token, user } = res.data;
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setUser(user);
            }
            return user;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const switchBranch = (branchId) => {
        const updatedUser = { ...user, branchId };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success(`Switched to ${branchId.charAt(0).toUpperCase() + branchId.slice(1)} Branch`);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, register, logout, switchBranch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
