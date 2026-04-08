import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { BASE_URL } from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, user }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(BASE_URL); // Use dynamic production/local URL
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket Connected: ', newSocket.id);
            newSocket.emit('join', user._id);
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
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
