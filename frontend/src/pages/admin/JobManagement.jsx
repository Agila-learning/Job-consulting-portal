import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    Plus, Search, Filter, Briefcase, 
    Edit2, Archive, Loader2,
    Download, LayoutPanelLeft, Zap, 
    DollarSign, Clock, Globe, Calendar, RefreshCw,
    PlusCircle, Layers, Building, MapPin, ChevronRight, 
    X, Trash2, LayoutGrid, List
} from 'lucide-react';
import Pagination from '@/components/Pagination';
import * as XLSX from 'xlsx';

const JobManagement = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [formData, setFormData] = useState({
        jobTitle: '',
        companyName: '',
        salary: '',
        location: '',
        jobType: 'full-time',
        workMode: 'office',
        domain: 'IT',
        rolesAndResponsibilities: '',
        experienceRequired: '',
        openings: 1,
        visibility: true
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/jobs');
            setJobs(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch job postings');
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             job.companyName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : job.status === statusFilter;
        const matchesType = typeFilter === 'all' ? true : job.jobType === typeFilter;
        const matchesMode = modeFilter === 'all' ? true : job.workMode === modeFilter;
        
        return matchesSearch && matchesStatus && matchesType && matchesMode;
    });

    const totalPages = Math.ceil(filteredJobs.length / pageSize);
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter, modeFilter]);



    const handleExport = () => {
        if (filteredJobs.length === 0) {
            toast.error('No data to export');
            return;
        }

        const exportData = filteredJobs.map(job => ({
            'Job Title': job.jobTitle,
            'Company': job.companyName,
            'Domain': job.domain,
            'Job Type': job.jobType,
            'Work Mode': job.workMode,
            'Experience': job.experienceRequired,
            'Salary': job.salary,
            'Status': job.status,
            'Date Posted': new Date(job.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths to prevent #### issues
        worksheet['!cols'] = [
            { wch: 30 }, // Job Title
            { wch: 25 }, // Company
            { wch: 15 }, // Domain
            { wch: 15 }, // Job Type
            { wch: 15 }, // Work Mode
            { wch: 15 }, // Experience
            { wch: 20 }, // Salary
            { wch: 10 }, // Status
            { wch: 15 }  // Date
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Inventory');
        
        XLSX.writeFile(workbook, `job_inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Inventory Exported as Excel');
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditOpen) {
                await api.patch(`/jobs/${selectedJob._id}`, formData);
                toast.success('Job posting updated successfully');
                setIsEditOpen(false);
            } else {
                await api.post('/jobs', formData);
                toast.success('Job posting created successfully');
                setIsCreateOpen(false);
            }
            
            setFormData({
                jobTitle: '',
                companyName: '',
                salary: '',
                location: '',
                jobType: 'full-time',
                workMode: 'office',
                domain: 'IT',
                rolesAndResponsibilities: '',
                experienceRequired: '',
                openings: 1,
                visibility: true
            });
            fetchJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process job posting');
        }
    };

    const openEdit = (job) => {
        setSelectedJob(job);
        setFormData({
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            salary: job.salary,
            location: job.location,
            jobType: job.jobType,
            workMode: job.workMode,
            domain: job.domain,
            rolesAndResponsibilities: job.rolesAndResponsibilities,
            experienceRequired: job.experienceRequired,
            openings: job.openings || 1,
            visibility: job.visibility
        });
        setIsEditOpen(true);
    };

    const openDetails = (job) => {
        setSelectedJob(job);
        setIsDetailsOpen(true);
    };

    const handleSoftDelete = async (id) => {
        try {
            await api.patch(`/jobs/${id}`, { status: 'closed' });
            toast.success('Job archived (marked as closed)');
            fetchJobs();
        } catch (err) {
            toast.error('Failed to archive job');
        }
    };

    const handleStatusToggle = async (job) => {
        const newStatus = job.status === 'active' ? 'closed' : 'active';
        if (window.confirm(`Are you sure you want to set this job as ${newStatus.toUpperCase()}?`)) {
            try {
                await api.patch(`/jobs/${job._id}`, { status: newStatus });
                toast.success(`Job status updated to ${newStatus}`);
                fetchJobs();
            } catch (err) {
                toast.error('Failed to update status');
            }
        }
    };

    const handleHardDelete = async (id) => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this job record? This cannot be undone.')) {
            try {
                await api.delete(`/jobs/${id}?hard=true`); 
                toast.success('Job purged from inventory');
                fetchJobs();
            } catch (err) {
                toast.error('Purge failed');
            }
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tight leading-none text-shadow-sm" style={{ color: 'var(--section-jobs)' }}>Job Openings</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Live Data
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">View and manage all active job requirements in the system.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="hidden sm:flex bg-secondary/50 rounded-2xl p-1 border border-border/40">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="h-12 px-6 rounded-2xl border-border/60 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                        <Archive size={18} className="mr-2" />
                        Export Jobs
                    </Button>
                        {isAdmin && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger 
                                render={
                                    <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center outline-none">
                                        <PlusCircle size={18} className="mr-2" />
                                        Post a Job
                                    </Button>
                                } 
                            />
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] focus-visible:ring-0">
                                <div className="p-10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <DialogHeader className="relative z-10 mb-8">
                                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                <Layers size={24} />
                                            </div>
                                            Post a New Job
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Job Title</Label>
                                                <Input id="jobTitle" required value={formData.jobTitle} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. Senior Backend Dev" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Company Name</Label>
                                                <Input id="companyName" required value={formData.companyName} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="Tech Solutions Inc." />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Salary Range</Label>
                                                <Input id="salary" required value={formData.salary} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. 15L - 25L PA" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Location</Label>
                                                <Input id="location" required value={formData.location} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. Bangalore, Remote" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Job Type</Label>
                                                <Select onValueChange={(val) => handleSelectChange('jobType', val)} defaultValue={formData.jobType}>
                                                    <SelectTrigger className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                        <SelectValue placeholder="Full-time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                        <SelectItem value="full-time" className="rounded-xl font-bold text-xs py-2.5">Full-time</SelectItem>
                                                        <SelectItem value="part-time" className="rounded-xl font-bold text-xs py-2.5">Part-time</SelectItem>
                                                        <SelectItem value="contract" className="rounded-xl font-bold text-xs py-2.5">Contract</SelectItem>
                                                        <SelectItem value="freelance" className="rounded-xl font-bold text-xs py-2.5">Freelance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Mode</Label>
                                                <Select onValueChange={(val) => handleSelectChange('workMode', val)} defaultValue={formData.workMode}>
                                                    <SelectTrigger className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                        <SelectValue placeholder="Office" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                        <SelectItem value="office" className="rounded-xl font-bold text-xs py-2.5">On-Site</SelectItem>
                                                        <SelectItem value="remote" className="rounded-xl font-bold text-xs py-2.5">Remote</SelectItem>
                                                        <SelectItem value="hybrid" className="rounded-xl font-bold text-xs py-2.5">Hybrid</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Domain</Label>
                                                <Select onValueChange={(val) => handleSelectChange('domain', val)} defaultValue={formData.domain}>
                                                    <SelectTrigger className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                        <SelectValue placeholder="Select Domain" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl z-[150]">
                                                        <SelectItem value="IT" className="rounded-xl font-bold text-xs py-2.5">IT</SelectItem>
                                                        <SelectItem value="BDA" className="rounded-xl font-bold text-xs py-2.5">BDA</SelectItem>
                                                        <SelectItem value="Consulting" className="rounded-xl font-bold text-xs py-2.5">Consulting</SelectItem>
                                                        <SelectItem value="Credit card" className="rounded-xl font-bold text-xs py-2.5">Credit card</SelectItem>
                                                        <SelectItem value="Administration" className="rounded-xl font-bold text-xs py-2.5">Administration</SelectItem>
                                                        <SelectItem value="HR" className="rounded-xl font-bold text-xs py-2.5">HR</SelectItem>
                                                        <SelectItem value="Insurance" className="rounded-xl font-bold text-xs py-2.5">Insurance</SelectItem>
                                                        <SelectItem value="Marketing" className="rounded-xl font-bold text-xs py-2.5">Marketing</SelectItem>
                                                        <SelectItem value="Manufacturing" className="rounded-xl font-bold text-xs py-2.5">Manufacturing</SelectItem>
                                                        <SelectItem value="Banking" className="rounded-xl font-bold text-xs py-2.5">Banking</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Experience</Label>
                                            <Input id="experienceRequired" required value={formData.experienceRequired} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. 3-5 Years" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Job Description</Label>
                                            <Textarea id="rolesAndResponsibilities" required value={formData.rolesAndResponsibilities} onChange={handleChange} className="min-h-[160px] bg-background border-border/50 rounded-2xl focus:bg-background focus:ring-2 focus:ring-primary/20 text-sm font-medium p-5 shadow-sm resize-none outline-none" placeholder="Enter job roles and requirements..." />
                                        </div>
                                        <DialogFooter className="pt-6">
                                            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3">
                                                <Globe size={18} />
                                                Post Job
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    {/* Edit Job Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] focus-visible:ring-0">
                            <div className="p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <DialogHeader className="relative z-10 mb-8">
                                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                            <Edit2 size={24} />
                                        </div>
                                        Edit Job Details
                                    </DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Job Title</Label>
                                            <Input id="jobTitle" required value={formData.jobTitle} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Company Name</Label>
                                            <Input id="companyName" required value={formData.companyName} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Salary Range</Label>
                                            <Input id="salary" required value={formData.salary} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Location</Label>
                                            <Input id="location" required value={formData.location} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Job Type</Label>
                                            <Select onValueChange={(val) => handleSelectChange('jobType', val)} value={formData.jobType}>
                                                <SelectTrigger className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                    <SelectItem value="full-time" className="rounded-xl font-bold text-xs py-2.5">Full-time</SelectItem>
                                                    <SelectItem value="part-time" className="rounded-xl font-bold text-xs py-2.5">Part-time</SelectItem>
                                                    <SelectItem value="contract" className="rounded-xl font-bold text-xs py-2.5">Contract</SelectItem>
                                                    <SelectItem value="freelance" className="rounded-xl font-bold text-xs py-2.5">Freelance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Mode</Label>
                                            <Select onValueChange={(val) => handleSelectChange('workMode', val)} value={formData.workMode}>
                                                <SelectTrigger className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
                                                    <SelectItem value="office" className="rounded-xl font-bold text-xs py-2.5">On-Site</SelectItem>
                                                    <SelectItem value="remote" className="rounded-xl font-bold text-xs py-2.5">Remote</SelectItem>
                                                    <SelectItem value="hybrid" className="rounded-xl font-bold text-xs py-2.5">Hybrid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Experience</Label>
                                        <Input id="experienceRequired" required value={formData.experienceRequired} onChange={handleChange} className="h-14 bg-background border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Job Description</Label>
                                        <Textarea id="rolesAndResponsibilities" required value={formData.rolesAndResponsibilities} onChange={handleChange} className="min-h-[160px] bg-background border-border/50 rounded-2xl focus:bg-background focus:ring-2 focus:ring-primary/20 text-sm font-medium p-5 shadow-sm resize-none outline-none" />
                                    </div>
                                    <DialogFooter className="pt-6">
                                        <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3">
                                            <RefreshCw size={18} />
                                            Update Job
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Job Details Dialog — Redesigned */}
                    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <DialogContent className="max-w-5xl max-h-[90vh] bg-card border border-border/40 rounded-[3rem] p-0 overflow-hidden shadow-[0_45px_90px_-20px_rgba(0,0,0,0.25)] outline-none z-[110] flex flex-col">
                            {/* Sticky Header */}
                            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border/30 px-10 py-5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                        <Briefcase size={18} />
                                    </div>
                                    <span className="text-sm font-black text-foreground tracking-tight">Job Details</span>
                                    {selectedJob && (
                                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest border-border/50 text-muted-foreground">
                                            ID: {selectedJob._id.substring(selectedJob._id.length - 8)}
                                        </Badge>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-10 lg:p-12 relative">
                                    <div className="absolute top-0 right-0 w-full h-full bg-primary/[0.02] pointer-events-none" />
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    {selectedJob && (
                                        <div className="relative z-10 space-y-10">
                                            {/* DETAIL HEADER */}
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-10 border-b border-border/40">
                                                <div className="flex gap-6">
                                                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[1.5rem] bg-secondary dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-4xl lg:text-5xl shadow-sm border border-border/60 shrink-0">
                                                        {selectedJob.companyName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="space-y-2.5 min-w-0">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-[0.15em] px-3 py-1 shadow-none rounded-full">
                                                                {selectedJob.domain}
                                                            </Badge>
                                                            <Badge className={`rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest shadow-none border ${selectedJob.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                                                {selectedJob.status}
                                                            </Badge>
                                                        </div>
                                                        <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-snug break-words">{selectedJob.jobTitle}</h2>
                                                        <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                                                            <span className="flex items-center gap-2"><Building size={15} className="text-primary/70" /> {selectedJob.companyName}</span>
                                                            <span className="w-1 h-1 rounded-full bg-border/80 hidden sm:block" />
                                                            <span className="flex items-center gap-2"><MapPin size={15} className="text-primary/70" /> {selectedJob.location || 'Remote'}</span>
                                                            <span className="w-1 h-1 rounded-full bg-border/80 hidden sm:block" />
                                                            <span className="flex items-center gap-2"><Calendar size={13} className="text-muted-foreground/50" /> {new Date(selectedJob.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DETAIL CONTENT GRID: 2/3 + 1/3 */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                                                {/* Left: 2/3 — Rich Content */}
                                                <div className="lg:col-span-2 space-y-8">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.15em] flex items-center gap-3 text-slate-900 dark:text-white">
                                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                                <LayoutPanelLeft size={16} />
                                                            </div>
                                                            Full Job Description
                                                        </h4>
                                                        <div className="bg-secondary/20 dark:bg-slate-900/40 rounded-2xl p-6 lg:p-8 border border-border/40 whitespace-pre-wrap text-sm leading-7 font-medium text-slate-700 dark:text-slate-300 min-h-[200px]">
                                                            {selectedJob.rolesAndResponsibilities}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: 1/3 — Metadata Cards */}
                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <h4 className="text-xs font-black uppercase tracking-[0.15em] flex items-center gap-3 text-slate-900 dark:text-white">
                                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                                                <Zap size={16} />
                                                            </div>
                                                            Key Details
                                                        </h4>
                                                        <div className="bg-card dark:bg-slate-900/60 border border-border/40 rounded-2xl p-6 space-y-5 shadow-sm">
                                                            {[
                                                                { label: 'Salary Range', value: selectedJob.salary, icon: DollarSign, color: 'text-primary' },
                                                                { label: 'Experience', value: selectedJob.experienceRequired, icon: Briefcase, color: 'text-slate-900 dark:text-white' },
                                                                { label: 'Employment', value: selectedJob.jobType, icon: Clock, color: 'text-slate-900 dark:text-white' },
                                                                { label: 'Location Type', value: selectedJob.workMode, icon: Globe, color: 'text-slate-900 dark:text-white' },
                                                            ].map((item, idx) => (
                                                                <div key={idx} className="group/item flex items-center justify-between transition-transform duration-300 hover:translate-x-0.5">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-7 h-7 rounded-lg bg-secondary dark:bg-slate-800 flex items-center justify-center text-muted-foreground/60 group-hover/item:text-primary transition-colors">
                                                                            <item.icon size={13} />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider opacity-60">{item.label}</span>
                                                                    </div>
                                                                    <span className={`text-xs font-black tracking-tight ${item.color} uppercase text-right max-w-[50%] break-words`}>{item.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {selectedJob.openings && (
                                                        <div className="group bg-primary rounded-2xl p-8 flex flex-col items-center justify-center gap-2.5 shadow-xl shadow-primary/20 relative overflow-hidden transition-transform hover:scale-[1.02]">
                                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                            <span className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] leading-none">Active Vacancies</span>
                                                            <span className="text-5xl font-black text-white tracking-tighter leading-none">{selectedJob.openings}</span>
                                                            <div className="mt-2 px-3 py-1 bg-white/10 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/20">
                                                                High Priority
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-card/95 dark:bg-slate-900 shadow-xl p-6 rounded-[2.5rem] border border-border/40">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Jobs</Label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 transition-colors group-focus-within:text-primary" />
                        <Input 
                            placeholder="Search role/company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 pl-11 pr-12 bg-background border-border/50 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all border border-primary/10"
                        >
                            <Search size={14} />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lifecycle Status</Label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Job Type</Label>
                    <select 
                        value={typeFilter} 
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="full-time">Full-Time</option>
                        <option value="part-time">Part-Time</option>
                        <option value="contract">Contract</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Mode</Label>
                    <select 
                        value={modeFilter} 
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                        <option value="all">All Modes</option>
                        <option value="office">On-Site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>
            </div>

            {/* Job Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 size={32} className="text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium">Loading job inventory...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="bg-card border-border/50 border-dashed border-2 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground mb-6">
                        <Briefcase size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No matching jobs found</h3>
                    <p className="text-muted-foreground max-w-sm">Try adjusting filters or search terms to find relevant listings.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 gap-6" : "flex flex-col gap-4"}>
                        {paginatedJobs.map((job) => (
                            viewMode === 'grid' ? (
                                <div key={job._id} className="group bg-card/95 dark:bg-slate-900 border border-border/40 rounded-[2.5rem] p-8 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col lg:flex-row gap-8 items-start lg:items-center relative">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" title="Abstract Background Pattern" />
                                    
                                    {/* Company Branding Container */}
                                    <div className="w-20 h-20 rounded-[1.8rem] bg-secondary dark:bg-slate-900 border border-border/60 flex items-center justify-center text-slate-900 dark:text-white font-black text-3xl group-hover:bg-primary group-hover:text-white shadow-sm transition-all duration-500 z-10 shrink-0">
                                        {job.companyName.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Job Core Details */}
                                    <div className="flex-1 space-y-4 z-10 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 onClick={() => openDetails(job)} className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer leading-none truncate pr-4">{job.jobTitle}</h3>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border shadow-none ${job.status === 'active' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/5 text-rose-600 border-rose-500/20'}`}>
                                                    {job.status}
                                                </Badge>
                                                <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary">
                                                    {job.domain}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-5 text-muted-foreground font-black text-[11px] uppercase tracking-widest">
                                            <span className="flex items-center gap-2.5"><Building size={14} className="text-primary/60" /> {job.companyName}</span>
                                            <span className="hidden md:block w-1 h-1 rounded-full bg-border/60" />
                                            <span className="flex items-center gap-2.5"><MapPin size={14} className="text-primary/60" /> {job.location || 'Remote'}</span>
                                            <span className="hidden md:block w-1 h-1 rounded-full bg-border/60" />
                                            <span className="flex items-center gap-2.5"><Clock size={14} className="text-primary/60" /> {job.jobType}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 pt-1">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 dark:bg-slate-900/40 rounded-xl border border-border/40 shadow-sm transition-colors group-hover:border-primary/10">
                                                <DollarSign size={13} className="text-primary" />
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-widest">{job.salary}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 dark:bg-slate-900/40 rounded-xl border border-border/40 shadow-sm transition-colors group-hover:border-primary/10">
                                                <Briefcase size={13} className="text-primary" />
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-widest">{job.experienceRequired}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 shadow-sm transition-all hover:bg-primary hover:text-white group-hover:shadow-primary/5">
                                                <Globe size={13} className="text-primary group-hover:text-white" />
                                                <span className="text-[11px] font-black text-primary group-hover:text-white tracking-widest uppercase">{job.workMode}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contextual Actions Container */}
                                    <div className="flex flex-col sm:flex-row items-center gap-5 lg:pl-10 lg:border-l border-border/40 z-10 shrink-0 w-full lg:w-auto mt-6 lg:mt-0 justify-between lg:justify-end">
                                        <div className="flex flex-col items-start lg:items-end w-full lg:w-auto">
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-1.5 opacity-60">Date Posted</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                            {(isAdmin || user?.role === 'team_leader') && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        type="button"
                                                        title="Edit Job"
                                                        onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                                                        className="h-10 w-10 rounded-xl bg-secondary/80 hover:bg-primary/10 hover:text-primary border border-border/40 transition-all text-muted-foreground shadow-sm"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        type="button"
                                                        title={job.status === 'active' ? 'Close Job' : 'Reactivate Job'}
                                                        onClick={(e) => { e.stopPropagation(); handleStatusToggle(job); }}
                                                        className={`h-10 w-10 rounded-xl border transition-all shadow-sm ${
                                                            job.status === 'active'
                                                            ? 'bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border-amber-500/20'
                                                            : 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 border-emerald-500/20'
                                                        }`}
                                                    >
                                                        {job.status === 'active' ? <Archive size={16} /> : <RefreshCw size={16} />}
                                                    </Button>
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            type="button"
                                                            title="Delete Job"
                                                            onClick={(e) => { e.stopPropagation(); handleHardDelete(job._id); }}
                                                            className="h-10 w-10 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-500/20 transition-all shadow-sm"
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <Button 
                                                onClick={() => openDetails(job)} 
                                                className="h-12 px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-black/10 transition-all hover:scale-[1.05] active:scale-95 border-0 flex gap-3 group"
                                            >
                                                Explore <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={job._id} className="group bg-card/95 dark:bg-slate-900 border border-border/40 hover:border-primary/30 rounded-[1.5rem] p-4 lg:px-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:shadow-xl hover:shadow-primary/5 text-left">
                                    <div className="flex items-center gap-5 w-full lg:w-4/12">
                                        <div className="w-12 h-12 rounded-xl bg-secondary dark:bg-slate-900 border border-border/60 flex items-center justify-center text-slate-900 dark:text-white font-black text-xl group-hover:bg-primary group-hover:text-white shadow-sm transition-all shrink-0">
                                            {job.companyName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <h3 onClick={() => openDetails(job)} className="text-sm font-black tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer leading-none truncate">{job.jobTitle}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 truncate"><Building size={12} className="text-primary/60" /> {job.companyName}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full lg:w-3/12 flex-wrap text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-lg"><MapPin size={12} /> {job.location || 'Remote'}</div>
                                        <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-lg"><DollarSign size={12} /> {job.salary}</div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full lg:w-2/12">
                                        <Badge variant="outline" className={`rounded-xl px-2 py-0 border text-[9px] font-black uppercase tracking-widest shadow-none h-6 flex items-center ${job.status === 'active' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/5 text-rose-600 border-rose-500/20'}`}>
                                            {job.status}
                                        </Badge>
                                        <span className="text-[9px] font-bold whitespace-nowrap text-muted-foreground/60">{new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                                        {isAdmin && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    title="Edit"
                                                    onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                                                    className="w-9 h-9 rounded-xl bg-secondary hover:bg-primary/10 hover:text-primary text-muted-foreground flex items-center justify-center transition-all outline-none"
                                                >
                                                    <Edit2 size={15} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    title={job.status === 'active' ? 'Archive' : 'Restore'}
                                                    onClick={(e) => { e.stopPropagation(); handleSoftDelete(job._id); }}
                                                    disabled={job.status === 'closed'}
                                                    className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-500/20 flex items-center justify-center transition-all outline-none"
                                                >
                                                    <Archive size={15} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    title="Delete"
                                                    onClick={(e) => { e.stopPropagation(); handleHardDelete(job._id); }}
                                                    className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-500/20 flex items-center justify-center transition-all outline-none"
                                                >
                                                    <Trash2 size={15} />
                                                </Button>
                                            </div>
                                        )}
                                        <Button onClick={() => openDetails(job)} className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-0 group/btn hover:scale-105 active:scale-95 transition-all">
                                            View
                                        </Button>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                    {filteredJobs.length > pageSize && (
                        <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                pageSize={pageSize}
                                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                                totalItems={filteredJobs.length}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobManagement;
