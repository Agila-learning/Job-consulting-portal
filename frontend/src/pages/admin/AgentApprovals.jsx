import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    UserCheck, UserX, Building, MapPin, 
    Search, CheckCircle2, XCircle, Globe,
    Mail, Calendar, Briefcase, Hash, Users
} from 'lucide-react';

const AgentApprovals = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingAgents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users?role=agent&status=pending');
            setAgents(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch pending agents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingAgents();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/users/${id}`, { status });
            toast.success(`Partner ${status === 'active' ? 'authorized' : 'restricted'}`);
            fetchPendingAgents();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const columns = [
        {
            header: 'Entity Identity',
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black text-amber-600 shadow-sm shadow-amber-900/5 group-hover:bg-amber-500/20 transition-all">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-black text-foreground text-sm tracking-tight leading-none mb-1.5">{row.name}</p>
                        <div className="flex items-center gap-1.5">
                            <Building size={12} className="text-amber-600/70" />
                            <p className="text-[9px] text-amber-600 font-black uppercase tracking-[0.2em] leading-none">{row.agencyName || 'Independent Partner'}</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Regional Directory',
            cell: (row) => (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 group/loc">
                        <div className="p-1 px-2 bg-secondary/50 border border-border/50 rounded-md flex items-center gap-1.5 text-muted-foreground group-hover/loc:bg-primary/10 group-hover/loc:border-primary/20 group-hover/loc:text-primary transition-colors shadow-sm">
                            <MapPin size={10} />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{row.city || 'National Scope'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                        <Mail size={12} className="text-muted-foreground/70" />
                        <span className="text-[10px] uppercase font-bold text-foreground/80 tracking-widest">{row.email}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Operational Scope',
            cell: (row) => (
                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                    {row.specialization?.length > 0 ? (
                        row.specialization.map((spec, i) => (
                            <Badge key={i} variant="outline" className="rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] bg-secondary/50 text-muted-foreground border-border/50 shadow-none">
                                {spec}
                            </Badge>
                        ))
                    ) : (
                        <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] bg-secondary/50 text-muted-foreground border-border/50 shadow-none">
                            General Placement
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: 'Integration Date',
            cell: (row) => (
                <div className="flex items-center gap-2 text-muted-foreground bg-secondary/30 w-fit px-2.5 py-1.5 rounded-lg border border-border/40">
                    <Calendar size={12} className="text-primary/70" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {new Date(row.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </span>
                </div>
            )
        },
        {
            header: 'Authorization Decision',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button 
                        size="sm"
                        onClick={() => handleStatusUpdate(row._id, 'active')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.03]"
                    >
                        <CheckCircle2 size={16} className="mr-2.5" />
                        Authorize
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStatusUpdate(row._id, 'rejected')}
                        className="text-rose-600 border border-transparent hover:border-rose-200 hover:text-rose-700 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest h-9 px-4 rounded-xl transition-all"
                    >
                        <XCircle size={16} className="mr-2.5" />
                        Reject
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tight leading-none text-shadow-sm">Partner Governance</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Active Queue
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Audit identity profiles and authorize new external recruitment partners to join the network.</p>
                </div>
            </div>

            {/* Main Data View */}
            <div className="bg-card/95 dark:bg-slate-900 border border-border/40 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                            <UserCheck size={18} />
                        </div>
                        Pending Authorizations
                    </h3>
                </div>
                <DataTable 
                    columns={columns} 
                    data={agents} 
                    loading={loading} 
                    emptyMessage="No pending partner integration requests found in the verification queue." 
                />
            </div>
        </div>
    );
};

export default AgentApprovals;
