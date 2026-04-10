import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ReferralForm from '@/components/ReferralForm';
import { Briefcase, Building, MapPin, DollarSign, PlusCircle, Search, Filter, ArrowUpRight, Globe, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

const AvailableJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [isReferOpen, setIsReferOpen] = useState(false);
    const [locationFilter, setLocationFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('all');

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/jobs');
            setJobs(res.data.data);
        } catch (err) {
            toast.error('Failed to synchronize mandates from network');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             job.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = locationFilter === 'all' ? true : job.location === locationFilter;
        const matchesType = typeFilter === 'all' ? true : job.jobType === typeFilter;
        const matchesMode = modeFilter === 'all' ? true : job.workMode === modeFilter;
        
        return matchesSearch && matchesLocation && matchesType && matchesMode;
    });

    const handleExport = () => {
        const headers = ['Title', 'Company', 'Location', 'Type', 'Mode', 'Salary'];
        const csvContent = [
            headers.join(','),
            ...filteredJobs.map(j => [
                j.jobTitle, j.companyName, j.location, j.jobType, j.workMode, j.salary
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `available_mandates_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Marketplace intelligence exported');
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tight leading-none text-shadow-sm">Find Job Openings</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Live Jobs
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Discover active job openings and refer the best candidates.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Button onClick={handleExport} variant="outline" className="h-12 px-6 rounded-2xl border-border/60 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                        <ArrowUpRight size={18} className="mr-2" />
                        Export Jobs
                    </Button>
                    <div className="relative group w-full xl:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10" />
                        <input 
                            type="text" 
                            placeholder="Search by role, skill, or company..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl text-sm font-bold placeholder:text-muted-foreground/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-border/40">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Job Location</label>
                    <select 
                        value={locationFilter} 
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all">All Locations</option>
                        {Array.from(new Set(jobs.map(j => j.location))).filter(Boolean).map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Employment Type</label>
                    <select 
                        value={typeFilter} 
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="Full-Time">Full-Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Mode</label>
                    <select 
                        value={modeFilter} 
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all">All Modes</option>
                        <option value="On-site">On-site</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[340px] rounded-[2.5rem] bg-secondary/50 animate-pulse border border-border/20 shadow-sm relative overflow-hidden" />
                    ))}
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-center p-12 bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center border border-border/50 shadow-inner mb-8">
                        <Briefcase className="text-muted-foreground/40" size={40} />
                    </div>
                    <h4 className="text-foreground font-black text-2xl tracking-tight mb-2">No Active Jobs Found</h4>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto font-medium leading-relaxed">Try changing your search filters to find more jobs.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredJobs.map((job) => (
                        <Card key={job._id} className="relative bg-card/60 backdrop-blur-xl border-border/40 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500 group rounded-[2.5rem] overflow-hidden flex flex-col pt-2">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
                            
                            <CardHeader className="pb-4 space-y-6 pt-6 px-8 rounded-t-[2.5rem] relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="w-16 h-16 bg-background border border-border/50 rounded-2xl flex items-center justify-center text-foreground group-hover:scale-105 group-hover:border-primary/30 group-hover:text-primary group-hover:shadow-[0_10px_30px_-10px_rgba(6,96,252,0.3)] transition-all duration-500 shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Building size={28} className="relative z-10" />
                                    </div>
                                    <Badge variant="secondary" className="bg-background border-border/50 text-muted-foreground font-black text-[9px] uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-xl shadow-sm group-hover:text-primary transition-colors flex gap-1.5 items-center">
                                        <Globe size={10} /> {job.workMode || 'Hybrid'}
                                    </Badge>
                                </div>
                                <div className="space-y-1.5">
                                    <CardTitle 
                                        onClick={() => { setSelectedJob(job); setIsReferOpen(true); }}
                                        className="text-xl font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
                                    >
                                        {job.jobTitle}
                                    </CardTitle>
                                    <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-primary/50" />
                                        {job.companyName}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="p-1 rounded-md bg-secondary text-muted-foreground/70">
                                            <MapPin size={12} />
                                        </div>
                                        <span className="text-xs font-bold tracking-tight">{job.location || 'Global/Remote'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <div className="p-1 rounded-md bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10">
                                            <DollarSign size={12} />
                                        </div>
                                        <span className="text-xs font-black tracking-tight">{job.salary || 'Standard Band'}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 px-8 pt-2">
                                <div className="flex flex-wrap gap-2.5 mb-6">
                                    <Badge variant="outline" className="bg-background border-border/50 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl text-muted-foreground shadow-sm">
                                        <Clock size={10} className="mr-1.5" />
                                        {job.jobType || 'Full-Time'}
                                    </Badge>
                                    <Badge variant="outline" className="bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 dark:border-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                                        <Zap size={10} className="mr-1.5 fill-amber-500 text-amber-500 opacity-80" /> Premium Bounty
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-loose line-clamp-3 font-medium">
                                    {job.rolesAndResponsibilities}
                                </p>
                            </CardContent>
                            <CardFooter className="p-8 pt-6 bg-gradient-to-b from-transparent to-secondary/10 border-t border-border/30 gap-4">
                                <Dialog 
                                    open={isReferOpen && selectedJob?._id === job._id} 
                                    onOpenChange={(open) => {
                                        setIsReferOpen(open);
                                        if (open) setSelectedJob(job);
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <Button className="flex-1 bg-primary hover:bg-primary/90 text-white h-14 font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 group/btn">
                                            <PlusCircle size={16} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                                            Refer a Candidate
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-2xl border-border/40 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                                        <div className="p-10 border-b border-border/40 bg-secondary/30 relative">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                            <DialogTitle className="text-2xl font-black tracking-tight leading-none text-foreground flex items-center gap-3">
                                                 <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                                    <Briefcase size={20} />
                                                 </div>
                                                 Refer a Candidate
                                            </DialogTitle>
                                            <p className="text-sm text-muted-foreground mt-4 font-medium">Job Role: <span className="text-foreground font-black tracking-tight ml-1 px-2 py-1 bg-background rounded-md border border-border/50">{job.jobTitle}</span> at <span className="text-primary font-bold">{job.companyName}</span></p>
                                        </div>
                                        <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                            <ReferralForm 
                                                job={job} 
                                                onSuccess={() => {
                                                    setIsReferOpen(false);
                                                    fetchJobs();
                                                }} 
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button 
                                    onClick={() => { setSelectedJob(job); setIsReferOpen(true); }}
                                    variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-border/40 bg-background text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                >
                                    <ArrowUpRight size={20} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AvailableJobs;
