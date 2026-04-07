import React from 'react';
import { useAuth } from './AuthContext';
import { SocketProvider } from './SocketContext';

const SocketWrapper = ({ children }) => {
    const { user } = useAuth();
    return (
        <SocketProvider user={user}>
            {children}
        </SocketProvider>
    );
};

export default SocketWrapper;
