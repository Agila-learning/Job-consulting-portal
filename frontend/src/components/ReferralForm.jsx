import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/services/api';
import { User, Phone, Mail, FileText, Send, Loader2, Briefcase, MapPin, Hash, Star } from 'lucide-react';

const ReferralForm = ({ job, onSuccess }) => {
    const [formData, setFormData] = useState({
        candidateName: '',
        mobile: '',
        email: '',
        experience: '',
        preferredLocation: '',
        resume: null, // For file upload
        resumeUrl: '', // For link
        skills: '',
        additionalComments: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            
            // Append text fields
            Object.keys(formData).forEach(key => {
                if (key === 'skills') {
                    if (formData.skills) {
                        data.append('skills', formData.skills);
                    }
                } else if (key !== 'resume' && formData[key]) {
                    data.append(key, formData[key]);
                }
            });

            // Append jobId
            data.append('jobId', job._id);

            // Append file if exists
            if (formData.resume) {
                data.append('resume', formData.resume);
            }

            await api.post('/referrals', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success('Candidate referral successfully synchronized with recruitment queue');
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit referral lifecycle event');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Context Header */}
            <div className="p-6 bg-secondary/30 rounded-2xl border border-transparent hover:border-primary/10 transition-all group">
                <div className="flex items-start justify-between mb-4">
                    <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                        Job Details
                    </Badge>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center text-primary border border-border/50 shadow-sm transition-transform group-hover:scale-110">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-foreground tracking-tight leading-none mb-1">{job.jobTitle}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">
                            <Star size={10} className="text-amber-500 fill-amber-500" /> {job.companyName}
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidate Profiling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2.5">
                    <Label htmlFor="candidateName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="candidateName" 
                            required 
                            value={formData.candidateName} 
                            onChange={handleChange} 
                            className="pl-11 h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium" 
                            placeholder="e.g. John Smith" 
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="email" 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={handleChange} 
                            className="pl-11 h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium" 
                            placeholder="candidate@email.com" 
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    <Label htmlFor="mobile" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</Label>
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
                            className="pl-11 h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium" 
                            placeholder="10 Digit Number" 
                        />
                    </div>
                </div>

                <div className="space-y-2.5">
                    <Label htmlFor="experience" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Years of Experience</Label>
                    <Input 
                        id="experience" 
                        required 
                        value={formData.experience} 
                        onChange={handleChange} 
                        className="h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium px-4" 
                        placeholder="e.g. 5" 
                    />
                </div>

                <div className="space-y-2.5">
                    <Label htmlFor="preferredLocation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Preferred Job Location</Label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="preferredLocation" 
                            required 
                            value={formData.preferredLocation} 
                            onChange={handleChange} 
                            className="pl-11 h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium" 
                            placeholder="e.g. Bangalore" 
                        />
                    </div>
                </div>

                <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="resumeUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Resume Link</Label>
                    <div className="relative group">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        <Input 
                            id="resumeUrl" 
                            value={formData.resumeUrl} 
                            onChange={handleChange} 
                            className="pl-11 h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium" 
                            placeholder="Link to resume" 
                        />
                    </div>
                </div>

                <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="resumeFile" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Upload Resume (Optional)</Label>
                    <div className="relative group">
                        <Input 
                            id="resumeFile" 
                            type="file"
                            onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                            className="h-12 bg-secondary/10 border-dashed border-border/60 hover:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl font-medium cursor-pointer p-2" 
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="skills" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Skills (Comma Separated)</Label>
                <Input 
                    id="skills" 
                    required 
                    value={formData.skills} 
                    onChange={handleChange} 
                    className="h-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium px-4" 
                    placeholder="e.g. React, JavaScript, Node.js" 
                />
            </div>

            <div className="space-y-2.5">
                <Label htmlFor="additionalComments" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Why this candidate?</Label>
                <Textarea 
                    id="additionalComments" 
                    value={formData.additionalComments} 
                    onChange={handleChange} 
                    className="min-h-[120px] bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-xl font-medium p-4" 
                    placeholder="Briefly describe why they are a good fit..." 
                />
            </div>

            <div className="pt-4">
                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex gap-3 group"
                >
                    {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                        <>
                            <Send size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /> 
                            Submit Candidate
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default ReferralForm;
