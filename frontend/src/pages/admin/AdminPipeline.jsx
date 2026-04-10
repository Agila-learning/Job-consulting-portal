import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DndContext, 
    DragOverlay, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors 
} from '@dnd-kit/core';
import { 
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { KanbanColumn, KanbanCard } from '@/components/KanbanBoard';
import CandidateDetailPanel from '@/components/CandidateDetailPanel';
import CandidateProvisioningForm from '@/components/CandidateProvisioningForm';
import { toast } from 'sonner';
import { 
    UserPlus, Zap, Briefcase, FileSearch, Sparkles, BrainCircuit, Upload,
    Loader2, KanbanSquare, Users, LayoutPanelLeft, Calendar, CheckCircle2, Search, Filter, X, Edit2, MapPin
} from 'lucide-react';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';

const COLUMNS = [
    { id: 'New Referral', title: 'New' },
    { id: 'Under Review', title: 'Screening' },
    { id: 'Shortlisted', title: 'Shortlisted' },
    { id: 'Interview Scheduled', title: 'Interviews' },
    { id: 'Selected', title: 'Hired' },
    { id: 'Joined', title: 'Onboarded' },
    { id: 'Rejected', title: 'Declined' },
];

const AdminPipeline = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [branches, setBranches] = useState([]);
    const [stats, setStats] = useState({ totalCandidates: 0, hiredCount: 0, interviewCount: 0, shortlistedCount: 0 });
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState(null);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [jobFilter, setJobFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    // ATS State
    const [isATSModalOpen, setIsATSModalOpen] = useState(false);
    const [atsFile, setATSFile] = useState(null);
    const [atsResult, setATSResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchQuery = branchFilter !== 'all' ? `?branchId=${branchFilter}` : '';
            const [refRes, statRes, jobRes, branchRes] = await Promise.all([
                api.get(`/referrals${branchQuery}`),
                api.get(`/referrals/stats${branchQuery}`),
                api.get(`/jobs${branchQuery}`),
                api.get('/branches')
            ]);
            
            setReferrals(refRes.data?.data || []);
            setStats(statRes.data?.data || { totalCandidates: 0, hiredCount: 0, interviewCount: 0, shortlistedCount: 0 });
            setJobs(jobRes.data?.data || []);
            setBranches(branchRes.data?.data || []);
        } catch (err) {
            toast.error('Global pipeline synchronization failure');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [branchFilter]);

    const filteredReferrals = (referrals || []).filter(r => {
        if (!r) return false;
        const matchesSearch = (r.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (r.candidateEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesJob = jobFilter === 'all' ? true : r.job?._id === jobFilter;
        const matchesPriority = (priorityFilter === 'all' || !r.priority) ? true : r.priority === priorityFilter;
        return matchesSearch && matchesJob && matchesPriority;
    });

    const handleCardClick = (referral) => {
        setSelectedReferral(referral);
        setIsPanelOpen(true);
    };

    const handleUpdate = () => {
        fetchData();
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeReferral = referrals.find(r => r._id === active.id);
        const overColumnId = over.id;

        if (activeReferral && activeReferral.status !== overColumnId) {
            try {
                // Optimistic update
                setReferrals(prev => prev.map(r => 
                    r._id === active.id ? { ...r, status: overColumnId } : r
                ));

                await api.patch(`/referrals/${active.id}/status`, { status: overColumnId });
                toast.success(`Pipeline level synchronized: ${overColumnId}`);
            } catch (err) {
                toast.error(err.response?.data?.message || 'State transition failed');
                fetchData(); 
            }
        }
        setActiveId(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('IRREVERSIBLE ACTION: Purge candidate from master ledger?')) {
            try {
                await api.delete(`/referrals/${id}`);
                toast.success('Node Purged Successfully');
                fetchData();
            } catch (err) {
                toast.error('Purge Protocol Failed');
            }
        }
    };

    const handleQuickAction = (referral, action) => {
        setSelectedReferral(referral);
        if (action === 'edit') {
            setIsEditModalOpen(true);
        } else {
            setIsPanelOpen(true);
        }
    };

    const runATSAnalysis = async () => {
        if (!atsFile) return toast.error('Please select a resume file');
        setIsAnalyzing(true);
        
        const formData = new FormData();
        formData.append('resume', atsFile);

        try {
            const res = await api.post('/ats/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setATSResult(res.data.data);
                toast.success('AI Heuristic analysis complete');
            } else {
                toast.error(res.data.message || 'Analysis failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'ATS engine synchronization failure');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading && referrals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-8 relative overflow-hidden bg-background">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-card border border-border/40 shadow-xl flex items-center justify-center">
                    <Loader2 size={36} className="text-primary animate-spin" />
                </div>
                <div className="text-center relative z-10 space-y-3">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] leading-none">Syncing Global Pipeline</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em] opacity-60">Handshaking with Branch Nodes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <KanbanSquare size={22} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase italic">Global<span className="text-primary not-italic">.Pipeline</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] ml-1">Universal Talent Registry Orbit</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => setIsATSModalOpen(true)}
                        variant="ghost"
                        className="h-12 px-6 bg-secondary/50 hover:bg-secondary text-primary font-black text-[10px] uppercase tracking-widest rounded-xl border border-primary/10 flex gap-3 transition-all"
                    >
                        <Sparkles size={16} /> ATS Analysis
                    </Button>
                    <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 flex gap-3 transition-all"
                    >
                        <UserPlus size={16} /> Add Candidate
                    </Button>
                </div>
            </div>

            {/* PIPELINE HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Global Volume', value: stats.totalCandidates || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                    { label: 'Screened Match', value: stats.shortlistedCount || 0, icon: LayoutPanelLeft, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
                    { label: 'Live Interviews', value: stats.interviewCount || 0, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                    { label: 'Targets Met', value: stats.hiredCount || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 shadow-sm transition-all relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} border border-current opacity-20`}>
                                <stat.icon size={20} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60 leading-none">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{stat.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FILTERS & ENGINE CONTROLS */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-card/60 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-5 shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search candidate registry by name or email hash..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-background/50 border border-border/40 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl text-[13px] font-black outline-none transition-all placeholder:text-muted-foreground/30"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Select onValueChange={setBranchFilter} value={branchFilter}>
                        <SelectTrigger className="w-full sm:w-48 h-14 bg-background/50 border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none shadow-sm">
                             <div className="flex items-center gap-3"><MapPin size={14} className="text-primary" /><SelectValue placeholder="Branch" /></div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                            <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest py-3">Global View</SelectItem>
                            {branches.map(b => (
                                <SelectItem key={b._id} value={b._id} className="font-black text-[10px] uppercase tracking-widest py-3">{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setJobFilter} value={jobFilter}>
                        <SelectTrigger className="w-full sm:w-56 h-14 bg-background/50 border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none shadow-sm">
                             <div className="flex items-center gap-3"><Briefcase size={14} className="text-primary" /><SelectValue placeholder="Job Context" /></div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40 shadow-2xl max-h-80">
                            <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest py-3">All Job Roles</SelectItem>
                            {jobs.map(job => (
                                <SelectItem key={job._id} value={job._id} className="font-black text-[10px] uppercase tracking-widest py-3">
                                    {job.jobTitle}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Pipeline Canvas */}
            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-start gap-0 pb-12 w-full h-[calc(100vh-450px)] min-h-[600px] relative scroll-smooth px-2">
                <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {COLUMNS.map((col) => (
                        <KanbanColumn 
                            key={col.id} 
                            id={col.id} 
                            title={col.title} 
                            referrals={filteredReferrals.filter(r => r.status === col.id)} 
                            onCardClick={handleCardClick}
                            onDelete={handleDelete}
                            onAction={handleQuickAction}
                        />
                    ))}

                    <DragOverlay dropAnimation={null}>
                        {activeId ? (
                            <KanbanCard 
                                referral={referrals.find(r => r._id === activeId)} 
                                isOverlay 
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* DETAIL SLIDE OVER */}
            <CandidateDetailPanel 
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                referral={selectedReferral}
                onUpdate={handleUpdate}
            />

            {/* EDIT MODAL */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[2.8rem] shadow-2xl p-0 overflow-hidden outline-none z-[110] flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500 flex items-center justify-center text-white shadow-lg">
                                    <Edit2 size={22} className="fill-white" />
                                </div>
                                Edit Candidate
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                         <CandidateProvisioningForm 
                            initialData={selectedReferral}
                            onSuccess={() => {
                                setIsEditModalOpen(false);
                                fetchData();
                            }}
                            onCancel={() => setIsEditModalOpen(false)}
                         />
                    </div>
                </DialogContent>
            </Dialog>

            {/* PROVISIONING MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[2.8rem] shadow-2xl p-0 overflow-hidden outline-none z-[110] flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-primary flex items-center justify-center text-white shadow-lg">
                                    <UserPlus size={22} className="fill-white" />
                                </div>
                                Provision Candidate
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                         <CandidateProvisioningForm 
                            onSuccess={() => {
                                setIsAddModalOpen(false);
                                fetchData();
                            }}
                            onCancel={() => setIsAddModalOpen(false)}
                         />
                    </div>
                </DialogContent>
            </Dialog>

            {/* ATS AI MODAL */}
            <Dialog open={isATSModalOpen} onOpenChange={setIsATSModalOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border/40 rounded-[2.5rem] shadow-2xl p-0 outline-none z-[120]">
                    <div className="p-8 border-b border-border/30 bg-primary/5">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <BrainCircuit size={24} className="text-primary" />
                                ATS AI Screening Engine
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        {!atsResult ? (
                            <div className="space-y-6">
                                <div className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all group ${atsFile ? 'bg-primary/5 border-primary/30' : 'border-border/40 hover:bg-primary/5'}`}>
                                    {!atsFile && (
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                            onChange={(e) => setATSFile(e.target.files[0])}
                                        />
                                    )}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-4 ${atsFile ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white'}`}>
                                        {atsFile ? <FileSearch size={24} /> : <Upload size={24} />}
                                    </div>
                                    <p className={`text-xs font-black uppercase tracking-widest ${atsFile ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {atsFile ? atsFile.name : 'Drop Candidate Resume Here'}
                                    </p>
                                    {atsFile && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setATSFile(null); }}
                                            className="mt-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors relative z-20"
                                        >
                                            Change File
                                        </button>
                                    )}
                                </div>
                                <Button 
                                    onClick={runATSAnalysis}
                                    disabled={!atsFile || isAnalyzing}
                                    className="w-full h-14 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Run Heuristic Analysis'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in zoom-in duration-500">
                                <div className={`p-6 rounded-[2rem] border ${atsResult.status === 'Shortlisted' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <Badge className={`rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border-none ${atsResult.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {atsResult.status}
                                        </Badge>
                                        <span className="text-2xl font-black">{atsResult.score}% Match</span>
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed italic opacity-80">"{atsResult.match}"</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Recommendation</p>
                                    <div className="bg-secondary/40 p-4 rounded-xl text-[11px] font-bold text-foreground flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> {atsResult.recommendation}
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => { setATSResult(null); setATSFile(null); }}
                                    variant="outline"
                                    className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50"
                                >
                                    Scan Another Candidate
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminPipeline;
