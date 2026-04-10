import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
    MessageSquare, Phone, Mail, FileText, 
    CheckCircle2, Clock, Send, 
    Loader2, Users, User, Briefcase,
    Zap, Hash, ShieldCheck, UserPlus,
    ChevronRight, StickyNote, CalendarClock
} from 'lucide-react';
import ReferralChat from '@/components/ReferralChat';
import AddCandidateForm from '@/components/AddCandidateForm';

const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    
    // Success/Joined (Emerald)
    if (['selected', 'joined', 'offer released'].includes(s)) 
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/5';
    
    // Pipeline/Initial (Blue/Indigo)
    if (['new referral', 'assigned', 'shortlisted', 'screening done'].includes(s)) 
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-500/5';
    
    // Activity/Engagement (Purple)
    if (s.includes('interview') || s === 'contacted' || s === 'interested') 
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 dark:bg-purple-500/5';
    
    // Warning/Hold (Amber)
    if (['under review', 'hold'].includes(s)) 
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/5';
    
    // Negative/Closure (Rose)
    if (['rejected', 'dropped', 'not interested'].includes(s)) 
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 dark:bg-rose-500/5';
    
    return 'bg-secondary text-muted-foreground border-border/50';
};

const MyAssignedCandidates = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [updateData, setUpdateData] = useState({ status: '', comment: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchAssigned = async () => {
        setLoading(true);
        try {
            const res = await api.get('/referrals');
            setReferrals(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load assigned candidates');
        } finally {
            setLoading(false);
        }
    };

    const filteredReferrals = referrals.filter(ref => {
        const matchesSearch = ref.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             ref.mobile.includes(searchTerm) ||
                             (ref.job?.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : ref.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        const headers = ['Candidate', 'Mobile', 'Email', 'Job Title', 'Company', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredReferrals.map(r => [
                r.candidateName, r.mobile, r.email, r.job?.jobTitle, r.job?.companyName, r.status, new Date(r.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assigned_candidates_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Telemetry Exported');
    };

    useEffect(() => { fetchAssigned(); }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.patch(`/referrals/${selectedReferral._id}/status`, updateData);
            toast.success('Candidate status updated successfully');
            setIsUpdateOpen(false);
            setUpdateData({ status: '', comment: '' });
            fetchAssigned();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusOptions = [
        'New Referral', 'Under Review', 'Assigned', 'Contacted', 'Interested', 
        'Not Interested', 'Screening Done', 'Shortlisted', 'Interview Scheduled', 
        'Interview Attended', 'Selected', 'Offer Released', 'Joined', 'Rejected', 
        'Hold', 'Dropped'
    ];

    const columns = [
        {
            header: 'Candidate Identity',
            cell: (row) => (
                <div className="flex items-center gap-4 py-1">
                    <div className="w-11 h-11 rounded-2xl bg-secondary dark:bg-slate-900 border border-border/60 flex items-center justify-center font-black text-slate-900 dark:text-white text-sm flex-shrink-0 shadow-sm">
                        {(row.candidateName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white text-[13px] tracking-tight leading-none mb-1.5 truncate">{row.candidateName}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2 opacity-70">
                            <Hash size={10} className="text-primary/60" /> {row.mobile}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Target Mandate',
            cell: (row) => (
                <div className="py-1">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight leading-none line-clamp-1 mb-1.5 uppercase">{row.job?.jobTitle || '—'}</p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight opacity-70 truncate">{row.job?.companyName || '—'}</p>
                </div>
            )
        },
        {
            header: 'Pipeline Stage',
            cell: (row) => (
                <div className="py-1">
                    <Badge className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] border shadow-sm ${getStatusBadge(row.status)}`}>
                        {row.status}
                    </Badge>
                </div>
            )
        },
        {
            header: 'Sourcing Path',
            cell: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-xl bg-secondary dark:bg-slate-900 flex items-center justify-center text-muted-foreground border border-border/40">
                        <User size={14} />
                    </div>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest opacity-80">{row.referrer?.name || 'Direct'}</span>
                </div>
            )
        },
        {
            header: 'Telemetry',
            cell: (row) => (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest py-1">
                    <Clock size={11} className="text-primary/40" />
                    {new Date(row.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
            )
        },
        {
            header: 'Operations',
            cell: (row) => (
                <div className="flex items-center justify-end pr-2 py-1">
                    <Button 
                        onClick={() => {
                            setSelectedReferral(row);
                            setUpdateData({ status: row.status, comment: '' });
                            setIsUpdateOpen(true);
                        }}
                        className="h-10 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group border-0"
                    >
                        <Zap size={14} className="group-hover:fill-white transition-all duration-300" />
                        Manage
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <h2 className="text-2xl font-black text-foreground tracking-tight leading-none">My Candidates</h2>
                        <Badge variant="outline" className="h-5 px-2.5 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Live
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Active jobs and candidates assigned to you.</p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-4 flex-wrap">
                    <Button 
                        onClick={handleExport}
                        variant="ghost" 
                        className="h-12 px-6 rounded-2xl border border-border/50 text-muted-foreground hover:bg-primary/5 hover:text-primary font-black text-[10px] uppercase tracking-[0.15em] gap-3 transition-all"
                    >
                        <FileText size={18} /> Download Database
                    </Button>
                    <Button 
                        className="h-12 px-8 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.15em] gap-3 shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all border-0"
                        onClick={() => {
                            setIsAddModalOpen(true);
                        }}
                    >
                        <UserPlus size={18} /> Provision Direct
                    </Button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary/15 backdrop-blur-xl p-6 rounded-[2.5rem] border border-border/40">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Candidates</Label>
                    <Input 
                        placeholder="Search name, phone, or job..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 bg-background border-border/50 rounded-xl text-xs font-bold shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Status</Label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer shadow-sm"
                    >
                        <option value="all">All Stages</option>
                        {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col justify-end">
                    <div className="h-12 flex items-center px-4 bg-primary/5 border border-primary/10 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary mr-2">Scope:</span>
                        <span className="text-xs font-bold text-foreground">Assigned & Owned</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border/30 bg-secondary/10 flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg">
                        <Users size={16} />
                    </div>
                    <h3 className="text-sm font-black text-foreground tracking-tight">Active Candidates</h3>
                    <span className="ml-auto text-xs text-muted-foreground font-bold">{filteredReferrals.length} active record{filteredReferrals.length !== 1 ? 's' : ''}</span>
                </div>
                <DataTable 
                    columns={columns} 
                    data={filteredReferrals} 
                    loading={loading} 
                    emptyMessage="No candidates assigned yet. High-value mandates will appear here." 
                />
            </div>

            {/* Manage Dialog */}
            <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogContent className="max-w-6xl bg-card border-border/40 rounded-3xl p-0 shadow-2xl overflow-hidden focus-visible:ring-0 max-h-[92vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] lg:max-h-[88vh]">
                        {/* Form Side */}
                        <div className="flex flex-col border-r border-border/30 overflow-y-auto">
                            <div className="p-6 border-b border-border/30 bg-secondary/10 flex-shrink-0">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <MessageSquare size={18} />
                                        </div>
                                        Update Candidate Status
                                    </DialogTitle>
                                </DialogHeader>
                            </div>

                            <div className="p-6 flex-1">
                                {selectedReferral && (
                                    <div className="p-4 bg-secondary/30 border border-border/50 rounded-2xl mb-6 flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xl flex-shrink-0">
                                            {(selectedReferral.candidateName || 'C').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-black text-foreground tracking-tight leading-none truncate">{selectedReferral.candidateName}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{selectedReferral.mobile}</p>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <a href={`tel:${selectedReferral.mobile}`} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1 hover:bg-emerald-500/20 transition-colors">
                                                    <Phone size={10} /> Call
                                                </a>
                                                <a href={`mailto:${selectedReferral.email}`} className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 hover:bg-blue-500/20 transition-colors">
                                                    <Mail size={10} /> Email
                                                </a>
                                                {selectedReferral.resumeUrl && (
                                                    <a href={selectedReferral.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1 hover:bg-amber-500/20 transition-colors">
                                                        <FileText size={10} /> Resume
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleUpdate} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Update Status</Label>
                                        <Select onValueChange={(val) => setUpdateData({...updateData, status: val})} value={updateData.status}>
                                            <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl font-bold text-sm">
                                                <SelectValue placeholder="Select new stage..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border/50 bg-card shadow-2xl">
                                                {statusOptions.map(opt => (
                                                    <SelectItem key={opt} value={opt} className={`rounded-xl font-bold text-xs py-2.5 m-0.5 ${getStatusBadge(opt)}`}>
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Note</Label>
                                        <Textarea 
                                            placeholder="Add screening notes, feedback, or follow-up instructions..." 
                                            className="min-h-[120px] bg-background border-border/50 rounded-xl text-sm font-medium p-4 resize-none" 
                                            value={updateData.comment}
                                            onChange={(e) => setUpdateData({...updateData, comment: e.target.value})}
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} className="mr-2" /> Save Changes</>}
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Chat Side */}
                        <div className="flex flex-col bg-background min-h-[400px] lg:min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ReferralChat 
                                    referralId={selectedReferral?._id} 
                                    candidateName={selectedReferral?.candidateName} 
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* ADD CANDIDATE MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[2.8rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] p-0 overflow-hidden outline-none z-[110] flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 relative overflow-hidden flex-shrink-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                        <DialogHeader className="flex flex-row items-center justify-between space-y-0 text-left">
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <UserPlus size={22} className="fill-white" />
                                </div>
                                Provision Direct
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                         <AddCandidateForm 
                            onSuccess={() => {
                                setIsAddModalOpen(false);
                                fetchAssigned();
                            }}
                            onCancel={() => setIsAddModalOpen(false)}
                         />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyAssignedCandidates;
