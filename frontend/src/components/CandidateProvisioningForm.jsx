import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Briefcase, FileText, Send, Zap, ChevronDown, Search, Check, Building2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Portal-based Job Picker ────────────────────────────────────────────────────
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
        <>
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
                        {loadingJobs ? 'Loading jobs...' : 'Select a job position...'}
                    </span>
                )}
                <ChevronDown size={14} className={`text-muted-foreground/40 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    style={{ top: coords.top, left: coords.left, width: coords.width, position: 'fixed', zIndex: 999999 }}
                    className="bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
                >
                    {/* Search inside dropdown */}
                    <div className="p-3 border-b border-border/40 bg-secondary/20">
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search jobs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-8 pr-3 bg-background border border-border/40 rounded-xl text-xs font-bold outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Job list */}
                    <div className="max-h-64 overflow-y-auto py-2 custom-scrollbar">
                        {loadingJobs ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold">Loading...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">No jobs found</p>
                            </div>
                        ) : (
                            filtered.map(job => (
                                <button
                                    key={job._id}
                                    type="button"
                                    onClick={() => handleSelect(job)}
                                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-primary/5 transition-colors text-left group ${value === job._id ? 'bg-primary/10' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${value === job._id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white'}`}>
                                        <Briefcase size={13} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black truncate ${value === job._id ? 'text-primary' : 'text-foreground'}`}>{job.jobTitle}</p>
                                        <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest truncate">{job.companyName} · {job.location || 'Remote'}</p>
                                    </div>
                                    {value === job._id && <Check size={14} className="text-primary shrink-0 mt-1" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

// ── Main Form ─────────────────────────────────────────────────────────────────
const CandidateProvisioningForm = ({ onSuccess, onCancel, initialData }) => {
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        candidateName: initialData?.candidateName || '',
        candidateEmail: initialData?.candidateEmail || '',
        mobile: initialData?.mobile || '',
        jobId: initialData?.job?._id || initialData?.jobId || '',
        branchId: initialData?.branchId?._id || initialData?.branchId || '',
        resume: null,
        resumeUrl: initialData?.resumeUrl || '',
        priority: initialData?.priority || 'medium',
        experience: initialData?.experience || '',
        comments: initialData?.comments || ''
    });

    const [branches, setBranches] = useState([]);
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobRes, branchRes] = await Promise.all([
                    api.get('/jobs'),
                    api.get('/branches')
                ]);
                setJobs(jobRes.data.data || []);
                setBranches(branchRes.data.data || []);
                
                // Set default branch if not admin and not editing
                if (!initialData && !isAdmin && currentUser?.branchId) {
                    setFormData(prev => ({ ...prev, branchId: currentUser.branchId }));
                }
            } catch (err) {
                toast.error('Failed to load provisioning metadata');
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchData();
    }, [isAdmin, currentUser, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.jobId) {
            toast.error('Please select a target job');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('candidateName', formData.candidateName);
            data.append('email', formData.candidateEmail);
            data.append('mobile', formData.mobile);
            data.append('jobId', formData.jobId);
            data.append('experience', formData.experience);
            data.append('comments', formData.comments);
            data.append('resumeUrl', formData.resumeUrl);
            data.append('branchId', formData.branchId);
            data.append('priority', formData.priority || 'medium');

            if (formData.resume) {
                data.append('resume', formData.resume);
            }

            if (initialData?._id) {
                await api.patch(`/referrals/${initialData._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Candidate profile synchronized');
            } else {
                data.append('sourceType', isAdmin ? 'self' : currentUser?.role || 'employee');
                await api.post('/referrals', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Candidate provisioned successfully');
            }

            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transaction failure');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Candidate Name */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Candidate Name</Label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={16} />
                        <Input
                            required
                            placeholder="Full Name"
                            value={formData.candidateName}
                            onChange={(e) => setFormData({...formData, candidateName: e.target.value})}
                            className="h-12 pl-11 bg-background border-border/50 rounded-xl text-xs font-bold"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Identity</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={16} />
                        <Input
                            required
                            type="email"
                            placeholder="email@example.com"
                            value={formData.candidateEmail}
                            onChange={(e) => setFormData({...formData, candidateEmail: e.target.value})}
                            className="h-12 pl-11 bg-background border-border/50 rounded-xl text-xs font-bold"
                        />
                    </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Number</Label>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={16} />
                        <Input
                            required
                            placeholder="+91 XXXXX XXXXX"
                            value={formData.mobile}
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            className="h-12 pl-11 bg-background border-border/50 rounded-xl text-xs font-bold"
                        />
                    </div>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Total Experience</Label>
                    <div className="relative group">
                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={16} />
                        <Input
                            required
                            placeholder="e.g. 5 Years"
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                            className="h-12 pl-11 bg-background border-border/50 rounded-xl text-xs font-bold"
                        />
                    </div>
                </div>

                {/* Branch Selection — Admin Only */}
                {isAdmin && (
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assigned Operational Branch</Label>
                        <Select 
                            value={formData.branchId} 
                            onValueChange={(val) => setFormData({...formData, branchId: val})}
                        >
                            <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl text-xs font-bold ring-0 focus:ring-4 focus:ring-primary/5 transition-all">
                                <div className="flex items-center gap-3">
                                    <Building2 size={16} className="text-primary/60" />
                                    <SelectValue placeholder="Select target branch hub..." />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/40 bg-card shadow-2xl z-[99999]">
                                {branches.map(branch => (
                                    <SelectItem key={branch._id} value={branch._id} className="rounded-xl font-bold py-3">
                                        {branch.name} Hub
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Job Selection — Portal Picker */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Job / Requisition</Label>
                    <JobPicker
                        jobs={jobs}
                        loadingJobs={loadingJobs}
                        value={formData.jobId}
                        onChange={(val) => setFormData({...formData, jobId: val})}
                    />
                </div>

                {/* Resume URL */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Resume / Asset Repository Link</Label>
                    <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={16} />
                        <Input
                            placeholder="GDrive, Dropbox, or Portfolio Link"
                            value={formData.resumeUrl}
                            onChange={(e) => setFormData({...formData, resumeUrl: e.target.value})}
                            className="h-12 pl-11 bg-background border-border/50 rounded-xl text-xs font-bold"
                        />
                    </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Upload Resume (PDF / DOCX / TXT)</Label>
                    <div className="relative group">
                        <Input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => setFormData({...formData, resume: e.target.files[0]})}
                            className="h-12 bg-background border-dashed border-border/50 hover:border-primary/40 rounded-xl text-xs font-bold cursor-pointer pt-3"
                        />
                    </div>
                </div>

                {/* Internal Note */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Provisioning Notes (Internal)</Label>
                    <Textarea
                        placeholder="Add screening feedback, salary expectations, or referral context..."
                        className="min-h-[100px] bg-background border-border/50 rounded-xl text-xs font-medium p-4 resize-none"
                        value={formData.comments}
                        onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} className="mr-2" /> Initial Pipeline Entry</>}
                </Button>
            </div>
        </form>
    );
};

export default CandidateProvisioningForm;
