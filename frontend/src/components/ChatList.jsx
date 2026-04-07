import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare, User, Briefcase, Search, Hash } from 'lucide-react';
import { format } from 'date-fns';

const ChatList = ({ onSelectThread }) => {
    const { user } = useAuth();
    const [threads, setThreads] = useState({ referrals: [], directMessages: [] });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchThreads = async () => {
        try {
            const res = await api.get('/messages/threads');
            setThreads(res.data.data);
        } catch (err) {
            console.error('Failed to load transmission logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThreads();
        const interval = setInterval(fetchThreads, 10000);
        return () => clearInterval(interval);
    }, []);

    const filteredReferrals = (threads.referrals || []).filter(ref => 
        ref.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        ref.job?.jobTitle.toLowerCase().includes(search.toLowerCase())
    );

    const availableUsers = (threads.availableUsers || []).filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">Syncing Secure Threads</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Search Header */}
            <div className="p-4 border-b border-border/40 bg-secondary/5 space-y-4 shadow-sm">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search for users or jobs..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-secondary/30 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 rounded-xl text-xs font-medium outline-none transition-all"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-8">
                    {/* Direct Channels */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Authorized Channels</h4>
                        </div>
                        {availableUsers.length === 0 && threads.directMessages?.length === 0 ? (
                            <p className="px-3 text-[10px] text-muted-foreground italic opacity-60">No available contacts found.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-1">
                                {availableUsers.map(u => (
                                    <button 
                                        key={u._id}
                                        onClick={() => onSelectThread({ type: 'direct', id: u._id, name: u.name })}
                                        className="w-full group p-3 rounded-2xl hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all flex items-center gap-3.5 text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 transition-all shadow-sm">
                                            <User size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-foreground truncate tracking-tight">{u.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">{u.role}</p>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Candidate Threads */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-1 h-3 bg-primary rounded-full" />
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Job Pipelines</h4>
                        </div>
                        {filteredReferrals.length === 0 ? (
                            <p className="px-3 text-[10px] text-muted-foreground italic opacity-60">No active job-level threads.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-1">
                                {filteredReferrals.map(ref => (
                                    <button 
                                        key={ref._id}
                                        onClick={() => onSelectThread({ type: 'referral', id: ref._id, name: ref.candidateName })}
                                        className="w-full group p-3 rounded-2xl hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all flex items-center gap-3.5 text-left"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                            <Hash size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-foreground truncate tracking-tight">{ref.candidateName}</p>
                                            <p className="text-[10px] text-muted-foreground truncate font-medium mt-1">{ref.job?.jobTitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

export default ChatList;
