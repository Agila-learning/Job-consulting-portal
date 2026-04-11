import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { 
    BarChart3, Calendar, Search, Filter,
    Briefcase, Users, MapPin, Download,
    RefreshCw, ChevronRight, Phone, Target, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const WorkforceLedger = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState([]);
    
    // Filters
    const [filters, setFilters] = useState({
        branchId: 'all',
        department: 'all',
        startDate: '',
        endDate: '',
        searchTerm: ''
    });

    // Handle initial branch lock for non-admins
    useEffect(() => {
        if (user && filters.branchId === 'all' && user.role !== 'admin') {
            setFilters(prev => ({ ...prev, branchId: user.branchId || 'all' }));
        }
    }, [user, filters.branchId]);

    const [departments, setDepartments] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const query = `?branchId=${filters.branchId}&startDate=${filters.startDate}&endDate=${filters.endDate}`;
            const [logRes, branchRes, userRes] = await Promise.all([
                api.get(`/performance-logs${query}`),
                api.get('/branches'),
                api.get('/users?role=employee,team_leader')
            ]);

            setLogs(logRes.data.data);
            setBranches(branchRes.data.data);
            
            // Extract unique departments
            const uniqueDepts = [...new Set(userRes.data.data
                .map(u => u.department)
                .filter(d => d && d.trim() !== ''))];
            setDepartments(uniqueDepts);

        } catch (err) {
            toast.error('Failed to sync workforce telemetry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters.branchId, filters.startDate, filters.endDate]);

    // Socket Integration for Real-time Updates
    const { socket } = useSocket();
    useEffect(() => {
        if (socket) {
            const handleSync = () => {
                console.log('Real-time sync triggered: Workforce Ledger');
                fetchData();
            };

            socket.on('newPerformanceLog', handleSync);

            return () => {
                socket.off('newPerformanceLog', handleSync);
            };
        }
    }, [socket]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user?.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                            log.notes?.toLowerCase().includes(filters.searchTerm.toLowerCase());
        const matchesDept = filters.department === 'all' || log.user?.department === filters.department;
        return matchesSearch && matchesDept;
    });

    const handleExport = () => {
        const data = filteredLogs.map(log => ({
            'Date': new Date(log.date).toLocaleDateString(),
            'Agent Name': log.user?.name,
            'Department': log.user?.department || 'N/A',
            'Branch': log.branchId?.name,
            'Calls Made': log.callsCount,
            'Conversions': log.conversionsCount,
            'Rejections': log.rejectionsCount,
            'Notes': log.notes
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Workforce Productivity');
        XLSX.writeFile(workbook, `Workforce_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Productivity records exported to Excel');
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10">
            {/* Header Hub */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <BarChart3 size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase italic">Workforce<span className="text-primary not-italic">.Ledger</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] ml-1">Cross-Departmental Productivity Audit</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleExport}
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm flex gap-3"
                    >
                        <Download size={16} /> Export Intelligence
                    </Button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-6 shadow-sm">
                <div className="relative group xl:col-span-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                        placeholder="Search agent or notes..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                        className="h-14 pl-14 bg-background border-none rounded-2xl text-xs font-bold shadow-none"
                    />
                </div>

                <Select value={filters.branchId} onValueChange={(v) => setFilters({...filters, branchId: v})} disabled={user?.role !== 'admin'}>
                    <SelectTrigger className={`h-14 bg-background border-none rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-none ${user?.role !== 'admin' ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        <MapPin size={14} className="text-primary mr-2" />
                        <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40 p-1">
                        {user?.role === 'admin' && (
                            <SelectItem value="all" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">Global (All Branches)</SelectItem>
                        )}
                        {branches.filter(b => user?.role === 'admin' || b._id === user?.branchId).map(b => (
                            <SelectItem key={b._id} value={b._id} className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filters.department} onValueChange={(v) => setFilters({...filters, department: v})}>
                    <SelectTrigger className="h-14 bg-background border-none rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-none">
                        <Briefcase size={14} className="text-primary mr-2" />
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40 p-1">
                        <SelectItem value="all" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">All Departments</SelectItem>
                        {departments.map(d => (
                            <SelectItem key={d} value={d} className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3">{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex gap-2">
                    <Input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        className="h-14 bg-background border-none rounded-2xl text-[10px] font-black uppercase shadow-none"
                    />
                    <Button onClick={fetchData} variant="ghost" className="h-14 w-14 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border/40 bg-secondary/10">
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entry Date</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Agent Node</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Branch / Dept</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Calls</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Yield</th>
                                <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Insights</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="p-8"><div className="h-4 bg-secondary rounded-full w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-40 italic">
                                        No performance archives detected for current selection
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log._id} className="group hover:bg-primary/5 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                    <Calendar size={14} />
                                                </div>
                                                <span className="text-[11px] font-black text-foreground uppercase">
                                                    {new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight">{log.user?.name}</span>
                                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{log.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="border-border/40 text-[8px] font-black uppercase tracking-widest bg-background">{log.branchId?.name}</Badge>
                                                <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest bg-primary/5">{log.user?.department || 'General'}</Badge>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <Phone size={12} className="text-blue-500" />
                                                <span className="text-sm font-black text-foreground">{log.callsCount}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Conv.</span>
                                                    <span className="text-sm font-black text-emerald-600">{log.conversionsCount}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-border/20 pl-4">
                                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Rej.</span>
                                                    <span className="text-sm font-black text-rose-500">{log.rejectionsCount}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-[11px] font-medium text-muted-foreground line-clamp-2 max-w-xs italic leading-relaxed">
                                                {log.notes || 'No insights provided'}
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

export default WorkforceLedger;
