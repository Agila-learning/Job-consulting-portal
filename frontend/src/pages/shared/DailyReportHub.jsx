import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Calendar, Users, Phone, Target, 
    CheckCircle2, Search, Filter, Loader2,
    ArrowUpRight, MapPin, X, LayoutTemplate,
    BarChart3, BrainCircuit, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const DailyReportHub = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    const [users, setUsers] = useState([]);
    
    // Filters
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [selectedUser, setSelectedUser] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = `?branchId=${selectedBranch}&userId=${selectedUser}`;
            if (startDate) query += `&startDate=${startDate}`;
            if (endDate) query += `&endDate=${endDate}`;

            const [logRes, branchRes, userRes] = await Promise.all([
                api.get(`/performance-logs${query}`),
                user?.role === 'admin' ? api.get('/branches') : Promise.resolve({ data: { data: [] } }),
                (user?.role === 'admin' || user?.role === 'team_leader') 
                    ? api.get(`/users?role=employee,team_leader,agent${selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : ''}`)
                    : Promise.resolve({ data: { data: [] } })
            ]);

            setLogs(logRes.data.data);
            if (user?.role === 'admin') setBranches(branchRes.data.data);
            setUsers(userRes.data.data);
        } catch (err) {
            toast.error('Failed to sync reporting hub telemetry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBranch, selectedUser, startDate, endDate]);

    const filteredLogs = logs.filter(log => 
        log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totals = filteredLogs.reduce((acc, log) => ({
        calls: acc.calls + (log.callsCount || 0),
        conversions: acc.conversions + (log.conversionsCount || 0),
        rejections: acc.rejections + (log.rejectionsCount || 0)
    }), { calls: 0, conversions: 0, rejections: 0 });

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card/30 backdrop-blur-xl border border-border/40 p-10 rounded-[3rem] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                            <BrainCircuit size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic leading-none">
                                Operations<span className="text-primary not-italic">.Hub</span>
                            </h2>
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-2 block">Daily Productivity Management</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input 
                            placeholder="Search Logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 w-64 pl-12 pr-4 bg-background border border-border/40 rounded-2xl text-[10px] uppercase font-black tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    
                    {user?.role === 'admin' && (
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-56 h-12 bg-background border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">
                                <MapPin size={14} className="text-primary mr-2" />
                                <SelectValue placeholder="Branch" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40">
                                <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest py-3">All Branches</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b._id} value={b._id} className="font-black text-[10px] uppercase tracking-widest py-3">{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border/40">
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase outline-none px-2"
                        />
                        <span className="text-muted-foreground opacity-30">/</span>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase outline-none px-2"
                        />
                    </div>
                </div>
            </div>

            {/* Aggregated Totals Overlay */}
            <div className="grid grid-cols-3 gap-6">
                {[
                    { label: 'Cumulative Volume', val: totals.calls, icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Success Velocity', val: totals.conversions, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'System Rejections', val: totals.rejections, icon: X, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                ].map((item, i) => (
                    <div key={i} className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-3xl p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                            <h4 className="text-3xl font-black text-foreground">{item.val}</h4>
                        </div>
                        <div className={cn("p-4 rounded-2xl", item.bg, item.color)}>
                            <item.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Ledger Table */}
            <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="pb-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Operational Date</th>
                                <th className="pb-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Technician</th>
                                <th className="pb-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Branch Node</th>
                                <th className="pb-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-center">Output Spectrum</th>
                                <th className="pb-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Analytical Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {loading ? (
                                <tr><td colSpan="5" className="py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-primary/40" /></td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="5" className="py-20 text-center text-xs font-black text-muted-foreground uppercase opacity-40">No records within current telemetry range</td></tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="group hover:bg-primary/5 transition-colors duration-300">
                                        <td className="py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-primary border border-border/40 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <Calendar size={16} />
                                                </div>
                                                <span className="text-[12px] font-black text-foreground uppercase tracking-tight">
                                                    {new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-black text-foreground uppercase tracking-tight">{log.user?.name}</span>
                                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{log.user?.role}</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70 bg-primary/5">
                                                {log.branchId?.name || 'Local'} Center
                                            </Badge>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="text-center px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-2xl min-w-[70px]">
                                                    <p className="text-[13px] font-black text-blue-500">{log.callsCount}</p>
                                                    <p className="text-[9px] font-black uppercase text-blue-500/60 tracking-tighter">Calls</p>
                                                </div>
                                                <div className="text-center px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl min-w-[70px]">
                                                    <p className="text-[13px] font-black text-emerald-500">{log.conversionsCount}</p>
                                                    <p className="text-[9px] font-black uppercase text-emerald-500/60 tracking-tighter">Conv</p>
                                                </div>
                                                <div className="text-center px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-2xl min-w-[70px]">
                                                    <p className="text-[13px] font-black text-rose-500">{log.rejectionsCount}</p>
                                                    <p className="text-[9px] font-black uppercase text-rose-500/60 tracking-tighter">Rej</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 max-w-xs">
                                            <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">
                                                {log.notes || '---'}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DailyReportHub;
