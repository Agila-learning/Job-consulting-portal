import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
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
    Loader2, KanbanSquare, Users, LayoutPanelLeft, Calendar, CheckCircle2, Search, Filter, X, Edit2
} from 'lucide-react';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';

const COLUMNS = [
    { id: 'New Referral', title: 'New' },
    { id: 'Under Review', title: 'Screening' },
    { id: 'Shortlisted', title: 'Shortlisted' },
    { id: 'Interview Scheduled', title: 'Interviews' },
    { id: 'Selected', title: 'Hired' },
    { id: 'Joined', title: 'Onboarded' },
    { id: 'Rejected', title: 'Declined' },
];

const CandidatePipeline = () => {
    const [referrals, setReferrals] = useState([]);
    const [jobs, setJobs] = useState([]);
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
            const [refRes, statRes, jobRes] = await Promise.allSettled([
                api.get('/referrals'),
                api.get('/referrals/stats'),
                api.get('/jobs')
            ]);
            
            if (refRes.status === 'fulfilled') {
                setReferrals(refRes.value.data?.data || []);
            }
            
            if (statRes.status === 'fulfilled') {
                setStats(statRes.value.data?.data || { totalCandidates: 0, hiredCount: 0, interviewCount: 0, shortlistedCount: 0 });
            }

            if (jobRes.status === 'fulfilled') {
                setJobs(jobRes.value.data?.data || []);
            }
        } catch (err) {
            toast.error('Pipeline synchronization lag');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const { socket } = useSocket();
    useEffect(() => {
        if (socket) {
            const handleSync = () => {
                console.log('Real-time sync triggered: Candidate Pipeline');
                fetchData();
            };

            socket.on('newReferral', handleSync);
            socket.on('statusChanged', handleSync);
            
            return () => {
                socket.off('newReferral', handleSync);
                socket.off('statusChanged', handleSync);
            };
        }
    }, [socket]);

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
                setReferrals(prev => prev.map(r => 
                    r._id === active.id ? { ...r, status: overColumnId } : r
                ));

                await api.patch(`/referrals/${active.id}/status`, { status: overColumnId });
                toast.success(`Pipeline level updated: ${overColumnId}`);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Sync failure');
                fetchData(); 
            }
        }
        setActiveId(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this candidate?')) {
            try {
                await api.delete(`/referrals/${id}`);
                toast.success('Candidate purged from pipeline');
                fetchData();
            } catch (err) {
                toast.error('Deletion failed');
            }
        }
    };

    const handleQuickAction = (referral, action) => {
        setSelectedReferral(referral);
        if (action === 'edit') {
            setIsEditModalOpen(true);
        } else if (action === 'status') {
            setIsPanelOpen(true); // Detail panel already has status update
        } else if (action === 'timeline') {
            setIsPanelOpen(true); // Detail panel has timeline
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
            console.error('ATS Error:', err);
            toast.error(err.response?.data?.message || 'ATS engine synchronization failure');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-8 relative overflow-hidden bg-background">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-card border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center justify-center">
                    <Loader2 size={36} className="text-primary animate-spin" />
                    <Zap size={18} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="text-center relative z-10 space-y-3">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] leading-none">Accessing Central Pipeline</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em] opacity-60">Synchronizing Distributed Object State...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-10 animate-in fade-in duration-700 pb-10">
            {/* Board Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <KanbanSquare size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase italic">Hiring<span className="text-primary not-italic">.Pipeline</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] ml-1">Candidate Orchestration Domain</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={() => setIsATSModalOpen(true)}
                        variant="ghost"
                        className="h-12 px-6 bg-secondary/50 hover:bg-secondary text-primary font-black text-[10px] uppercase tracking-widest rounded-xl border border-primary/10 flex gap-3 transition-all"
                    >
                        <Sparkles size={16} className="animate-pulse" /> ATS AI Filter
                    </Button>
                    <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 flex gap-3 transition-all"
                    >
                        <UserPlus size={16} /> Add Candidate
                    </Button>
                </div>
            </div>

            {/* BOARD STATS HUD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Volume', value: stats.totalCandidates || 0, icon: Users, color: 'bg-blue-500', trend: 'Global' },
                    { label: 'Shortlisted', value: stats.shortlistedCount || 0, icon: LayoutPanelLeft, color: 'bg-indigo-500', trend: 'Active' },
                    { label: 'Interviews', value: stats.interviewCount || 0, icon: Calendar, color: 'bg-amber-500', trend: 'Live' },
                    { label: 'Successful Hires', value: stats.hiredCount || 0, icon: CheckCircle2, color: 'bg-emerald-500', trend: 'Targets' },
                ].map((stat, i) => (
                    <div key={i} className="group bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden text-left">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color}/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
                        <div className="flex justify-between items-start relative z-10 mb-5 text-slate-900 dark:text-white">
                            <div className={`p-4 rounded-2xl ${stat.color}/10 ${stat.color.replace('bg-', 'text-')} border ${stat.color.replace('bg-', 'border-')}/20 shadow-sm transition-transform group-hover:scale-110 duration-500`}>
                                <stat.icon size={22} />
                            </div>
                            <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-primary/10 text-primary/80 bg-primary/5 flex gap-1.5 items-center">
                                {stat.trend}
                            </Badge>
                        </div>
                        <div className="relative z-10 transition-transform group-hover:translate-x-1 duration-300">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 leading-none opacity-70">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* FILTERS & ENGINE CONTROLS */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 bg-card/50 backdrop-blur-3xl border border-border/40 rounded-[2rem] lg:rounded-[3rem] p-4 lg:p-6 shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors duration-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search candidates by name or identity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-background dark:bg-slate-900/60 border border-border/40 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl text-[13px] font-black text-slate-900 dark:text-white outline-none transition-all placeholder:font-bold placeholder:text-muted-foreground/30 shadow-inner"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Select onValueChange={setPriorityFilter} value={priorityFilter}>
                        <SelectTrigger className="w-full sm:w-48 h-14 bg-background dark:bg-slate-900/60 border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm focus:ring-primary/5 transition-all outline-none">
                             <div className="flex items-center gap-3"><Filter size={14} className="text-primary/60" /><SelectValue placeholder="Priority" /></div>
                        </SelectTrigger>
                        <SelectContent className="rounded-[2.2rem] border-border/40 bg-card/95 backdrop-blur-3xl shadow-2xl p-2 z-[100] outline-none">
                            <SelectItem value="all" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1">All Priorities</SelectItem>
                            <SelectItem value="high" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1 text-rose-600 bg-rose-500/5">Flash High</SelectItem>
                            <SelectItem value="medium" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1 text-amber-600 bg-amber-500/5">Operational</SelectItem>
                            <SelectItem value="low" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1 text-emerald-600 bg-emerald-500/5">Baseline</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setJobFilter} value={jobFilter}>
                        <SelectTrigger className="w-full sm:w-64 h-14 bg-background dark:bg-slate-900/60 border-border/40 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm focus:ring-primary/5 transition-all outline-none">
                             <div className="flex items-center gap-3"><Briefcase size={14} className="text-primary/60" /><SelectValue placeholder="Job View" /></div>
                        </SelectTrigger>
                        <SelectContent className="rounded-[2.2rem] border-border/40 bg-card/95 backdrop-blur-3xl shadow-2xl p-2 z-[100] max-h-80 outline-none">
                            <SelectItem value="all" className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1">All Jobs</SelectItem>
                            {jobs.map(job => (
                                <SelectItem key={job._id} value={job._id} className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1">
                                    {job.jobTitle}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Pipeline Canvas */}
            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-start gap-0 pb-12 w-full h-[calc(100vh-480px)] min-h-[650px] relative scroll-smooth">
                 <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
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
                <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[2.8rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] p-0 overflow-hidden outline-none z-[110] flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 relative overflow-hidden flex-shrink-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                        <DialogHeader className="flex flex-row items-center justify-between space-y-0 text-left">
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
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
                <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[2.8rem] shadow-[0_40px_80px_rgba(0,0,0,0.15)] p-0 overflow-hidden outline-none z-[110] flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-border/30 bg-secondary/10 relative overflow-hidden flex-shrink-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                        <DialogHeader className="flex flex-row items-center justify-between space-y-0 text-left">
                            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
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
                    <div className="p-8 border-b border-border/30 bg-primary/5 relative overflow-hidden">
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
                                    {!atsFile && <p className="text-[10px] text-muted-foreground/40 mt-2">Support: PDF, DOCX, TXT</p>}
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

export default CandidatePipeline;
