import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { 
    Bell, Check, BellOff, X, 
    Info, CheckCircle2, AlertTriangle, AlertCircle,
    ChevronRight, Zap, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';

/**
 * NotificationCenter Component
 * Polling at 30-second intervals for real-time-like updates
 */
const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const pollingInterval = useRef(null);

    const fetchNotifications = async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
            setUnreadCount(res.data.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Notification heartbeat failure');
        } finally {
            if (!quiet) setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Setup 30s heartbeat
        pollingInterval.current = setInterval(() => {
            fetchNotifications(true);
        }, 30000);

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            toast.error('Failed to acknowledge alert');
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('Inbox synchronized');
        } catch (err) {
            toast.error('Sync failure');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
            case 'error': return <AlertCircle className="text-rose-500" size={16} />;
            default: return <Info className="text-blue-500" size={16} />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl bg-secondary/30 hover:bg-primary/10 transition-all group border border-border/20 shadow-sm">
                    <Bell size={22} className="text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary text-[8px] font-black text-white flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 bg-card/95 backdrop-blur-2xl border-border/40 rounded-[2rem] shadow-2xl overflow-hidden mt-2">
                <div className="p-6 pb-4 flex items-center justify-between bg-primary/5">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-none">Global Feeds</h3>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2 leading-none">
                           <Zap size={10} className="text-primary fill-primary" /> System Heartbeat Active
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={markAllRead}
                            className="h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-black text-[9px] uppercase tracking-widest transition-all"
                        >
                            Sync All
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="bg-border/20 m-0" />
                
                <ScrollArea className="h-[400px]">
                    <div className="py-2">
                        {loading && notifications.length === 0 ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="px-6 py-6 border-b border-border/10 flex gap-4 animate-pulse">
                                    <div className="w-10 h-10 rounded-xl bg-secondary shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-secondary rounded-md w-3/4" />
                                        <div className="h-3 bg-secondary rounded-md w-1/2 opacity-50" />
                                    </div>
                                </div>
                            ))
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground/30">
                                    <BellOff size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Silence of the Node</h4>
                                    <p className="text-[10px] text-muted-foreground/40 font-medium">No system-level protocol adjustments recorded in this cycle.</p>
                                </div>
                            </div>
                        ) : (
                            notifications.map((note) => (
                                <div 
                                    key={note._id} 
                                    className={`px-6 py-6 border-b border-border/10 last:border-0 hover:bg-secondary/20 transition-all group/note relative ${!note.read ? 'bg-primary/5' : ''}`}
                                    onClick={() => !note.read && markAsRead(note._id)}
                                >
                                    <div className="flex gap-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${!note.read ? 'bg-white dark:bg-slate-900 border-primary/20 shadow-md scale-110' : 'bg-secondary/40 border-border/40'}`}>
                                            {getTypeIcon(note.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`text-xs font-black tracking-tight truncate leading-tight ${!note.read ? 'text-foreground' : 'text-muted-foreground font-bold'}`}>{note.title}</h4>
                                                <span className="text-[9px] font-bold text-muted-foreground/40 shrink-0 whitespace-nowrap">
                                                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] leading-relaxed line-clamp-2 ${!note.read ? 'text-muted-foreground font-black opacity-80' : 'text-muted-foreground/40 font-medium'}`}>
                                                {note.message}
                                            </p>
                                        </div>
                                        {!note.read && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                                <ChevronRight size={14} className="text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                
                <DropdownMenuSeparator className="bg-border/20 m-0" />
                <div className="p-4 flex items-center justify-center bg-secondary/20 group/all cursor-pointer">
                    <span className="text-[10px] font-black text-muted-foreground group-hover/all:text-primary transition-colors tracking-widest uppercase flex items-center gap-2">
                        Enter Operations Archive <ExternalLink size={10} />
                    </span>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationCenter;
