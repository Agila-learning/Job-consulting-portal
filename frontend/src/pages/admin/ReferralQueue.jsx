import React, { useState, useEffect, useRef } from 'react';
import api, { BASE_URL } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
    UserCheck, UserPlus, Briefcase, Mail, 
    Phone, Calendar, ArrowRight, User, 
    MousePointer2, Hash, ExternalLink, 
    Network, Search, ArrowUpRight, TrendingUp, Trash2,
    Clock, MoreVertical, Shield, UserCog, Ghost, RefreshCw, 
    Filter, X, CheckCircle2, Plus, Info, AlertCircle, FileText,
    Sparkles, XCircle, BarChart3, PieChart, Zap, ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import gsap from 'gsap';
import * as XLSX from 'xlsx';

const ReferralQueue = () => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';
    const isTeamLeader = currentUser?.role === 'team_leader';
    
    const [referrals, setReferrals] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('pipeline');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isFinanceOpen, setIsFinanceOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [statusData, setStatusData] = useState({ status: '', comment: '' });
    const [financeData, setFinanceData] = useState({ calculatedCommission: '', payoutStatus: '', payoutNotes: '' });
    const [branches, setBranches] = useState([]);
    const [branchFilter, setBranchFilter] = useState(currentUser?.role === 'admin' ? 'all' : (currentUser?.branchId || 'all'));

    const containerRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchQuery = branchFilter !== 'all' ? `?branchId=${branchFilter}` : '';
            const [refRes, empRes, branchRes] = await Promise.all([
                api.get(`/referrals${branchQuery}`),
                api.get('/users?role=employee&role=agent'),
                api.get('/branches')
            ]);
            setReferrals(refRes.data.data);
            setEmployees(empRes.data.data);
            setBranches(branchRes.data.data);
        } catch (err) {
            toast.error('Queue Synchronization Failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [branchFilter]);

    useEffect(() => {
        if (!loading && containerRef.current && document.querySelector('.animate-card')) {
            gsap.from('.animate-card', {
                y: 20,
                opacity: 0,
                stagger: 0.05,
                duration: 0.5,
                ease: 'power3.out',
                clearProps: "all"
            });
        }
    }, [loading, activeTab, searchTerm, statusFilter, sourceFilter]);

    const placementStatuses = ['Selected', 'Offer Released', 'Joined'];

    const getFilteredData = (targetTab) => {
        return referrals.filter(ref => {
            const matchesSearch = (ref.candidateName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                                 (ref.job?.jobTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' ? true : ref.status === statusFilter;
            const matchesSource = sourceFilter === 'all' ? true : ref.sourceType === sourceFilter;
            
            const isPlacementReady = placementStatuses.includes(ref.status);
            const tabMatch = targetTab === 'placements' ? isPlacementReady : !isPlacementReady;
            const matchesBranch = branchFilter === 'all' ? true : 
                                 (typeof ref.branchId === 'object' ? ref.branchId?._id === branchFilter : ref.branchId === branchFilter);

            return matchesSearch && matchesStatus && matchesSource && tabMatch && matchesBranch;
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('IRREVERSIBLE ACTION: Purge candidate from master ledger?')) {
            try {
                await api.delete(`/referrals/${id}`);
                toast.success('Node Purged Successfully');
                fetchData();
            } catch (err) {
                toast.error('Purge Authorization Failed');
            }
        }
    };

    const handleStatusUpdate = async (id, data) => {
        const loadingToast = toast.loading('Synchronizing lifecycle state...');
        try {
            await api.patch(`/referrals/${id}/status`, data);
            toast.success('Lifecycle State Updated', { id: loadingToast });
            setIsStatusOpen(false);
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'State transition protocol failure';
            toast.error(errorMsg, { id: loadingToast });
        }
    };

    const handleQuickShortlist = async (id) => {
        const loadingToast = toast.loading('Fast-tracking candidate to shortlist...');
        try {
            await api.patch(`/referrals/${id}/status`, { status: 'Shortlisted', comment: 'Direct fast-track from pipeline' });
            toast.success('Candidate Shortlisted', { id: loadingToast });
            fetchData();
        } catch (err) {
            toast.error('Fast-track failed', { id: loadingToast });
        }
    };

    const handleFinanceUpdate = async (id, data) => {
        const loadingToast = toast.loading('Commiting financial reconciliation...');
        try {
            await api.patch(`/referrals/${id}/status`, data); // Reuse the same endpoint which handles finance too
            toast.success('Financial Protocol Synchronized', { id: loadingToast });
            setIsFinanceOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Reconciliation failed', { id: loadingToast });
        }
    };

    const handleSync = async () => {
        const loadingToast = toast.loading('Re-indexing incentive distributed ledger...');
        try {
            await api.patch('/referrals/sync-incentives');
            toast.success('Ledger Re-indexed', { id: loadingToast });
            fetchData();
        } catch (err) {
            toast.error('Sync protocol failure', { id: loadingToast });
        }
    };

    const filteredList = getFilteredData(activeTab);

    return (
        <div ref={containerRef} className="space-y-10 animate-in fade-in duration-700 pb-12 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                            <Network size={24} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">Hiring<span className="text-primary not-italic">.Pipeline</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] ml-1">Universal Recruitment Orchestration Terminal</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleSync} variant="outline" className="h-12 px-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                        <Zap size={16} className="mr-2 fill-current" /> Sync Records
                    </Button>
                    <Button 
                        onClick={async () => {
                            if (window.confirm("FATAL ACTION: This will permanently purge all mock data. Proceed?")) {
                                try {
                                    await api.delete('/referrals/purge-mock-data');
                                    toast.success("Ecosystem Reset Complete");
                                    fetchData();
                                } catch (err) {
                                    toast.error("Purge Protocol Failed");
                                }
                            }
                        }}
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl border-rose-500/20 bg-rose-500/5 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                        <AlertCircle size={16} className="mr-2" /> Reset Protocol
                    </Button>
                    <Button 
                        onClick={() => {
                            const data = referrals.map(ref => ({
                                'Candidate Name': ref.candidateName,
                                'Job Title': ref.job?.jobTitle || 'N/A',
                                'Company': ref.job?.companyName || 'N/A',
                                'Mobile': ref.mobile || 'N/A',
                                'Status': ref.status,
                                'Source': ref.sourceType,
                                'Referrer': ref.referrer?.name || 'Admin',
                                'Commission': ref.calculatedCommission || 0,
                                'Payout Status': ref.payoutStatus,
                                'Date': new Date(ref.createdAt).toLocaleDateString()
                            }));
                            const worksheet = XLSX.utils.json_to_sheet(data);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, 'Hiring Pipeline');
                            XLSX.writeFile(workbook, `hiring_pipeline_${new Date().toISOString().split('T')[0]}.xlsx`);
                            toast.success('Hiring Pipeline exported to Excel');
                        }} 
                        variant="outline" 
                        className="h-12 px-6 rounded-2xl border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        <FileText size={16} className="mr-2" /> Export Queue
                    </Button>
                    <Button onClick={() => toast.info('Audit System: Distributed ledger review protocol initiated.')} variant="outline" className="h-12 px-6 rounded-2xl border-border/40 font-black text-[10px] uppercase tracking-widest gap-2">
                        <Calendar size={16} /> Audit Calendar
                    </Button>
                </div>
            </div>

            {/* Layout Grid: 4/8 Split on Desktop, Stacked on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* ── SECTION 1: METRICS & ANALYTICS (LEFT) ── */}
                <aside className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24 h-fit">
                    {/* Compact Analytics Panel */}
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                        {isAdmin && (
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-primary" /> Finance Snapshot
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl group hover:border-emerald-500/30 transition-all">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-2">Total Paid</p>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            ₹{referrals.filter(r => r.payoutStatus === 'paid').reduce((acc, r) => acc + (r.calculatedCommission || 0), 0).toLocaleString()}
                                        </h4>
                                    </div>
                                    <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-3xl group hover:border-amber-500/30 transition-all">
                                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none mb-2">Pending Payouts</p>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                            ₹{referrals.filter(r => r.payoutStatus === 'pending_approval' || r.payoutStatus === 'pending_invoice').reduce((acc, r) => acc + (r.calculatedCommission || 0), 0).toLocaleString()}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <Zap size={16} className="text-primary" /> Performance Index
                            </h3>
                            <Badge className="bg-primary/10 text-primary border-0 text-[8px] font-black uppercase tracking-widest">Live Node</Badge>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-secondary/20 rounded-3xl border border-border/30 space-y-1">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Pool</p>
                                <p className="text-2xl font-black text-foreground tracking-tighter">{referrals.length}</p>
                            </div>
                            <div className="p-5 bg-secondary/20 rounded-3xl border border-border/30 space-y-1">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Unassigned</p>
                                <p className="text-2xl font-black text-foreground tracking-tighter">{referrals.filter(r => !r.assignedEmployee).length}</p>
                            </div>
                        </div>

                        {/* Conversion Velocity Progress */}
                        <div className="space-y-4 pt-4 border-t border-border/20">
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Closure Rate</p>
                                <p className="text-xs font-black text-primary">
                                    {referrals.length ? Math.round((referrals.filter(r => r.status === 'Joined').length / referrals.length) * 100) : 0}%
                                </p>
                            </div>
                            <div className="h-3 w-full bg-secondary/40 rounded-full overflow-hidden p-0.5 border border-border/20">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_12px_rgba(6,96,252,0.3)] transition-all duration-1000"
                                    style={{ width: `${referrals.length ? (referrals.filter(r => r.status === 'Joined').length / referrals.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Source Distribution Visualization Placeholder Style */}
                        <div className="space-y-6 pt-4 border-t border-border/20">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Network Distribution</p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Corporate Referral', count: referrals.filter(r => r.sourceType === 'employee').length, color: 'bg-primary' },
                                    { label: 'Agency Partner', count: referrals.filter(r => r.sourceType === 'agent').length, color: 'bg-amber-500' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                        <p className="text-[11px] font-bold text-muted-foreground flex-1 truncate">{item.label}</p>
                                        <p className="text-[11px] font-black text-foreground">{item.count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Operational Tips / Actions */}
                    <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 text-left">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                                <Shield size={18} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-foreground tracking-tight">Compliance Protocol</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Ensure all 'Joined' candidates have completed the digital onboarding archive before payout commitment.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── SECTION 2: TALENT RECORDS LIST (RIGHT) ── */}
                <main className="lg:col-span-8 xl:col-span-9 space-y-6">
                    
                    {/* Navigation & Search Hub */}
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-4 lg:p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            {/* Tab Switchers (Moved for visibility) */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-secondary/30 p-1 rounded-2xl border border-border/20 w-fit">
                                <TabsList className="h-10 bg-transparent border-0 gap-1 p-0">
                                    <TabsTrigger value="pipeline" className="rounded-xl px-6 py-2 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[9px] uppercase tracking-widest transition-all">
                                        Active Queue
                                    </TabsTrigger>
                                    <TabsTrigger value="placements" className="rounded-xl px-6 py-2 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-black text-[9px] uppercase tracking-widest transition-all">
                                        Placement Ready
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Actions Group */}
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setIsAddOpen(true)} variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-border/20 hover:bg-primary/10 hover:text-primary transition-all">
                                    <Plus size={18} />
                                </Button>
                                <Button onClick={() => toast.info('Refining discovery parameters...')} variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-border/20 hover:bg-primary/10 hover:text-primary transition-all">
                                    <Filter size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Search & Select Toggles */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full h-full">
                            {isAdmin && (
                                <div className="w-full sm:w-48">
                                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                                        <SelectTrigger className="h-12 bg-background border-border/40 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-sm">
                                            <SelectValue placeholder="Branch" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                            <SelectItem value="all">Everywhere</SelectItem>
                                            {branches.map(b => (
                                                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
                                <input 
                                    type="text" 
                                    placeholder="Search nodes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-12 pl-11 pr-12 bg-background dark:bg-slate-900 border border-border/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-[11px] font-black outline-none transition-all placeholder:text-muted-foreground/30 shadow-inner"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center border border-primary/10">
                                    <Search size={14} />
                                </button>
                            </div>
                            <div className="md:col-span-3">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-12 bg-background border-border/40 rounded-2xl font-black text-[9px] uppercase tracking-widest">
                                        <SelectValue placeholder="Lifecycle" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                        <SelectItem value="all">Global States</SelectItem>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-3">
                                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                    <SelectTrigger className="h-12 bg-background border-border/40 rounded-2xl font-black text-[9px] uppercase tracking-widest">
                                        <SelectValue placeholder="Network" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                                        <SelectItem value="all">Sourcing</SelectItem>
                                        <SelectItem value="agent">Agent Network</SelectItem>
                                        <SelectItem value="employee">Internal Node</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Talent Grid Display */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-card/20 rounded-[2.5rem] border border-dashed border-border/40 text-center animate-pulse">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Indexing Talent Grid...</p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-card/20 rounded-[2.5rem] border border-dashed border-border/40 text-center">
                                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground/30">
                                    <Ghost size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest mb-1">Grid Vacuum Detected</h4>
                                    <p className="text-[10px] text-muted-foreground/40 font-medium">No matching entities synchronized for the current filter parameters.</p>
                                </div>
                                <Button onClick={() => {setSearchTerm(''); setStatusFilter('all'); setSourceFilter('all');}} variant="link" className="text-[10px] font-black uppercase text-primary tracking-widest">Reset Discovery Stack</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredList.map((row) => (
                                      <CandidateCard 
                                          key={row._id} 
                                          row={row} 
                                          isAdmin={isAdmin}
                                          activeTab={activeTab}
                                         onAssign={() => {
                                             setSelectedReferral(row);
                                             setIsAssignOpen(true);
                                         }}
                                         onQuickShortlist={() => handleQuickShortlist(row._id)}
                                         onStatus={() => {
                                            setSelectedReferral(row);
                                            setStatusData({ status: row.status, comment: '' });
                                            setIsStatusOpen(true);
                                        }}
                                        onFinance={() => {
                                            setSelectedReferral(row);
                                            setFinanceData({ 
                                                calculatedCommission: row.calculatedCommission || '', 
                                                payoutStatus: row.payoutStatus || 'unearned',
                                                payoutNotes: row.payoutNotes || ''
                                            });
                                            setIsFinanceOpen(true);
                                        }}
                                        onTimeline={() => {
                                            setSelectedReferral(row);
                                            setIsTimelineOpen(true);
                                        }}
                                        onDelete={() => handleDelete(row._id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Delegation Orchestrator (Dialog) */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-2xl overflow-y-auto focus:ring-0">
                    <div className="p-10 relative overflow-hidden bg-primary/5 border-b border-border/20 text-left">
                        <DialogHeader className="relative z-10 p-0 text-left">
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-5 text-foreground leading-none">
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-border/40 flex items-center justify-center text-primary shadow-xl">
                                    <UserPlus size={28} />
                                </div>
                                <div className="flex flex-col gap-1 items-start">
                                    Authorize Delegation
                                    <span className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black italic">Source Node Transfer Protocol</span>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-10 space-y-8 bg-background/50 relative z-10 text-left">
                        {selectedReferral && (
                            <div className="p-6 bg-secondary/30 rounded-3xl border border-border/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="text-left space-y-1">
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black leading-none">Target Identity</p>
                                    <h4 className="text-xl font-black text-foreground tracking-tighter leading-tight">{selectedReferral.candidateName}</h4>
                                    <p className="text-[10px] text-primary/70 uppercase tracking-widest font-black truncate">{selectedReferral.job?.jobTitle}</p>
                                </div>
                                <ArrowRight size={24} className="text-muted-foreground/30 animate-pulse hidden sm:block" />
                                <div className="w-20 h-20 rounded-3xl bg-primary shadow-xl shadow-primary/20 flex flex-col items-center justify-center text-white shrink-0">
                                    <Zap size={24} className="mb-1" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Assign</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 text-left">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Destination Representative</Label>
                            <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
                                <SelectTrigger className="h-16 bg-background dark:bg-slate-900 border border-border/40 rounded-2xl font-black text-xs px-6 shadow-sm">
                                    <SelectValue placeholder="Locate verified node specialized in this domain..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/40 shadow-2xl bg-card">
                                    <ScrollArea className="h-[250px]">
                                        {employees.map(emp => (
                                            <SelectItem key={emp._id} value={emp._id} className="rounded-xl py-4 focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors m-1 px-4">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-black text-sm text-foreground">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-black text-sm tracking-tight">{emp.name}</span>
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary/80 bg-primary/5 px-2">
                                                            {emp.role === 'team_leader' ? 'TL Node' : 'Integration Node'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <DialogFooter className="p-8 bg-secondary/20 border-t border-border/30">
                        <Button 
                            onClick={async () => {
                                if (!selectedEmployee) return toast.error('Destination Selection Required');
                                try {
                                    await api.patch(`/referrals/${selectedReferral._id}/assign`, { employeeId: selectedEmployee });
                                    toast.success('Lead Ownership Transferred Successfully');
                                    setIsAssignOpen(false);
                                    fetchData();
                                } catch (err) {
                                    toast.error('Delegation protocol failure');
                                }
                            }}
                            className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] flex gap-3"
                        >
                            <UserCheck size={18} />
                            Commit Delegation Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Add Candidate (Admin) */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[2.8rem] shadow-2xl p-0 overflow-y-auto max-h-[95vh] outline-none">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 relative overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-primary flex items-center justify-center text-white shadow-lg">
                                    <Plus size={22} />
                                </div>
                                System Entry: Candidate Referral
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="flex flex-col items-center justify-center py-16 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-xl shadow-primary/5">
                                <UserPlus size={40} />
                            </div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Initialize Onboarding</h3>
                            <p className="text-xs text-muted-foreground font-medium max-w-[280px] leading-relaxed mb-8">Ready to add a new candidate to the universal recruitment pipeline?</p>
                            
                            <Button 
                                onClick={() => window.location.href = '/admin/jobs'}
                                className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105"
                            >
                                Open Job Inventory Center
                            </Button>
                            
                            <p className="text-[10px] font-bold text-muted-foreground/40 mt-6 uppercase tracking-widest">Select a job node to begin referral</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lifecycle Status Update Dialog */}
            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="max-w-xl bg-card border-border/40 rounded-[2.5rem] p-0 overflow-y-auto max-h-[95vh] outline-none">
                    <div className="p-10 bg-primary/5 border-b border-border/20 relative">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-500 flex items-center justify-center text-white">
                                    <RefreshCw size={22} className="animate-spin-slow" />
                                </div>
                                Update Lifecycle Protocol
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New State Selection</Label>
                            <Select onValueChange={(val) => setStatusData({ ...statusData, status: val })} value={statusData.status}>
                                <SelectTrigger className="h-14 bg-secondary/20 border-transparent rounded-2xl font-bold">
                                    <SelectValue placeholder="Locate state transition..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                    <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                                    <SelectItem value="Selected">Selected</SelectItem>
                                    <SelectItem value="Offer Released">Offer Released</SelectItem>
                                    <SelectItem value="Joined">Joined</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Protocol Notes (Comments)</Label>
                            <input 
                                className="w-full h-14 bg-secondary/20 border-transparent rounded-2xl font-bold px-4 outline-none placeholder:text-muted-foreground/30"
                                placeholder="Reason for transition or feedback summary..."
                                value={statusData.comment}
                                onChange={(e) => setStatusData({ ...statusData, comment: e.target.value })}
                            />
                        </div>
                        <Button 
                            onClick={() => handleStatusUpdate(selectedReferral._id, statusData)}
                            className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                        >
                            Authorize State Transition
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Financial Protocol (Commission Config) Dialog */}
            <Dialog open={isFinanceOpen} onOpenChange={setIsFinanceOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] bg-card border-border/40 rounded-[2.5rem] p-0 overflow-y-auto outline-none">
                    <div className="p-10 bg-emerald-500/5 border-b border-border/20">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <TrendingUp size={22} />
                                </div>
                                Incentive Reconciliation
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Commission Override (₹)</Label>
                                <input 
                                    type="number"
                                    className="w-full h-14 bg-secondary/20 border-transparent rounded-2xl font-black text-lg px-4 outline-none"
                                    value={financeData.calculatedCommission}
                                    onChange={(e) => setFinanceData({ ...financeData, calculatedCommission: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payout Status</Label>
                                <Select onValueChange={(val) => setFinanceData({ ...financeData, payoutStatus: val })} value={financeData.payoutStatus}>
                                    <SelectTrigger className="h-14 bg-secondary/20 border-transparent rounded-2xl font-bold">
                                        <SelectValue placeholder="System State" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="unearned">Unearned</SelectItem>
                                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="declined">Declined</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reconciliation Notes</Label>
                            <input 
                                className="w-full h-14 bg-secondary/20 border-transparent rounded-2xl font-bold px-4 outline-none placeholder:text-muted-foreground/30"
                                placeholder="Audit trail detail (e.g. specialized slab, bonus add-on)..."
                                value={financeData.payoutNotes}
                                onChange={(e) => setFinanceData({ ...financeData, payoutNotes: e.target.value })}
                            />
                        </div>
                        <Button 
                            onClick={() => handleFinanceUpdate(selectedReferral._id, financeData)}
                            className="w-full h-16 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                        >
                            Commit Financial Override
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Timeline Logs Dialog */}
            <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] bg-card border-border/40 rounded-[2.8rem] p-0 overflow-y-auto outline-none">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white">
                                <Clock size={22} />
                            </div>
                            Lifecycle Audit Trail
                        </DialogTitle>
                    </div>
                    <div className="p-10">
                        <ScrollArea className="h-[400px] pr-6">
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {selectedReferral && selectedReferral.activityLogs?.map((log, i) => (
                                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-black text-slate-900 text-xs uppercase tracking-widest">{log.action || 'System Action'}</div>
                                                <time className="font-mono text-xs text-primary">{new Date(log.timestamp).toLocaleDateString()}</time>
                                            </div>
                                            <div className="text-slate-500 text-[10px] font-bold">Node execution protocol registered successfully.</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

/* ── SUB-COMPONENT: CandidateCard ── */
const CandidateCard = ({ row, isAdmin, activeTab, onAssign, onStatus, onFinance, onTimeline, onQuickShortlist, onDelete }) => {
    const roleConfig = {
        'admin': { color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: <Shield size={10} className="mr-1.5" /> },
        'employee': { color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: <User size={10} className="mr-1.5" /> },
        'agent': { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <UserCog size={10} className="mr-1.5" /> },
        'team_leader': { color: 'bg-purple-500/10 text-purple-600 border-purple-500/10', icon: <Sparkles size={10} className="mr-1.5" /> },
    };

    const statusConfig = {
        'Joined': { color: 'bg-emerald-600 text-white border-transparent', icon: <CheckCircle2 size={12} />, theme: 'emerald' },
        'Selected': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 size={12} />, theme: 'emerald' },
        'Shortlisted': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: <CheckCircle2 size={12} />, theme: 'emerald' },
        'Offer Released': { color: 'bg-primary/10 text-primary border-primary/20', icon: <ArrowUpRight size={12} />, theme: 'primary' },
        'Pending': { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <Clock size={12} />, theme: 'amber' },
        'Rejected': { color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: <XCircle size={12} />, theme: 'rose' },
        'default': { color: 'bg-secondary/40 text-muted-foreground border-border/40', icon: <Info size={12} />, theme: 'slate' }
    };

    const getStatusStyle = (status) => statusConfig[status] || statusConfig['default'];

    const config = roleConfig[row.referrer?.role] || { color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: <User size={10} className="mr-1.5" /> };
    const stConfig = getStatusStyle(row.status);
    const themeColor = stConfig.theme === 'rose' ? 'border-l-rose-500' : 
                      stConfig.theme === 'emerald' ? 'border-l-emerald-500' : 
                      stConfig.theme === 'amber' ? 'border-l-amber-500' : 
                      stConfig.theme === 'primary' ? 'border-l-primary' : 'border-l-border';

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const cleanBase = BASE_URL.replace(/\/$/, '');
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${cleanBase}${cleanUrl.replaceAll('\\', '/')}`;
    };

    return (
        <div className={`animate-card group w-full bg-card/95 dark:bg-slate-900 border border-border/40 hover:border-primary/40 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all relative text-left border-l-[6px] ${themeColor} duration-500`}>
            
            {/* Top Layout: Fluid Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">
                
                {/* 1. Identity Segment (Avatar + Main Info) */}
                <div className="col-span-12 lg:col-span-5 flex items-center gap-6">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center font-black text-lg sm:text-xl shadow-inner shrink-0 border border-border/20 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 ${activeTab === 'placements' ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-secondary/60 text-foreground group-hover:bg-primary group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/20'}`}>
                        {row.candidateName ? row.candidateName.charAt(0) : 'C'}
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-col">
                            <h4 className="font-black text-foreground text-lg md:text-xl tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors truncate">{row.candidateName}</h4>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2 leading-none whitespace-nowrap overflow-hidden">
                                <Hash size={10} className="text-primary" /> FIC-{row._id.slice(-6).toUpperCase()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <Badge variant="outline" className="px-3 py-0.5 border-primary/20 text-primary bg-primary/5 text-[9px] font-black uppercase tracking-widest rounded-xl h-6 leading-none shadow-none group-hover:bg-primary group-hover:text-white transition-all">
                                {row.job?.domain || 'Tech Node'}
                            </Badge>
                            {row.branchId && (
                                <Badge variant="outline" className="px-3 py-0.5 border-indigo-500/20 text-indigo-500 bg-indigo-500/5 text-[9px] font-black uppercase tracking-widest rounded-xl h-6 leading-none shadow-none group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    {typeof row.branchId === 'object' ? row.branchId.name : 'Central Node'}
                                </Badge>
                            )}
                            <span className="text-[10px] font-black text-muted-foreground/40 tracking-widest leading-none group-hover:text-foreground/60 transition-colors uppercase italic">• {new Date(row.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Quick Desktop & Mobile Actions */}
                        <div className="flex items-center gap-3 pt-3">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const url = getFullUrl(row.resumeUrl);
                                    url ? window.open(url, '_blank') : toast.error('No document attached');
                                }} 
                                className="w-10 h-10 rounded-2xl bg-secondary/50 hover:bg-primary hover:text-white text-muted-foreground flex items-center justify-center transition-all shadow-sm border border-transparent hover:border-primary/20"
                                title="View Document"
                            >
                                <FileText size={16} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    row.phone ? window.open(`tel:${row.phone}`) : toast.info('No contact number available');
                                }} 
                                className="w-10 h-10 rounded-2xl bg-secondary/50 hover:bg-emerald-500 hover:text-white text-muted-foreground flex items-center justify-center transition-all shadow-sm border border-transparent hover:border-emerald-500/20"
                                title="Quick Call"
                            >
                                <Phone size={16} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickShortlist(row); 
                                }} 
                                className="w-10 h-10 rounded-2xl bg-emerald-500/5 hover:bg-emerald-600 hover:text-white text-emerald-600 flex items-center justify-center transition-all shadow-sm border border-emerald-500/10 hover:border-emerald-500"
                                title="Fast-Track Shortlist"
                            >
                                <Zap size={16} className="fill-current" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Employment Segment (Job + Company) */}
                <div className="col-span-12 lg:col-span-4 space-y-3">
                    <div className="space-y-1">
                        <p className="text-xs font-black text-foreground flex items-center gap-2 leading-tight">
                            <Briefcase size={14} className="text-primary/40 shrink-0" /> 
                            <span className="truncate">{row.job?.jobTitle}</span>
                        </p>
                        <p className="text-[11px] font-bold text-muted-foreground/60 leading-tight pl-5 truncate">
                            {row.job?.companyName || 'Confidential Client Node'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className={`h-6 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest shadow-none border ${config.color}`}>
                            {config.icon} {row.referrer?.name || 'Anonymous Protocol'}
                        </Badge>
                    </div>
                </div>

                {/* 3. Status & Action Segment */}
                <div className="col-span-12 lg:col-span-3 flex flex-row items-center justify-between lg:justify-end gap-6 border-t lg:border-0 border-border/10 pt-6 lg:pt-0">
                    <div className="space-y-3 w-full md:w-auto">
                         <Badge variant="outline" className={`h-8 rounded-2xl px-4 text-[10px] font-black uppercase tracking-[0.1em] shadow-sm border flex items-center gap-2 w-fit ${stConfig.color}`}>
                            {stConfig.icon} {row.status}
                        </Badge>
                        
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground/60 border border-border/20 ${row.assignedEmployee ? 'text-primary border-primary/10 bg-primary/5' : ''}`}>
                                {row.assignedEmployee ? <UserCheck size={14} /> : <Ghost size={14} />}
                            </div>
                            <div className="flex flex-col items-start leading-none gap-1">
                                <span className={`text-[10px] font-black tracking-tight ${row.assignedEmployee ? 'text-foreground' : 'text-muted-foreground italic opacity-60'}`}>
                                    {row.assignedEmployee?.name || 'Protocol Hub Unassigned'}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Assigned Integration Node</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <div className="flex flex-col items-end gap-1 mr-2">
                             <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none">Yield Estimate</p>
                             <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic">₹{row.calculatedCommission || '0'}</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    }}
                                    className="h-12 w-12 rounded-[1.3rem] bg-secondary/80 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-all flex-shrink-0 border border-border/20 shadow-sm outline-none ring-0 relative z-20"
                                >
                                    <MoreVertical size={20} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-2.5 rounded-[2rem] bg-white dark:bg-slate-950 border border-border/40 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.35)] overflow-hidden" style={{ zIndex: 9999 }}>
                                    <DropdownMenuLabel className="font-black text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50 px-4 py-3">Lifecycle Protocols</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border/10 mx-2 mb-2" />
                                    <DropdownMenuItem 
                                        onClick={onAssign}
                                        className="rounded-2xl p-4 gap-4 focus:bg-primary/10 focus:text-primary cursor-pointer group/item transition-all"
                                    >
                                        <div className="bg-primary/10 p-2 rounded-xl group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                            <UserPlus size={16} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Reassign Node</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={onStatus}
                                        className="rounded-2xl p-4 gap-4 focus:bg-indigo-500/10 focus:text-indigo-600 cursor-pointer group/item transition-all"
                                    >
                                        <div className="bg-indigo-500/10 p-2 rounded-xl group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                                            <RefreshCw size={16} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Advance Pipeline</span>
                                    </DropdownMenuItem>

                                    {isAdmin && (
                                        <DropdownMenuItem 
                                            onClick={onFinance}
                                            className="rounded-xl p-3.5 gap-4 focus:bg-emerald-500/10 focus:text-emerald-600 cursor-pointer group/item transition-all"
                                        >
                                            <div className="bg-emerald-500/10 p-2 rounded-xl group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                                                <TrendingUp size={16} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest">Financial Setup</span>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem 
                                        onClick={onTimeline}
                                        className="rounded-xl p-3.5 gap-4 focus:bg-slate-500/10 focus:text-slate-600 cursor-pointer group/item transition-all"
                                    >
                                        <div className="bg-slate-500/10 p-2 rounded-xl group-hover/item:bg-slate-900 group-hover/item:text-white transition-colors">
                                            <Calendar size={16} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Timeline Logs</span>
                                    </DropdownMenuItem>
                                    
                                    {isAdmin && (
                                        <>
                                            <DropdownMenuSeparator className="bg-border/20 mx-2 my-2" />
                                            <DropdownMenuItem 
                                                onClick={onDelete}
                                                className="rounded-xl p-3.5 gap-4 focus:bg-rose-500/10 focus:text-rose-600 cursor-pointer group/item transition-all"
                                            >
                                                <div className="bg-rose-500/10 p-2 rounded-xl group-hover/item:bg-rose-600 group-hover/item:text-white transition-colors">
                                                    <Trash2 size={16} />
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-rose-500 group-hover/item:text-white">Purge Entity</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenuPortal>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Hover Backdrop Decor */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[80px] -translate-y-20 translate-x-10 group-hover:bg-primary/10 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[60px] translate-y-12 -translate-x-10 group-hover:bg-emerald-500/10 transition-all duration-1000" />
        </div>
    );
};

export default ReferralQueue;
