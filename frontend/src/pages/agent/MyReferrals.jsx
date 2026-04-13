import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { AgentKanbanColumn } from '@/components/AgentKanbanBoard';
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
import ReferralForm from '@/components/ReferralForm';

const MyReferrals = () => {
    const navigate = useNavigate();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

    const handleCardClick = (referral) => {
        setSelectedReferral(referral);
        setIsChatOpen(true);
    };

    const COLUMNS = [
        { id: 'New Referral', title: 'Referred' },
        { id: 'Under Review', title: 'Under Review' },
        { id: 'Contacted', title: 'Contacted' },
        { id: 'Interview Scheduled', title: 'Interview Scheduled' },
        { id: 'Interview Attended', title: 'Interview Completed' },
        { id: 'Selected', title: 'Selected' },
        { id: 'Offered', title: 'Offered' },
        { id: 'Joined', title: 'Joined / Placed' },
        { id: 'Rejected', title: 'Rejected' },
        { id: 'Hold', title: 'Hold' }
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
                        onClick={() => setIsAddModalOpen(true)} 
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
                        <option value="all">All Active Stages</option>
                        {COLUMNS.map(col => (
                            <option key={col.id} value={col.id}>{col.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Kanban Content */}
            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-start gap-0 pb-12 w-full h-[calc(100vh-400px)] min-h-[600px] relative scroll-smooth bg-secondary/5 rounded-[3rem] p-6 border border-border/40 shadow-inner">
                {COLUMNS.filter(col => statusFilter === 'all' || statusFilter === col.id).map((col) => {
                    // Match multiple possible statuses for robust stage mapping, or exact if defined
                    const stageReferrals = filteredReferrals.filter(r => {
                        if (col.id === 'New Referral') return r.status === 'New Referral' || r.status === 'Referred';
                        if (col.id === 'Joined') return r.status === 'Joined' || r.status === 'Joined / Placed';
                        return r.status === col.id;
                    });
                    
                    return (
                        <AgentKanbanColumn 
                            key={col.id} 
                            title={col.title} 
                            referrals={stageReferrals} 
                            onCardClick={handleCardClick}
                        />
                    );
                })}
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

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-2xl border-border/40 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                    <div className="p-10 border-b border-border/40 bg-secondary/30 relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <DialogTitle className="text-2xl font-black tracking-tight leading-none text-foreground flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <Plus size={20} />
                                </div>
                                Submit New Referral
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-4 font-medium">Capture candidate intelligence for any active mandate.</p>
                    </div>
                    <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <ReferralForm 
                            onSuccess={() => {
                                setIsAddModalOpen(false);
                                fetchReferrals();
                            }} 
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyReferrals;
