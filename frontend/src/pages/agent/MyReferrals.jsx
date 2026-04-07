import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, Briefcase, Clock, CheckCircle, MessageSquare, History, ExternalLink, MessageCircle, MoreHorizontal, User, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator,
    DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import ReferralChat from '@/components/ReferralChat';

const MyReferrals = () => {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to withdraw this referral? This action cannot be undone.')) {
            try {
                await api.delete(`/referrals/${id}`);
                toast.success('Referral withdrawn successfully');
                fetchReferrals();
            } catch (err) {
                toast.error('Failed to withdraw referral');
            }
        }
    };

    const fetchReferrals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/referrals');
            setReferrals(res.data.data);
        } catch (err) {
            toast.error('Failed to load referral intelligence');
        } finally {
            setLoading(false);
        }
    };

    const filteredReferrals = referrals.filter(ref => {
        const matchesSearch = ref.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             ref.job?.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : ref.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        const headers = ['Candidate', 'Job', 'Company', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredReferrals.map(r => [
                r.candidateName,
                r.job?.jobTitle,
                r.job?.companyName,
                r.status,
                new Date(r.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my_referrals_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Intelligence Export Initiated');
    };

    const getStatusStyle = (status) => {
        const styles = {
            'Referred': 'bg-primary/10 text-primary border-primary/20',
            'Assigned': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            'Interview Scheduled': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            'Selected': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            'Rejected': 'bg-destructive/10 text-destructive border-destructive/20',
            'Joined': 'bg-primary text-white border-transparent shadow-sm'
        };
        return styles[status] || 'bg-secondary text-muted-foreground border-border/50';
    };

    const columns = [
        {
            header: 'Candidate Profile',
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center font-bold text-primary shadow-sm shrink-0">
                        {row.candidateName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-bold text-foreground text-sm tracking-tight leading-none mb-1.5 truncate">{row.candidateName}</p>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-5 px-1.5 rounded-md text-[8px] font-black tracking-widest bg-secondary/50 text-muted-foreground border-none uppercase">
                                {row.experience || 'ENTRY'} LEVEL
                            </Badge>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Operational Mandate',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/50 rounded-lg text-muted-foreground/40">
                        <Briefcase size={16} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground tracking-tight truncate max-w-[150px] mb-0.5">{row.job?.jobTitle}</p>
                        <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{row.job?.companyName}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Lifecycle Status',
            cell: (row) => (
                <div className="flex flex-col gap-2">
                    <Badge className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.05em] border inline-flex items-center justify-center w-fit h-6 ${getStatusStyle(row.status)}`}>
                        {row.status}
                    </Badge>
                    {row.assignedEmployee && (
                        <div className="flex items-center gap-1.5 text-[9px] text-primary font-bold uppercase tracking-wider leading-none">
                            <Clock size={10} className="text-primary/60" />
                            <span>Consultant Active</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Last Synchronization',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-[11px] text-foreground font-bold tracking-tight">
                        {new Date(row.updatedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                        {new Date(row.updatedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            )
        },
        {
            header: 'Orchestration',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl text-primary hover:text-white hover:bg-primary border-border/50 hover:border-primary transition-all shadow-sm"
                        onClick={() => {
                            setSelectedReferral(row);
                            setIsChatOpen(true);
                        }}
                    >
                        <MessageCircle size={18} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/50">
                                <MoreHorizontal size={18} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl bg-white dark:bg-slate-950 border-border/40 shadow-2xl z-[100]">
                                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-3 py-2">Candidate Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border/10" />
                                <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors" onClick={() => toast.info('Edit functionality being synchronized...')}>
                                    <Edit size={16} />
                                    <span className="text-xs font-bold">Edit Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="flex items-center gap-3 p-3 rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-colors"
                                    onClick={() => handleDelete(row._id)}
                                >
                                    <Trash2 size={16} />
                                    <span className="text-xs font-bold">Withdraw Referral</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">Referral Intelligence</h2>
                    <p className="text-muted-foreground text-sm mt-2 font-medium">Real-time telemetry and orchestration of candidate pipelines.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Button 
                        onClick={() => navigate('/agent/jobs')} 
                        className="h-10 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border-0"
                    >
                        <Plus size={16} />
                        New Referral
                    </Button>
                    <Button onClick={handleExport} variant="outline" className="h-10 px-6 rounded-2xl border-border/60 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                        <ExternalLink size={16} className="mr-2" />
                        Export Pipeline
                    </Button>
                    <div className="flex items-center gap-5 px-6 py-4 bg-card border border-border/40 rounded-[2rem] shadow-sm">
                        <div className="text-right">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black leading-none mb-1">Mandate Limit</p>
                            <p className="text-sm font-black text-foreground tracking-tight uppercase">Unrestricted / Verified</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 border border-primary/10 transition-transform hover:scale-105">
                            <Users size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-[2rem] border border-border/40">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Pipeline</Label>
                    <input 
                        type="text" 
                        placeholder="Candidate name or job title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-4 pr-4 bg-background border border-border/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-bold outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stage Filter</Label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-12 pl-4 pr-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer"
                    >
                        <option value="all">All Stages</option>
                        <option value="Referred">Referred</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Selected">Selected</option>
                        <option value="Joined">Joined</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <DataTable 
                    columns={columns} 
                    data={filteredReferrals} 
                    loading={loading} 
                    emptyMessage="Operational queue is empty. No matching records found." 
                />
            </div>

            {selectedReferral && (
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogContent className="max-w-[450px] p-0 rounded-[2rem] overflow-hidden border-border/50 shadow-2xl">
                        <ReferralChat 
                            referralId={selectedReferral._id} 
                            referralName={selectedReferral.candidateName} 
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default MyReferrals;
