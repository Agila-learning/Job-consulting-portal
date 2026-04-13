import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/services/api';
import { User, Phone, Mail, FileText, Send, Loader2, Briefcase, MapPin, Hash, Star, Search, ChevronDown, Check } from 'lucide-react';

// ── Generic Job Picker for Referral Flow ──────────────────────────────────────
const JobPicker = ({ jobs, loadingJobs, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const selectedJob = jobs.find(j => j._id === value);
    const filtered = jobs.filter(j =>
        j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        (j.companyName || '').toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width
            });
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (job) => {
        onChange(job._id);
        setOpen(false);
        setSearch('');
    };

    return (
        <div className="relative">
            <button
                type="button"
                ref={triggerRef}
                onClick={() => setOpen(prev => !prev)}
                className="w-full h-14 px-4 bg-background border border-border/40 hover:border-primary/40 focus:border-primary/60 focus:ring-4 focus:ring-primary/5 rounded-2xl text-left flex items-center gap-3 transition-all outline-none cursor-pointer group"
            >
                <Briefcase size={16} className="text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                {selectedJob ? (
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-foreground truncate">{selectedJob.jobTitle}</p>
                        <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest truncate">
                            {selectedJob.companyName} · {selectedJob.location || 'Remote'}
                        </p>
                    </div>
                ) : (
                    <span className="text-[11px] font-bold text-muted-foreground/50 flex-1">
                        {loadingJobs ? 'Synchronizing jobs...' : 'Select Target Mandate...'}
                    </span>
                )}
                <ChevronDown size={14} className={`text-muted-foreground/40 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ top: coords.top, left: coords.left, width: coords.width, position: 'fixed', zIndex: 9999999 }}
                    className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
                >
                    <div className="p-3 border-b border-border/40 bg-secondary/20">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Filter jobs by title or entity..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-8 pr-3 bg-background border border-border/40 rounded-xl text-xs font-bold outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
                        {loadingJobs ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold font-black uppercase tracking-widest opacity-40">Polling...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-8 text-center px-4">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">No Mandates Found</p>
                            </div>
                        ) : (
                            filtered.map(j => (
                                <button
                                    key={j._id}
                                    type="button"
                                    onClick={() => handleSelect(j)}
                                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-primary/5 transition-colors text-left group ${value === j._id ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${value === j._id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white'}`}>
                                        <Briefcase size={12} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-black truncate ${value === j._id ? 'text-primary' : 'text-foreground'}`}>{j.jobTitle}</p>
                                        <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest truncate">{j.companyName} · {j.location || 'Remote'}</p>
                                    </div>
                                    {value === j._id && <Check size={14} className="text-primary shrink-0 mt-1" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// ── Main Referral Submission Engine ──────────────────────────────────────────
const ReferralForm = ({ job: initialJob, onSuccess }) => {
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(initialJob?._id || '');

    const [formData, setFormData] = useState({
        candidateName: '',
        mobile: '',
        email: '',
        experience: '',
        preferredLocation: '',
        resume: null,
        resumeUrl: '',
        skills: '',
        additionalComments: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Job Fetching if needed
    useEffect(() => {
        if (!initialJob) {
            const fetchJobs = async () => {
                setLoadingJobs(true);
                try {
                    const res = await api.get('/jobs');
                    setJobs(res.data.data || []);
                } catch (err) {
                    toast.error('Mandate synchronization failed');
                } finally {
                    setLoadingJobs(false);
                }
            };
            fetchJobs();
        }
    }, [initialJob]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedJobId) {
            toast.error('Please select a target mandate');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'resume' && formData[key]) {
                    data.append(key, formData[key]);
                }
            });

            data.append('jobId', selectedJobId);

            if (formData.resume) {
                data.append('resume', formData.resume);
            }

            await api.post('/referrals', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Referral initialized successfully');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Referral capture failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentJob = initialJob || jobs.find(j => j._id === selectedJobId);

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            {/* Context Header / Job Selection */}
            <div className="p-6 bg-secondary/30 rounded-[2rem] border border-border/40 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                
                <div className="flex items-center justify-between mb-5">
                    <Badge variant="outline" className="bg-background border-border/50 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full text-muted-foreground">
                        Target Requisition
                    </Badge>
                </div>

                {initialJob ? (
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20 transition-transform group-hover:scale-105">
                            <Briefcase size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-black text-foreground tracking-tight leading-none mb-1.5 truncate">{initialJob.jobTitle}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">
                                <Star size={11} className="text-amber-500 fill-amber-500" /> {initialJob.companyName}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <JobPicker 
                            jobs={jobs} 
                            loadingJobs={loadingJobs} 
                            value={selectedJobId} 
                            onChange={setSelectedJobId} 
                        />
                        {currentJob && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-background/50 rounded-xl border border-border/20 text-[9px] font-bold text-muted-foreground uppercase tracking-widest animate-in slide-in-from-top-1">
                                <MapPin size={10} className="text-primary" /> {currentJob.location || 'Remote'} · Active Mandate
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Candidate Profiling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-2">
                    <Label htmlFor="candidateName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Candidate Name</Label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="candidateName" 
                            required 
                            value={formData.candidateName} 
                            onChange={handleChange} 
                            className="pl-11 h-14 bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-xs font-bold" 
                            placeholder="Full Name" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Identity</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="email" 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={handleChange} 
                            className="pl-11 h-14 bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-xs font-bold" 
                            placeholder="email@example.com" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Number</Label>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="mobile" 
                            required 
                            type="tel"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            value={formData.mobile} 
                            onChange={handleChange} 
                            className="pl-11 h-14 bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-xs font-bold" 
                            placeholder="10 Digit Number" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="experience" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Experience Baseline</Label>
                    <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="experience" 
                            required 
                            value={formData.experience} 
                            onChange={handleChange} 
                            className="pl-11 h-14 bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-xs font-bold" 
                            placeholder="e.g. 5 Years" 
                        />
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="resumeUrl" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Repository / Resume Link</Label>
                    <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="resumeUrl" 
                            value={formData.resumeUrl} 
                            onChange={handleChange} 
                            className="pl-11 h-14 bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-xs font-bold" 
                            placeholder="GDrive, Dropbox, or Portfolio Link" 
                        />
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Upload Resume (PDF / DOCX)</Label>
                    <Input 
                        id="resumeFile" 
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                        className="h-14 bg-background/50 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 rounded-2xl text-xs font-bold cursor-pointer pt-4" 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="skills" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Specializations / Skills</Label>
                <Input 
                    id="skills" 
                    required 
                    value={formData.skills} 
                    onChange={handleChange} 
                    className="h-14 bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl text-xs font-bold px-5" 
                    placeholder="e.g. React, Node.js, AI Engineering" 
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="additionalComments" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Screening Summary / Internal Notes</Label>
                <Textarea 
                    id="additionalComments" 
                    value={formData.additionalComments} 
                    onChange={handleChange} 
                    className="min-h-[120px] bg-background border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[1.5rem] text-xs font-medium p-5 resize-none shadow-inner" 
                    placeholder="Add screening feedback or referral context..." 
                />
            </div>

            <div className="pt-4">
                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group border-0"
                >
                    {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                        <>
                            <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /> 
                            Initialize Pipeline Entry
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default ReferralForm;
