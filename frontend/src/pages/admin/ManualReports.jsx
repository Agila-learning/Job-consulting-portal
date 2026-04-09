import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    FileText, Upload, Plus, Download, 
    BarChart3, Calendar, MoreVertical, 
    Trash2, ExternalLink, Search, Filter,
    RefreshCw, Zap, TrendingUp, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import * as XLSX from 'xlsx';

const ManualReports = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [branches, setBranches] = useState([]);
    const [branchFilter, setBranchFilter] = useState('all');
    const [generating, setGenerating] = useState(false);

    const fetchBranches = async () => {
        if (user?.role === 'admin') {
            try {
                const res = await api.get('/branches');
                setBranches(res.data.data);
            } catch (err) {}
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const branchQuery = branchFilter !== 'all' ? `?branchId=${branchFilter}` : '';
            const res = await api.get(`/reports${branchQuery}`);
            setReports(res.data.data);
        } catch (err) {
            toast.error('Failed to synchronize audit archives');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchReports();
    }, [branchFilter]);

    const handleGenerate = async () => {
        if (generating) return;
        setGenerating(true);
        const loadingToast = toast.loading('Generating fresh audit snapshot...');
        try {
            await api.post('/reports/snapshot');
            toast.success('Snapshot generated. Re-indexing archive...', { id: loadingToast });
            fetchReports();
        } catch (err) {
            toast.error('Snapshot protocol failure', { id: loadingToast });
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = (report) => {
        const data = [
            ['Audit Information', 'Value'],
            ['Audit ID', report.id],
            ['Branch', report.branchName],
            ['Database ID', report._id],
            ['Title', report.title],
            ['Type', report.type],
            ['Amount', `₹${report.amount}`],
            ['Author', report.author],
            ['Status', report.status],
            ['Captured On', report.date],
            ['Company', report.metadata?.company || 'N/A'],
            ['Source', report.metadata?.source || 'N/A'],
            ['Recipient', report.metadata?.recipient || 'N/A']
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Auto-sizing columns
        worksheet['!cols'] = [{ wch: 25 }, { wch: 45 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Snapshot');
        
        XLSX.writeFile(workbook, `audit_${report.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success(`Audit ${report.id} exported as Excel`);
    };

    const handleDelete = async (report) => {
        if (!window.confirm(`CRITICAL: This will permanently purge the underlying ${report.entryType} record. Continue?`)) return;
        
        const loadingToast = toast.loading('Purging record from master ledger...');
        try {
            if (report.entryType === 'manual') {
                await api.delete(`/incentives/grants/${report._id}`);
            } else {
                await api.delete(`/referrals/${report._id}`);
            }
            toast.success('Financial Record Purged', { id: loadingToast });
            fetchReports();
        } catch (err) {
            toast.error('Purge Protocol Failure', { id: loadingToast });
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <BarChart3 size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase italic">Manual<span className="text-primary not-italic">.Reports</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] ml-1">Administrative Performance Audits</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <Button 
                        onClick={() => {
                            const data = reports.map(r => ({
                                'Audit ID': r.id,
                                'Title': r.title,
                                'Type': r.type,
                                'Amount': r.amount,
                                'Author': r.author,
                                'Branch': r.branchName,
                                'Status': r.status,
                                'Date': r.date,
                                'Company': r.metadata?.company || 'N/A',
                                'Source': r.metadata?.source || 'N/A'
                            }));
                            const worksheet = XLSX.utils.json_to_sheet(data);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Audit Ledger');
                            XLSX.writeFile(workbook, `master_audit_${new Date().toISOString().split('T')[0]}.xlsx`);
                            toast.success('Master Ledger exported to Excel');
                        }}
                        variant="outline"
                        className="h-12 px-6 rounded-xl border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        <Download size={16} className="mr-2" /> Master Export
                    </Button>
                    <Button 
                        onClick={handleGenerate}
                        disabled={generating}
                        className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-500/20 flex gap-3 transition-all active:scale-[0.98] justify-center"
                    >
                        {generating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} 
                        {generating ? 'Processing Audit...' : 'Generate New Snapshot'}
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-6 shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                        placeholder="Search archived reports by title, ID, or category..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-14 pl-14 bg-background dark:bg-slate-900/40 border-none rounded-2xl text-xs font-bold placeholder:text-muted-foreground/40 focus:ring-4 focus:ring-primary/5"
                    />
                </div>
                <div className="flex gap-3">
                    {user?.role === 'admin' && (
                        <select 
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="h-14 px-6 rounded-2xl border border-border/40 bg-background/50 font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer appearance-none min-w-[160px]"
                        >
                            <option value="all">Everywhere</option>
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>
                    )}
                    <Button onClick={fetchReports} variant="outline" className="h-14 px-6 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest gap-3">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-[300px] bg-card/20 rounded-[2.5rem] animate-pulse border border-border/40" />
                    ))
                ) : reports.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest opacity-40">No audit records detected in ledger.</p>
                    </div>
                ) : (
                    reports.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.author.toLowerCase().includes(searchTerm.toLowerCase())).map((report) => (
                        <div key={report.id} className="group bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden text-left border-t-4 border-t-primary/20">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-secondary dark:bg-slate-900 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <FileText size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={() => handleDownload(report)}
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/10"
                                    >
                                        <Download size={18} />
                                    </Button>
                                    <Button 
                                        onClick={() => handleDelete(report)}
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <Badge className="bg-primary/5 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                                            {report.type}
                                        </Badge>
                                        <Badge variant="outline" className="border-indigo-500/20 text-indigo-500 bg-indigo-500/5 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                                            {report.branchName}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-black text-emerald-600 tracking-tighter italic leading-none">₹{report.amount}</span>
                                        <span className="text-[7px] font-black uppercase text-muted-foreground tracking-widest mt-1 opacity-60">Verified Amount</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-primary transition-colors cursor-pointer truncate">{report.title}</h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2 leading-none">
                                        ID: {report.id} • {report.size}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border/20">
                                        {report.author.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight">{report.author}</span>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{report.date}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ManualReports;
