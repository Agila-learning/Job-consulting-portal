import React, { useState } from 'react';
import api from '@/services/api';
import { 
    BrainCircuit, Upload, Loader2, CheckCircle2, 
    XCircle, Sparkles, FileText, Info, ShieldCheck, Lock, Zap,
    ChevronDown, Briefcase
} from 'lucide-react';
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ATSResumeTracker = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [domain, setDomain] = useState("");
    const [role, setRole] = useState("");

    const DOMAINS = [
        { id: 'tech', label: 'Technical / IT' },
        { id: 'non-tech', label: 'Non-Technical / Ops' },
        { id: 'sales', label: 'Sales & Marketing' }
    ];

    const ROLES = {
        'tech': ['MERN Developer', 'UI/UX Designer', 'Cloud Architect (AWS)', 'DevOps Engineer', 'Quality Analyst'],
        'non-tech': ['HR Manager', 'Operations Lead', 'Recruitment Specialist', 'Admin Coordinator'],
        'sales': ['Business Development', 'Account Manager', 'Inside Sales', 'Growth Specialist']
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size exceeds 5MB limit');
                return;
            }
            setFile(selectedFile);
            setResult(null);
        }
    };

    const runAnalysis = async () => {
        if (!file) return toast.error('Please select a resume first');

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const res = await api.post('/ats/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data.data);
            toast.success('Analysis complete');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Deep analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-4xl mx-auto pb-12">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                    <Sparkles size={16} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Next-Gen Intelligence</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                    ATS<span className="text-primary not-italic">.Screening Engine</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto font-medium">
                    Our heuristic engine analyzes resumes in-memory for instant compatibility scoring. 
                    <span className="text-primary font-bold"> No data is stored internally.</span>
                </p>
            </div>

            {/* Analysis Module */}
            <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                {!result ? (
                    <div className="space-y-10 text-center relative z-10">
                        {/* Domain & Role Selection Step */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/20">
                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Target Intelligence Domain</label>
                                <Select onValueChange={setDomain} value={domain}>
                                    <SelectTrigger className="h-14 bg-background dark:bg-slate-900/60 border-border/40 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none transition-all">
                                        <SelectValue placeholder="Select Sector" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl p-2 z-[100]">
                                        {DOMAINS.map(d => (
                                            <SelectItem key={d.id} value={d.id} className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1">
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Specific Designation Node</label>
                                <Select onValueChange={setRole} value={role} disabled={!domain}>
                                    <SelectTrigger className="h-14 bg-background dark:bg-slate-900/60 border-border/40 rounded-2xl font-black text-[11px] uppercase tracking-widest outline-none transition-all">
                                        <SelectValue placeholder={domain ? "Select Designation" : "Domain Required"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-2xl p-2 z-[100]">
                                        {domain && ROLES[domain].map(r => (
                                            <SelectItem key={r} value={r} className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 my-1">
                                                {r}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div 
                            className={`border-2 border-dashed border-border/40 rounded-[2.5rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all group relative ${(!domain || !role) ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                            onClick={() => document.getElementById('resume-upload').click()}
                        >
                            <input 
                                id="resume-upload"
                                type="file" 
                                className="hidden" 
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileChange}
                            />
                            <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500 mb-6 shadow-sm">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                {file ? file.name : 'Drop Resume Here'}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium max-w-xs uppercase tracking-widest leading-loose">
                                {(!domain || !role) ? 'Complete selection above to unlock upload' : file ? 'Ready to analyze sequence...' : 'Upload PDF, DOCX or TXT (Max 5MB)'}
                            </p>
                        </div>

                        <Button 
                            onClick={runAnalysis}
                            disabled={!file || !role || isAnalyzing}
                            className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="animate-spin mr-3" size={20} /> Processing Heuristics...</>
                            ) : (
                                <><BrainCircuit className="mr-3" size={20} /> Start {role && `[${role}]`} AI Screening</>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-10 animate-in zoom-in duration-500 relative z-10">
                        {/* Result Dashboard */}
                        <div className={`p-8 rounded-[2.5rem] border ${
                            result.status === 'Shortlisted' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : result.status === 'Under Review'
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-rose-500/5 border-rose-500/20'
                        }`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                <div className="space-y-4">
                                    <Badge className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest border-none shadow-sm ${
                                        result.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 
                                        result.status === 'Under Review' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                                    }`}>
                                        {result.status}
                                    </Badge>
                                    <h4 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                                        {result.score}% <span className="text-lg text-muted-foreground font-bold uppercase tracking-widest ml-2">Match Score</span>
                                    </h4>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Keywords Hit</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{result.parsedKeywords}</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-background flex items-center justify-center text-primary border border-border/40 shadow-sm">
                                        <FileText size={28} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-background/80 rounded-2xl p-6 border border-border/20 shadow-inner">
                                <p className="text-sm font-medium leading-relaxed italic text-slate-700 dark:text-slate-300">
                                    "{result.match}"
                                </p>
                            </div>
                        </div>

                        {/* Analysis Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AI Recommendation</p>
                                <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border/20 flex gap-4 h-full">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-foreground leading-relaxed">
                                        {result.recommendation}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Notice</p>
                                <div className="bg-indigo-500/5 p-6 rounded-[2rem] border border-indigo-500/10 flex gap-4 h-full">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        <Info size={20} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/70 leading-relaxed">
                                        This analysis was processed epheremally. The resume content was discarded after logic execution.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button 
                                onClick={reset}
                                variant="outline"
                                className="flex-1 h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest border-border/60 hover:bg-secondary/50 transition-all"
                            >
                                <RefreshCw size={16} className="mr-3" /> New Screening
                            </Button>
                            {result.status === 'Shortlisted' && (
                                <Button 
                                    className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all"
                                >
                                    Proceed with Candidate
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Help / FAQ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'In-Memory', desc: 'Resumes are never saved to disk.', icon: ShieldCheck },
                    { title: 'Privacy First', desc: 'No sensitive data persists.', icon: Lock },
                    { title: 'Fast Logic', desc: 'Instant heuristic parsing.', icon: Zap }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-6 bg-secondary/20 rounded-[1.5rem] border border-border/40">
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm">
                            <item.icon size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">{item.title}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase opacity-60">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Simplified Refresh icon since I didn't import it
const RefreshCw = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);

export default ATSResumeTracker;
