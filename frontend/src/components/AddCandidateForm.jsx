import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Briefcase, FileText, Send, Zap } from 'lucide-react';
import api from '@/services/api';

const AddCandidateForm = ({ onSuccess, onCancel }) => {
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        candidateName: '',
        candidateEmail: '',
        mobile: '',
        jobId: '',
        resume: null,
        resumeUrl: '',
        priority: 'medium',
        experience: '',
        comments: ''
    });

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs');
                setJobs(res.data.data || []);
            } catch (err) {
                toast.error('Failed to load active jobs');
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchJobs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.jobId) {
            toast.error('Please select a target job');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            
            // Append all string fields
            data.append('candidateName', formData.candidateName);
            data.append('candidateEmail', formData.candidateEmail);
            data.append('mobile', formData.mobile);
            data.append('jobId', formData.jobId);
            data.append('experience', formData.experience);
            data.append('comments', formData.comments);
            data.append('resumeUrl', formData.resumeUrl);
            data.append('sourceType', 'employee'); // Marking as direct employee/TL entry
            data.append('priority', formData.priority || 'medium');

            // Append file if exists
            if (formData.resume) {
                data.append('resume', formData.resume);
            }

            await api.post('/referrals', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Candidate provisioned successfully');
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Provisioning failed');
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

                {/* Job Selection */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Job / Requisition</Label>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors pointer-events-none" size={16} />
                        <select 
                            required
                            value={formData.jobId}
                            onChange={(e) => setFormData({...formData, jobId: e.target.value})}
                            className="w-full h-14 pl-12 pr-10 bg-background border border-border/40 hover:border-border/60 focus:border-border/60 rounded-2xl text-[11px] font-black focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer text-foreground"
                        >
                            <option value="" disabled>{loadingJobs ? "Synchronizing inventory..." : "Locate job node..."}</option>
                            {jobs.map(job => (
                                <option key={job._id} value={job._id} className="font-black text-[11px]">
                                    {job.jobTitle} ({job.companyName} - {job.location || 'Remote'})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground"><path d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.73379 9.9026 7.61934 9.95001 7.49999 9.95001C7.38064 9.95001 7.26618 9.9026 7.18179 9.81821L4.18179 6.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Resume Section */}
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

export default AddCandidateForm;
