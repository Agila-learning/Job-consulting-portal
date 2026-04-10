import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    BarChart3, Award, TrendingUp, Users, 
    CheckCircle2, Clock, Phone, Building2,
    Calendar, Filter, ChevronRight, Loader2,
    ArrowUpRight, Target, Sparkles, MapPin,
    Plus, X, ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const PerformanceReports = () => {
    const { user } = useAuth();
    const [performance, setPerformance] = useState(null);
    const [topPerformers, setTopPerformers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedUser, setSelectedUser] = useState('all');
    const [users, setUsers] = useState([]);
    const [newLog, setNewLog] = useState({
        date: new Date().toISOString().split('T')[0],
        callsCount: 0,
        conversionsCount: 0,
        rejectionsCount: 0,
        notes: ''
    });
    
    // Filters
    const [range, setRange] = useState('monthly');
    const [selectedBranch, setSelectedBranch] = useState(user?.role === 'admin' ? 'all' : (user?.branchId || 'all'));
    const [metric, setMetric] = useState('conversions');

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = `?range=${range}&branchId=${selectedBranch}`;
            const topQuery = `${query}&metric=${metric}`;
            
            const [perfRes, topRes, branchRes, logRes] = await Promise.all([
                api.get(`/reports/performance${query}`),
                api.get(`/reports/top-performers${topQuery}`),
                user?.role === 'admin' ? api.get('/branches') : Promise.resolve({ data: { data: [] } }),
                api.get(`/performance-logs${query}${selectedUser !== 'all' ? `&userId=${selectedUser}` : ''}`)
            ]);

            setPerformance(perfRes.data.data);
            setTopPerformers(topRes.data.data);
            setLogs(logRes.data.data);
            if (user?.role === 'admin') setBranches(branchRes.data.data);

            // Fetch users for filtering if Admin/TL
            if (user?.role === 'admin' || user?.role === 'team_leader') {
                const userRes = await api.get(`/users?role=employee,team_leader,agent${selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : ''}`);
                setUsers(userRes.data.data);
            }
        } catch (err) {
            toast.error('Failed to sync performance metadata');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [range, selectedBranch, metric, selectedUser]);

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    const handleLogSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/performance-logs', newLog);
            toast.success('Performance report archived successfully');
            setIsLogModalOpen(false);
            setNewLog({
                date: new Date().toISOString().split('T')[0],
                callsCount: 0,
                conversionsCount: 0,
                rejectionsCount: 0,
                notes: ''
            });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Report archiving failed');
        } finally {
            setSubmitting(false);
        }
    };

    const stats = [
        { label: 'Outbound Velocity', value: performance?.totalCalls || 0, icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 'Total Calls' },
        { label: 'Shortlist Rate', value: performance?.shortlisted || 0, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: 'Screened' },
        { label: 'Selection Win', value: performance?.selected || 0, icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Offers' },
        { label: 'Conversion Yield', value: performance?.joined || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: 'Joined' },
    ];

    const getMetricLabel = (m) => {
        if (m === 'conversions') return 'Joined';
        if (m === 'shortlisted') return 'Shortlists';
        if (m === 'referrals') return 'Referrals';
        return 'Score';
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header section with sophisticated filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card/30 backdrop-blur-xl border border-border/40 p-10 rounded-[3rem] shadow-sm">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner group">
                            <BarChart3 size={28} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase italic leading-none">
                                Performance<span className="text-primary not-italic">.Reports</span>
                            </h2>
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-2 block">Analytical Intelligence Hub</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Time Range Selector */}
                    <div className="flex bg-secondary/30 p-1 rounded-2xl border border-border/40">
                        {['daily', 'weekly', 'monthly'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    range === r 
                                        ? "bg-background text-primary shadow-lg border border-border/40" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Branch Filter (Admin Only) */}
                    {user?.role === 'admin' && (
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-56 h-12 bg-background border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">
                                <MapPin size={14} className="text-primary mr-2" />
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest py-3">Global (All Branches)</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b._id} value={b._id} className="font-black text-[10px] uppercase tracking-widest py-3">{b.name} Branch</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* User Filter (Admin/TL Only) */}
                    {(user?.role === 'admin' || user?.role === 'team_leader') && (
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="w-56 h-12 bg-background border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm">
                                <Users size={14} className="text-primary mr-2" />
                                <SelectValue placeholder="Select Member" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest py-3">All Workforce Members</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u._id} value={u._id} className="font-black text-[10px] uppercase tracking-widest py-3">{u.name} ({u.role})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Manual Report Toggle */}
                    {user?.role !== 'admin' && (
                        <Button 
                            onClick={() => setIsLogModalOpen(true)}
                            className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex gap-3 transition-all"
                        >
                            <Plus size={16} /> Log Daily Productivity
                        </Button>
                    )}
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="group bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg.replace('/10', '/5')} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-700`} />
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("p-4 rounded-2xl shadow-sm border", stat.bg, stat.color, stat.bg.replace('bg-', 'border-'))}>
                                <stat.icon size={22} />
                            </div>
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-primary/10 text-primary/70 bg-primary/5">
                                Live Tracking
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-4xl font-black text-foreground tracking-tighter leading-none">{stat.value}</h3>
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{stat.label}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">{stat.trend}</span>
                            <ArrowUpRight size={14} className="text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Performance Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ranking Board */}
                <div className="lg:col-span-2 space-y-6 bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1.5 text-left">
                            <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                                <Award size={24} className="text-amber-500" />
                                Top Performers <span className="text-primary italic">.Elite</span>
                            </h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Highest {getMetricLabel(metric).toLowerCase()} throughput per cycle</p>
                        </div>
                        <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border/30">
                            {[
                                { id: 'conversions', label: 'Joined' },
                                { id: 'shortlisted', label: 'Short' },
                                { id: 'referrals', label: 'All' }
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMetric(m.id)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                        metric === m.id 
                                            ? "bg-primary text-white shadow-lg" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 relative z-10">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 size={32} className="animate-spin text-primary/40" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Hydrating Rankings...</p>
                            </div>
                        ) : topPerformers.length === 0 ? (
                            <div className="py-20 text-center space-y-4 border-2 border-dashed border-border/40 rounded-[2rem] bg-secondary/10">
                                <Sparkles size={40} className="mx-auto text-muted-foreground/30" />
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50">Calibration stage. No data entries yet.</p>
                            </div>
                        ) : (
                            topPerformers.map((p, i) => (
                                <div key={i} className="group flex items-center justify-between p-5 rounded-[1.8rem] bg-background/50 border border-border/30 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110",
                                            i === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : 
                                            i === 1 ? "bg-slate-400 text-white" :
                                            i === 2 ? "bg-orange-400 text-white" :
                                            "bg-secondary text-muted-foreground"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{p.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-primary/20 text-primary/70">{p.branch || 'Global'} Branch</Badge>
                                                <span className="text-[10px] font-medium text-muted-foreground">{p.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-primary leading-none">{p.count}</p>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mr-0.5">{getMetricLabel(metric)}</p>
                                        </div>
                                        <div className="p-3 bg-secondary/50 rounded-xl group-hover:bg-primary/10 transition-colors">
                                            <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Growth / Productivity Section */}
                <div className="space-y-8">
                    <div className="bg-primary rounded-[3rem] p-10 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-transform group-hover:rotate-6">
                                <TrendingUp size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tight leading-tight">Branch<span className="not-italic text-white opacity-60">.Efficiency</span></h3>
                                <p className="text-[11px] font-medium text-white/70 leading-relaxed mt-4">
                                    Analyze cross-branch performance to allocate administrative resources and boost local conversion cycles.
                                </p>
                            </div>
                            <Button 
                                onClick={handleGeneratePDF}
                                className="w-full h-14 bg-white text-primary font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-50 transition-all border-none"
                            >
                                {isPrinting ? <Loader2 size={18} className="animate-spin" /> : 'Generate PDF Report'}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-emerald-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-600/30 relative overflow-hidden group border border-white/10">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                         <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-transform group-hover:rotate-6">
                                <CheckCircle2 size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tight leading-tight">Elite<span className="not-italic text-white opacity-60">.Converted</span></h3>
                                <p className="text-[11px] font-medium text-white/70 leading-relaxed mt-4">
                                    High-intensity candidate lifecycle management drives conversion throughput across all operation centers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Operational Logs Table */}
            <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3 italic">
                            Operational<span className="text-primary not-italic">.Ledger</span>
                        </h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Manual throughput archives per individual agent</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Log Date</th>
                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Node</th>
                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calls</th>
                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Converted</th>
                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rejected</th>
                                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes / Comments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-40 italic">
                                        No operational archives found for current filters
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="group hover:bg-primary/5 transition-colors">
                                        <td className="py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <Calendar size={14} />
                                                </div>
                                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight">
                                                    {new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{log.user?.name}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{log.user?.role}</span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <Badge variant="outline" className="h-7 px-3 rounded-lg border-blue-500/20 text-blue-500 bg-blue-500/5 font-black text-[10px]">
                                                {log.callsCount} Calls
                                            </Badge>
                                        </td>
                                        <td className="py-5">
                                            <Badge variant="outline" className="h-7 px-3 rounded-lg border-emerald-500/20 text-emerald-500 bg-emerald-500/5 font-black text-[10px]">
                                                {log.conversionsCount} Converted
                                            </Badge>
                                        </td>
                                        <td className="py-5">
                                            <Badge variant="outline" className="h-7 px-3 rounded-lg border-rose-500/20 text-rose-500 bg-rose-500/5 font-black text-[10px]">
                                                {log.rejectionsCount} Rejected
                                            </Badge>
                                        </td>
                                        <td className="py-5">
                                            <p className="text-[10px] font-medium text-muted-foreground max-w-xs truncate italic">
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

            {/* Log Modal */}
            {isLogModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-card border border-border/40 rounded-[3rem] shadow-2xl overflow-hidden p-8 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-foreground tracking-tight italic">
                                    Archive<span className="text-primary not-italic">.Productivity</span>
                                </h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Log your daily throughput metrics</p>
                            </div>
                            <Button onClick={() => setIsLogModalOpen(false)} variant="ghost" size="icon" className="rounded-full hover:bg-rose-500/10 hover:text-rose-500 h-10 w-10">
                                <X size={20} />
                            </Button>
                        </div>

                        <form onSubmit={handleLogSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-2">Reporting Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={newLog.date}
                                        onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                                        className="h-14 w-full px-6 bg-secondary/30 border border-border/40 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-2">Total Calls Done</label>
                                        <input 
                                            type="number"
                                            required
                                            min="0"
                                            value={newLog.callsCount}
                                            onChange={(e) => setNewLog({...newLog, callsCount: parseInt(e.target.value)})}
                                            className="h-14 w-full px-6 bg-secondary/30 border border-border/40 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-2">Total Converted</label>
                                        <input 
                                            type="number"
                                            required
                                            min="0"
                                            value={newLog.conversionsCount}
                                            onChange={(e) => setNewLog({...newLog, conversionsCount: parseInt(e.target.value)})}
                                            className="h-14 w-full px-6 bg-secondary/30 border border-border/40 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 transition-all text-emerald-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-2">Total Rejected</label>
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={newLog.rejectionsCount}
                                        onChange={(e) => setNewLog({...newLog, rejectionsCount: parseInt(e.target.value)})}
                                        className="h-14 w-full px-6 bg-secondary/30 border border-border/40 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-primary/5 transition-all text-rose-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-2">Log Insights / Notes</label>
                                    <textarea 
                                        placeholder="Add any context regarding today's performance..."
                                        value={newLog.notes}
                                        onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                                        className="h-32 w-full p-6 bg-secondary/30 border border-border/40 rounded-[2rem] text-xs font-medium outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <Button 
                                type="submit"
                                disabled={submitting}
                                className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={18} />}
                                {submitting ? 'Archiving Records...' : 'Commit Performance Archive'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceReports;
