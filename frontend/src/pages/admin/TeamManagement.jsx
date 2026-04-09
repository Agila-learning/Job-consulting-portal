import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { cn } from "@/lib/utils";
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    UserCheck, Building2, Smartphone, Hash,
    Users, RefreshCw, Filter, FileDown, UserPlus,
    Mail, Edit2, Trash2, Search, Shield, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TeamManagement = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('all');
    
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', designation: '', department: 'Consulting', employeeId: '', role: 'employee', branchId: '', commissionPercentage: ''
    });
    const [editFormData, setEditFormData] = useState({
        name: '', email: '', designation: '', department: '', employeeId: '', branchId: '', commissionPercentage: ''
    });

    const [branches, setBranches] = useState([]);
    const [branchFilter, setBranchFilter] = useState('all');

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches');
            setBranches(res.data.data);
        } catch (err) {}
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const roleQuery = user?.role === 'admin' || user?.role === 'team_leader' ? 'employee,team_leader,agent' : 'employee';
            const branchQuery = branchFilter !== 'all' ? `&branchId=${branchFilter}` : '';
            const res = await api.get(`/users?role=${roleQuery}${branchQuery}`);
            setEmployees(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch workforce data');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'all' ? true : emp.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    const handleExport = () => {
        const headers = ['Name', 'Email', 'ID', 'Designation', 'Department', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredEmployees.map(e => [
                e.name, e.email, e.employeeId, e.designation, e.department, e.status
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workforce_directory_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Directory Exported');
    };

    useEffect(() => {
        fetchBranches();
        fetchEmployees();
    }, [branchFilter]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.id]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            let roleLabel = 'Consultant';
            if (formData.role === 'team_leader') roleLabel = 'Team Leader';
            if (formData.role === 'agent') roleLabel = 'Agent Partner';
            
            toast.success(`${roleLabel} provisioned successfully`);
            setIsCreateOpen(false);
            setFormData({ name: '', email: '', password: '', designation: '', department: 'Consulting', employeeId: '', role: 'employee' });
            fetchEmployees();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to provision consultant');
        }
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            designation: user.designation || '',
            department: user.department || '',
            employeeId: user.employeeId || '',
            branchId: user.branchId?._id || user.branchId || '',
            commissionPercentage: user.commissionPercentage || ''
        });
        setIsEditOpen(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/users/${selectedUser._id}`, editFormData);
            toast.success('Consultant profile synchronized');
            setIsEditOpen(false);
            fetchEmployees();
        } catch (err) {
            toast.error('Synchronization failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) {
            try {
                await api.delete(`/users/${id}?hard=true`);
                toast.success('User permanently removed');
                fetchEmployees();
            } catch (err) {
                toast.error('Failed to eliminate user record');
            }
        }
    };

    const columns = [
        {
            header: 'Team Member',
            cell: (row) => {
                const roleColors = {
                    admin: 'border-rose-500/30 text-rose-600 bg-rose-500/5',
                    team_leader: 'border-indigo-500/30 text-indigo-600 bg-indigo-500/5',
                    agent: 'border-violet-500/30 text-violet-600 bg-violet-500/5',
                    employee: 'border-primary/20 text-primary bg-primary/5'
                };
                
                const roleLabels = {
                    admin: 'Administrator',
                    team_leader: 'Team Leader',
                    agent: 'Agent Partner',
                    employee: 'Employee'
                };
                
                return (
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-11 h-11 rounded-2xl border flex items-center justify-center font-black shadow-sm transition-all group-hover:scale-110",
                            roleColors[row.role] || 'bg-secondary/50 border-border/50 text-foreground'
                        )}>
                            {row.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="font-black text-foreground text-sm tracking-tight leading-none truncate max-w-[150px]">{row.name}</p>
                                <Badge variant="outline" className={cn(
                                    "text-[8px] px-1.5 py-0 rounded-md font-black uppercase tracking-tighter",
                                    roleColors[row.role] || 'border-border/50 text-muted-foreground'
                                )}>
                                    {roleLabels[row.role] || row.role}
                                </Badge>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-black flex items-center gap-1 uppercase tracking-[0.2em]">
                                <Hash size={10} className="text-primary/70" /> {row.employeeId || 'NO-ID-ASSOC'}
                            </p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Contact Details',
            cell: (row) => (
                <div className="flex items-center gap-2.5 group/contact">
                    <div className="p-1.5 bg-secondary/50 border border-border/50 rounded-lg text-muted-foreground group-hover/contact:bg-primary/10 group-hover/contact:border-primary/20 group-hover/contact:text-primary transition-colors shadow-sm">
                        <Mail size={12} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-foreground/80 tracking-widest">{row.email}</span>
                </div>
            )
        },
        {
            header: 'Role & Dept',
            cell: (row) => {
                const deptColors = {
                    Consulting: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                    IT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    Engineering: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    Sales: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    Marketing: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    HR: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                    Operations: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                    Finance: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                };
                
                return (
                    <div className="flex flex-col gap-1.5">
                        <Badge variant="outline" className={cn(
                            "rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] shadow-none w-fit",
                            deptColors[row.department] || 'bg-secondary/50 text-muted-foreground border-border/50'
                        )}>
                            {row.department || 'General'}
                        </Badge>
                        <div className="flex items-center gap-1.5 ml-1">
                            <p className="text-[9px] font-black text-foreground/70 uppercase tracking-[0.2em]">{row.designation || 'Specialist'}</p>
                            <span className="text-[9px] text-muted-foreground/30">•</span>
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{row.branchId?.name || 'Local'}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Incentive Structure',
            cell: (row) => (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-foreground tracking-tight">
                        {row.commissionPercentage ? `${row.commissionPercentage}% Override` : 'Global Slab'}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active Policy</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (row) => (
                <Badge className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    row.status === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                    : 'bg-secondary text-muted-foreground border-border/50'
                }`}>
                    {row.status}
                </Badge>
            )
        },
        {
            header: 'Actions',
            cell: (row) => (
                <div className="flex items-center gap-2 transition-opacity">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEdit(row)}
                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-none"
                    >
                        <Edit2 size={14} />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(row._id)}
                        className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-all shadow-none"
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tight leading-none text-shadow-sm" style={{ color: 'var(--section-team)' }}>Our Team</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Active Team
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Manage your team members and their roles.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <Button onClick={handleExport} variant="outline" className="h-12 px-6 rounded-2xl border-border/60 font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                        <FileDown size={18} className="mr-2" />
                        Export Directory
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98]">
                                <UserPlus size={18} className="mr-2" />
                                Add Team Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden focus-visible:ring-0">
                            <div className="p-10 relative overflow-hidden bg-secondary/30 border-b border-border/40">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <DialogHeader className="relative z-10">
                                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4 text-foreground">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                            <UserCheck size={28} />
                                        </div>
                                        <div className="flex flex-col gap-1 items-start">
                                            Add Team Member
                                            <span className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black">Create New User Account</span>
                                        </div>
                                    </DialogTitle>
                                </DialogHeader>
                            </div>
                            
                            <form onSubmit={handleCreate} className="space-y-8 p-6 md:p-10 bg-background/50 relative z-10 w-full overflow-y-auto max-h-[70vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    {user?.role === 'admin' && (
                                        <div className="space-y-3 col-span-1 md:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Role</Label>
                                            <select 
                                                id="role" 
                                                value={formData.role} 
                                                onChange={handleChange} 
                                                className="w-full h-14 pl-4 pr-10 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="team_leader">Team Leader</option>
                                                <option value="agent">Agent Partner</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Full Name</Label>
                                        <Input id="name" required value={formData.name} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="First Last" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</Label>
                                        <Input id="email" type="email" required value={formData.email} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="name@forgeindia.in" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Employee ID</Label>
                                        <Input id="employeeId" required value={formData.employeeId} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="FIC-EMP-00X" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Password</Label>
                                        <Input id="password" type="password" required value={formData.password} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="Temporary Passcode" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Domain / Department</Label>
                                         <select 
                                            id="department" 
                                            value={formData.department} 
                                            onChange={handleChange} 
                                            className="w-full h-14 pl-4 pr-10 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="IT">IT</option>
                                            <option value="BDA">BDA</option>
                                            <option value="Consulting">Consulting</option>
                                            <option value="Credit card">Credit card</option>
                                            <option value="Administration">Administration</option>
                                            <option value="HR">HR</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Banking">Banking</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Custom Incentive %</Label>
                                        <Input id="commissionPercentage" type="number" value={formData.commissionPercentage} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. 5" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Branch Office</Label>
                                        <select 
                                            id="branchId" 
                                            value={formData.branchId} 
                                            onChange={handleChange} 
                                            className="w-full h-14 pl-4 pr-10 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none appearance-none cursor-pointer"
                                            required={user?.role === 'admin'}
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(b => (
                                                <option key={b._id} value={b._id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <DialogFooter className="pt-6 border-t border-border/40">
                                    <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3">
                                        <Shield size={18} />
                                        Create Account
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-[2rem] border border-border/40">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Directory</Label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, or serial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-background border border-border/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-bold outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Branch Hub</Label>
                    <select 
                        value={branchFilter} 
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full h-12 pl-4 pr-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer"
                    >
                        <option value="all">Global (Everywhere)</option>
                        {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department Scope</Label>
                    <select 
                        value={deptFilter} 
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="w-full h-12 pl-4 pr-4 bg-background border border-border/50 rounded-xl text-xs font-bold outline-none transition-all cursor-pointer"
                    >
                        <option value="all">All Departments</option>
                        {Array.from(new Set(employees.map(e => e.department).filter(Boolean))).map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Team Directory */}
            <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl shadow-sm">
                            <Users size={18} />
                        </div>
                        Team Directory
                    </h3>
                </div>
                <DataTable 
                    columns={columns} 
                    data={filteredEmployees} 
                    loading={loading} 
                    emptyMessage={
                        employees.length === 0 
                        ? "The consulting workforce directory is currently unpopulated. Provision your first identity to begin."
                        : "No consulting employees matching the current search parameters."
                    } 
                />
            </div>
            
            {employees.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-20 bg-primary/5 rounded-[3rem] border border-primary/20 border-dashed animate-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-8 shadow-sm">
                        <UserPlus size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-4">Initialize Workforce</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-10 font-medium leading-relaxed">
                        Authorize your internal consulting team to start managing candidate referrals and job mandates within the FIC ecosystem.
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex gap-3">
                        <Shield size={18} />
                        Add Team Member
                    </Button>
                </div>
            )}

            {/* Edit identity Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden focus-visible:ring-0">
                    <div className="p-10 relative overflow-hidden bg-primary/5 border-b border-border/40">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <DialogHeader className="relative z-10">
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4 text-foreground">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                    <Edit2 size={28} />
                                </div>
                                <div className="flex flex-col gap-1 items-start">
                                    Edit Profile
                                    <span className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black">Update User Details</span>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    
                    <form onSubmit={handleEdit} className="space-y-8 p-6 md:p-10 bg-background/50 relative z-10 w-full overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Full Name</Label>
                                <Input id="name" required value={editFormData.name} onChange={handleEditChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</Label>
                                <Input id="email" type="email" required value={editFormData.email} onChange={handleEditChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Employee ID</Label>
                                <Input id="employeeId" required value={editFormData.employeeId} onChange={handleEditChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Domain / Department</Label>
                                 <select 
                                    id="department" 
                                    value={editFormData.department} 
                                    onChange={handleEditChange} 
                                    className="w-full h-14 pl-4 pr-10 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none appearance-none cursor-pointer"
                                >
                                    <option value="IT">IT</option>
                                    <option value="BDA">BDA</option>
                                    <option value="Consulting">Consulting</option>
                                    <option value="Credit card">Credit card</option>
                                    <option value="Administration">Administration</option>
                                    <option value="HR">HR</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Manufacturing">Manufacturing</option>
                                    <option value="Banking">Banking</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Custom Incentive %</Label>
                                <Input id="commissionPercentage" type="number" value={editFormData.commissionPercentage} onChange={handleEditChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. 5" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Branch Office</Label>
                                <select 
                                    id="branchId" 
                                    value={editFormData.branchId} 
                                    onChange={handleEditChange} 
                                    className="w-full h-14 pl-4 pr-10 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none appearance-none cursor-pointer"
                                    required={user?.role === 'admin'}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b._id} value={b._id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-border/40">
                            <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3">
                                <RefreshCw size={18} />
                                Update Profile
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeamManagement;
