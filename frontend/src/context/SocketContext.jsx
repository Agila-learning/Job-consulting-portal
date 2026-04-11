import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { BASE_URL } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, user }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const newSocket = io(BASE_URL); // Use dynamic production/local URL
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('join', user._id);
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Global Listeners
        newSocket.on('newReferral', (data) => {
            toast.success('Live Update', {
                description: data.message,
                duration: 5000,
            });
        });

        newSocket.on('statusChanged', (data) => {
            toast.info('Status Updated', {
                description: data.message,
                duration: 5000,
            });
        });

        newSocket.on('assignmentNotification', (data) => {
            toast.message('New Assignment', {
                description: data.message,
                duration: 5000,
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
