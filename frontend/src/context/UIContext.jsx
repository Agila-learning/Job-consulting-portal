import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isNewActionOpen, setIsNewActionOpen] = useState(false);
    const [activeThread, setActiveThread] = useState(null);

    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Identity Verified', message: 'Your KYC documents have been authorized by the governance board.', type: 'success', time: '2h ago' },
        { id: 2, title: 'New Mandate', message: 'A premium organizational mandate has been published in your domain.', type: 'info', time: '5h ago' }
    ]);

    const toggleChat = () => setIsChatOpen(!isChatOpen);
    const openChat = (thread = null) => {
        if (thread !== undefined) setActiveThread(thread);
        setIsChatOpen(true);
    };
    const closeChat = () => {
        setIsChatOpen(false);
        setActiveThread(null);
    };

    const toggleNotifications = () => setIsNotificationsOpen(!isNotificationsOpen);
    const openNotifications = () => setIsNotificationsOpen(true);
    const closeNotifications = () => setIsNotificationsOpen(false);

    const toggleNewAction = () => setIsNewActionOpen(!isNewActionOpen);
    const openNewAction = () => setIsNewActionOpen(true);
    const closeNewAction = () => setIsNewActionOpen(false);

    const clearNotifications = () => setNotifications([]);

    return (
        <UIContext.Provider value={{ 
            isChatOpen, toggleChat, openChat, closeChat,
            activeThread, setActiveThread,
            isNotificationsOpen, toggleNotifications, openNotifications, closeNotifications, notifications, clearNotifications,
            isNewActionOpen, toggleNewAction, openNewAction, closeNewAction
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
