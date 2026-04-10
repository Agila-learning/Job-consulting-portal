import React, { useEffect, useRef, useState } from 'react';
import { 
    X, Phone, Mail, Calendar, Briefcase, FileText, 
    MessageSquare, History, User, MapPin, ExternalLink,
    Star, Clock, ChevronRight, Save, Trash2, AlertCircle,
    CheckCircle2, Plus, ArrowRight, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import gsap from 'gsap';
import api from '@/services/api';

const CandidateDetailPanel = ({ isOpen, onClose, referral, onUpdate }) => {
    const panelRef = useRef(null);
    const overlayRef = useRef(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (isOpen) {
            gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, visibility: 'visible' });
            gsap.to(panelRef.current, { x: 0, duration: 0.5, ease: 'power3.out' });
        } else {
            gsap.to(panelRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
            gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, onComplete: () => {
                if (overlayRef.current) overlayRef.current.style.visibility = 'hidden';
            }});
        }
    }, [isOpen]);

    if (!referral) return null;

    const handleAddNote = async () => {
        if (!note.trim()) return;
        setLoading(true);
        try {
            await api.patch(`/referrals/${referral._id}/status`, { comment: note });
            onUpdate();
            setNote('');
            toast.success('Note added to timeline');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add note');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        setLoading(true);
        const loadingToast = toast.loading(`Transitioning to ${newStatus}...`);
        try {
            await api.patch(`/referrals/${referral._id}/status`, { status: newStatus });
            toast.success(`Candidate ${newStatus} Successfully`, { id: loadingToast });
            onUpdate();
            onClose(); // Close panel after status change to see kanban update
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Lifecycle transition protocol failure';
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high': return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 uppercase text-[9px] font-black tracking-widest">High Priority</Badge>;
            case 'medium': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase text-[9px] font-black tracking-widest">Medium Action</Badge>;
            case 'low': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase text-[9px] font-black tracking-widest">Stable</Badge>;
            default: return <Badge variant="outline" className="uppercase text-[9px] font-black tracking-widest">Standard</Badge>;
        }
    };

    return (
        <>
            <div 
                ref={overlayRef}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] invisible opacity-0 transition-all duration-300"
            />
            <div 
                ref={panelRef}
                className="fixed top-0 right-0 h-screen w-full md:w-[600px] bg-card border-l border-border/50 z-[101] shadow-2xl translate-x-full overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-border/40 relative overflow-hidden bg-secondary/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-3xl shadow-sm">
                                {referral.candidateName.charAt(0)}
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black tracking-tight text-foreground">{referral.candidateName}</h2>
                                    {getPriorityBadge(referral.priority)}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-bold text-xs mt-2">
                                    <span className="flex items-center gap-1.5"><Mail size={14} className="text-primary/60" /> {referral.candidateEmail}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer" onClick={() => window.open(`tel:${referral.mobile}`)}>
                                            <Phone size={14} className="text-primary/60" /> {referral.mobile}
                                        </span>
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            disabled={loading}
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    await api.patch(`/referrals/${referral._id}/increment-calls`);
                                                    toast.success('Call experience logged');
                                                    onUpdate();
                                                } catch (err) {
                                                    toast.error('Logging failure');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className="h-7 px-2.5 rounded-lg border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex gap-1.5"
                                        >
                                            <Phone size={10} /> Log Call ({referral.totalCalls || 0})
                                        </Button>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Badge className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl shadow-lg shadow-primary/20">
                                        {referral.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-background border border-border/50 hover:bg-secondary transition-all text-muted-foreground hover:scale-105 active:scale-95"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs / Navigation */}
                <div className="px-8 pt-4 bg-secondary/10 border-b border-border/30">
                    <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="bg-transparent gap-8 h-12 p-0">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Overview</TabsTrigger>
                            <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Timeline & Notes</TabsTrigger>
                            <TabsTrigger value="job" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-12 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Role Details</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="space-y-10">
                        {activeTab === 'overview' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Bio / About Section */}
                                <section className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><User size={14} /></div>
                                        Professional Profile
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-secondary/20 p-5 rounded-2xl border border-border/30">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Current Status</p>
                                            <p className="text-sm font-black text-foreground">{referral.status}</p>
                                        </div>
                                        <div className="bg-secondary/20 p-5 rounded-2xl border border-border/30">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Last Interaction</p>
                                            <p className="text-sm font-black text-foreground">{new Date(referral.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Skills / Tags */}
                                <section className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Star size={14} /></div>
                                        Expertise & Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {referral.candidateTags?.map((tag, i) => (
                                            <Badge key={i} className="bg-secondary/80 hover:bg-secondary text-foreground border border-border/50 font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-xl">
                                                {tag}
                                            </Badge>
                                        ))}
                                        <button className="h-8 px-4 border border-dashed border-border/60 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                                            <Plus size={12} /> Add Tag
                                        </button>
                                    </div>
                                </section>

                                {/* Documents */}
                                <section className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><FileText size={14} /></div>
                                        Artifacts & Assets
                                    </h4>
                                    {referral.resume && (
                                        <a 
                                            href={referral.resume} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="group flex items-center justify-between p-6 bg-card border border-border/50 rounded-3xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 transition-colors group-hover:bg-rose-500 group-hover:text-white">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground">Candidate Resume</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">application_artifact.pdf</p>
                                                </div>
                                            </div>
                                            <div className="p-2 border border-border/50 rounded-xl text-muted-foreground group-hover:text-primary group-hover:border-primary/20">
                                                <ExternalLink size={16} />
                                            </div>
                                        </a>
                                    )}
                                </section>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Add Note */}
                                <div className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><MessageSquare size={14} /></div>
                                        Intel Capture
                                    </h4>
                                    <div className="bg-card border border-border/50 rounded-3xl p-6 space-y-4 shadow-sm">
                                        <Textarea 
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="Capture interview insights or candidate concerns..."
                                            className="min-h-[100px] bg-secondary/10 border-transparent focus:bg-background focus:border-primary/30 rounded-2xl text-xs font-medium p-4 resize-none outline-none transition-all"
                                        />
                                        <div className="flex justify-end">
                                            <Button 
                                                disabled={loading || !note.trim()} 
                                                onClick={handleAddNote}
                                                className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-widest px-6 h-10 rounded-xl"
                                            >
                                                {loading ? <Clock size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                                                Commit Note
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><History size={14} /></div>
                                        Lifecycle Timeline
                                    </h4>
                                    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-border/40">
                                        {/* Status Changes and Notes mixed */}
                                        {(referral.comments || []).slice().reverse().map((n, i) => (
                                            <div key={i} className="relative pl-10">
                                                <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-background border-2 border-primary/20 flex items-center justify-center z-10 shadow-sm">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                </div>
                                                <div className="bg-secondary/10 border border-border/30 rounded-2xl p-5 group hover:border-primary/20 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{n.type || 'System Logic'}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(n.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-foreground leading-relaxed">
                                                        {n.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Initial Stage */}
                                        <div className="relative pl-10">
                                            <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-background border-2 border-emerald-500/20 flex items-center justify-center z-10 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            </div>
                                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Initialization</p>
                                                <p className="text-xs font-medium text-foreground/80">Candidate profile provisioned by Agent Network.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'job' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                 <section className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Briefcase size={14} /></div>
                                        Opportunity Context
                                    </h4>
                                    <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm">
                                        <div className="flex gap-4 mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center text-foreground font-black text-xl">
                                                {referral.job?.companyName.charAt(0)}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black text-foreground leading-none">{referral.job?.jobTitle}</h3>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{referral.job?.companyName}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-secondary/10 p-4 rounded-xl space-y-1">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Remuneration</p>
                                                <p className="text-xs font-black">{referral.job?.salary || 'NDA Protected'}</p>
                                            </div>
                                            <div className="bg-secondary/10 p-4 rounded-xl space-y-1">
                                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Zone/Mode</p>
                                                <p className="text-xs font-black uppercase tracking-widest">{referral.job?.workMode || 'Office'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-8 border-t border-border/30">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Mandate Objectives</p>
                                            <p className="text-xs font-medium text-foreground/70 leading-relaxed line-clamp-6">
                                                {referral.job?.rolesAndResponsibilities}
                                            </p>
                                            <Button variant="ghost" className="mt-4 p-0 h-auto hover:bg-transparent text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group">
                                                Technical breakdown <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                 </section>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-border/40 bg-secondary/20 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            disabled={loading}
                            onClick={() => handleUpdateStatus('Shortlisted')}
                            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 flex gap-3"
                        >
                            <CheckCircle2 size={18} /> Move to Shortlist
                        </Button>
                        <Button 
                            disabled={loading}
                            onClick={() => handleUpdateStatus('Rejected')}
                            variant="outline" 
                            className="flex-1 h-14 border-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex gap-3 transition-all"
                        >
                            <XCircle size={18} /> Reject Profile
                        </Button>
                    </div>
                    <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-[0.3em]">Lifecycle Hash: {referral._id}</p>
                </div>
            </div>
        </>
    );
};

export default CandidateDetailPanel;
