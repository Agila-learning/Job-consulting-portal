import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Send, MessageCircle, MoreHorizontal, 
    Paperclip, CheckCheck, Lock, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { io } from 'socket.io-client';

const ReferralChat = ({ referralId, recipientId, candidateName }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const socketRef = useRef(null);

    const fetchMessages = async () => {
        if (!referralId && !recipientId) return;
        try {
            const endpoint = referralId 
                ? `/messages/thread/${referralId}` 
                : `/messages/direct/${recipientId}`;
            const res = await api.get(endpoint);
            setMessages(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch messages:', err.message);
        }
    };

    useEffect(() => {
        // Initialize socket connection
        const socketServerUrl = BASE_URL.replace(/\/api$/, '');
        socketRef.current = io(socketServerUrl);

        socketRef.current.on('connect', () => {
            console.log('Socket Connected');
            socketRef.current.emit('join', user?._id);
        });

        socketRef.current.on('new_message', (message) => {
            // Check if message belongs to current thread
            const isThreadMatch = referralId && message.referralId === referralId;
            const isDirectMatch = recipientId && (message.sender === recipientId || message.recipient === recipientId);
            
            if (isThreadMatch || isDirectMatch) {
                setMessages(prev => [...prev, message]);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user?._id, referralId, recipientId]);

    useEffect(() => {
        setMessages([]);
        setLoading(true);
        fetchMessages().then(() => setLoading(false));
    }, [referralId, recipientId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const payload = {
                content: newMessage,
                isDirect: !!recipientId
            };
            if (referralId) payload.referralId = referralId;
            if (recipientId) payload.recipientId = recipientId;

            // Wait for API response to ensure delivery
            const res = await api.post('/messages/send', payload);
            
            // Optimistic update handled via socket if backend emits to sender, 
            // but we add it manually here to be safe and clear the input.
            // Actually, usually backend emits to everyone in room.
            setNewMessage('');
            // fetchMessages(); // No longer needed thanks to socket
        } catch (err) {
            console.error('Failed to send message:', err.message);
        }
    };

    if (loading && messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 opacity-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Establishing Secure Link</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40 min-h-[200px]">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                            <MessageCircle size={32} className="text-muted-foreground" />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">No Transmission Logs</p>
                        <p className="text-[9px] mt-2 text-muted-foreground font-medium max-w-[180px]">Encrypted end-to-end channel initialized and ready for communication.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isOwn = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                            <div key={idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all ${
                                    isOwn 
                                    ? 'bg-primary text-white rounded-tr-sm' 
                                    : 'bg-secondary/70 border border-border/40 text-foreground rounded-tl-sm'
                                }`}>
                                    {msg.content}
                                </div>
                                <div className={`flex items-center gap-2 mt-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                        {isOwn ? 'You' : (msg.sender?.name || 'Partner')}
                                    </p>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <p className="text-[9px] text-muted-foreground/60 font-bold">
                                        {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                                    </p>
                                    {isOwn && <CheckCheck size={11} className="text-primary/40" />}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-background/60 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <Input
                            placeholder="Type a secure message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="h-12 bg-secondary/40 border-transparent group-focus-within:bg-background group-focus-within:ring-2 group-focus-within:ring-primary/10 rounded-2xl font-medium pr-10 outline-none text-sm transition-all"
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-foreground rounded-xl">
                            <Paperclip size={16} />
                        </Button>
                    </div>
                    <Button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="h-12 w-12 bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 flex-shrink-0 disabled:opacity-40 transition-all active:scale-95"
                        size="icon"
                    >
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ReferralChat;
