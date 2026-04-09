import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
    Zap, PlusCircle, Trophy, Target, 
    Gift, TrendingUp, Filter, Trash2,
    ShieldCheck, Star, Award, Crown,
    ArrowUpRight, ListFilter, LayoutGrid, Clock,
    DollarSign, Users, UserCheck, Network, RefreshCcw,
    Focus, Wallet
} from 'lucide-react';

const IncentiveDashboard = () => {
    const [slabs, setSlabs] = useState([]);
    const [manualGrants, setManualGrants] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isGrantOpen, setIsGrantOpen] = useState(false);
    const [referrals, setReferrals] = useState([]);
    const [selectedUserStats, setSelectedUserStats] = useState(null);
    const [activeMainTab, setActiveMainTab] = useState('rules'); // Changed default
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [branches, setBranches] = useState([]);
    const [rules, setRules] = useState([]);
    const [logs, setLogs] = useState([]);
    const [payouts, setPayouts] = useState([]);
    
    // Slab Form
    const [formData, setFormData] = useState({
        title: '',
        targetType: 'individual',
        domain: 'IT',
        userRole: 'employee',
        thresholds: [
            { count: 1, rewardType: 'cash', rewardValue: '', description: '' }
        ]
    });

    // Manual Grant Form
    const [grantData, setGrantData] = useState({
        recipient: '',
        amount: '',
        type: 'individual',
        reason: ''
    });
    const [activeGrantTab, setActiveGrantTab] = useState('consultants');

    // Filtered user lists by role
    const employees = users.filter(u => u.role === 'employee');
    const agents = users.filter(u => u.role === 'agent');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [slabRes, grantRes, userRes, refRes, branchRes, ruleRes, logRes, payoutRes] = await Promise.all([
                api.get('/incentives'),
                api.get('/incentives/grants'),
                api.get('/users?role=employee&role=agent'),
                api.get('/referrals'),
                api.get('/branches'),
                api.get('/incentives/rules'),
                api.get(`/incentives/logs?branchId=${selectedBranch}`),
                api.get(`/incentives/payouts?branchId=${selectedBranch}`)
            ]);
            setSlabs(slabRes.data.data);
            setManualGrants(grantRes.data.data);
            setUsers(userRes.data.data);
            setReferrals(refRes.data.data);
            setBranches(branchRes.data.data);
            setRules(ruleRes.data.data);
            setLogs(logRes.data.data);
            setPayouts(payoutRes.data.data);
        } catch (err) {
            toast.error('Failed to sync incentive data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBranch]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleThresholdChange = (index, field, value) => {
        const updated = [...formData.thresholds];
        updated[index][field] = value;
        setFormData({ ...formData, thresholds: updated });
    };

    const addThreshold = () => {
        setFormData({
            ...formData,
            thresholds: [...formData.thresholds, { count: '', rewardType: 'cash', rewardValue: '', description: '' }]
        });
    };

    const removeThreshold = (index) => {
        const updated = formData.thresholds.filter((_, i) => i !== index);
        setFormData({ ...formData, thresholds: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/incentives', formData);
            toast.success('Incentive slab published successfully');
            setIsCreateOpen(false);
            setFormData({
                title: '',
                targetType: 'individual',
                domain: 'IT',
                userRole: 'employee',
                thresholds: [{ count: 1, rewardType: 'cash', rewardValue: '', description: '' }]
            });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to publish slab');
        }
    };

    const handleGrantTabChange = (tab) => {
        setActiveGrantTab(tab);
        const typeMap = { consultants: 'individual', teamwide: 'team', agents: 'agent' };
        setGrantData({ ...grantData, recipient: '', type: typeMap[tab] });
    };

    const handleGrantSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/incentives/grant', grantData);
            toast.success('Bounty granted successfully');
            setIsGrantOpen(false);
            setGrantData({ recipient: '', amount: '', type: 'individual', reason: '' });
            setActiveGrantTab('consultants');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to authorize grant');
        }
    };

    const handleStatusUpdate = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
            await api.patch(`/incentives/grants/${id}`, { status: newStatus });
            toast.success(`Incentive status marked as ${newStatus}`);
            fetchData();
        } catch (err) {
            toast.error('Failed to synchronize status update');
        }
    };

    const calculateUserStats = (userId) => {
        const userReferrals = referrals.filter(r => r.referrer === userId);
        const joinedCount = userReferrals.filter(r => r.status === 'Joined').length;
        const totalEarned = manualGrants
            .filter(g => g.recipient?._id === userId && g.status === 'paid')
            .reduce((acc, curr) => acc + curr.amount, 0);
        
        setSelectedUserStats({
            userId,
            count: joinedCount,
            earned: totalEarned,
            totalReferrals: userReferrals.length
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Deactivate this incentive slab?')) {
            try {
                await api.delete(`/incentives/${id}`);
                toast.success('Slab deactivated');
                fetchData();
            } catch (err) {
                toast.error('Failed to remove slab');
            }
        }
    };

    const columns = [
        {
            header: 'Incentive Program',
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-all font-black shadow-sm">
                        {row.targetType === 'individual' ? <Target size={18} /> : <Crown size={18} />}
                    </div>
                    <div>
                        <p className="font-black text-foreground text-sm tracking-tight leading-none mb-1.5">{row.title}</p>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[8px] font-black uppercase tracking-[0.2em] bg-secondary/30 border-border/50 text-muted-foreground shadow-none">
                                {row.domain}
                            </Badge>
                             <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[8px] font-black uppercase tracking-[0.2em] bg-primary/5 border-primary/20 text-primary shadow-none">
                                {row.userRole}s
                            </Badge>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Scaling Thresholds',
            cell: (row) => (
                <div className="flex flex-wrap gap-2">
                    {row.thresholds.map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5 p-1 px-2.5 bg-background border border-border/50 rounded-lg shadow-none group/t transition-all hover:border-primary/30">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{t.count}x</span>
                            <span className="w-1 h-3 rounded-full bg-border group-hover/t:bg-primary/30 transition-colors" />
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">₹{t.rewardValue}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'Inbound Logic',
            cell: (row) => (
                <Badge variant="outline" className="h-6 rounded-xl px-2.5 text-[9px] font-black uppercase tracking-widest bg-secondary text-muted-foreground border-border/50 shadow-none">
                    {row.targetType === 'individual' ? 'Solo Target' : 'Team Volume'}
                </Badge>
            )
        },
        {
            header: 'Governance',
            cell: (row) => (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(row._id)}
                        className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all shadow-none"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        }
    ];

    const grantTypeLabels = { individual: 'Consultant', team: 'Team Grant', agent: 'Agent' };

    const manualColumns = [
        {
            header: 'Recipient',
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                        {row.type === 'team' ? <Users size={16} /> : row.type === 'agent' ? <UserCheck size={16} /> : row.recipient?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-black text-foreground text-sm tracking-tight leading-none mb-1">{row.type === 'team' ? 'Entire Partner Network' : row.recipient?.name}</p>
                        <Badge className="text-[8px] font-black uppercase tracking-widest bg-secondary/50 text-muted-foreground shadow-none border-0">
                            {grantTypeLabels[row.type] || row.type} Payout
                        </Badge>
                    </div>
                </div>
            )
        },
        {
            header: 'Bounty Reason',
            cell: (row) => (
                <p className="text-xs font-medium text-muted-foreground line-clamp-1 max-w-[200px]">{row.reason}</p>
            )
        },
        {
            header: 'Authorized Amount',
            cell: (row) => (
                <span className="text-sm font-black text-emerald-600">₹{row.amount.toLocaleString()}</span>
            )
        },
        {
            header: 'Status',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${row.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {row.status}
                    </Badge>
                    <Button 
                        onClick={() => handleStatusUpdate(row._id, row.status)}
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg bg-secondary/30 hover:bg-primary/10 hover:text-primary transition-all shadow-none"
                    >
                        <RefreshCcw size={12} className={row.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tight leading-none text-shadow-sm">Referral Rewards</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Active Rewards
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Manage how rewards are given for successful candidate referrals.</p>
                </div>

                <div className="flex-none flex items-center gap-4">
                    <select 
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="h-12 px-4 rounded-2xl border border-border/40 bg-background/50 font-bold text-[11px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        <option value="all">All Branches</option>
                        {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))}
                    </select>

                    <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-12 px-6 rounded-2xl border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all">
                                <Zap size={16} className="mr-2" /> Send Manual Reward
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border/40 rounded-[3rem] p-0 shadow-2xl focus-visible:ring-0">
                            <div className="p-8 pb-0 border-b border-border/40 bg-secondary/20">
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <Trophy size={20} />
                                    </div>
                                    Send a Manual Reward
                                </h2>
                                {/* Tab Navigation */}
                                <Tabs value={activeGrantTab} onValueChange={handleGrantTabChange}>
                                    <TabsList className="w-full bg-transparent gap-0 p-0 h-auto rounded-none border-b-0">
                                        {[
                                            { value: 'consultants', label: 'Consultants', icon: Target },
                                            { value: 'teamwide', label: 'Team-Wide', icon: Users },
                                            { value: 'agents', label: 'External Agents', icon: UserCheck },
                                        ].map((tab) => (
                                            <TabsTrigger
                                                key={tab.value}
                                                value={tab.value}
                                                className={`flex-1 h-12 rounded-none border-b-2 text-[10px] font-black uppercase tracking-widest transition-all gap-2 ${
                                                    activeGrantTab === tab.value
                                                        ? 'border-primary text-primary bg-transparent'
                                                        : 'border-transparent text-muted-foreground hover:text-foreground bg-transparent'
                                                }`}
                                            >
                                                <tab.icon size={14} />
                                                {tab.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>
                            <form onSubmit={handleGrantSubmit} className="p-8 space-y-6">
                                {/* Consultant Tab: select from employees */}
                                {activeGrantTab === 'consultants' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Consultant</Label>
                                        <select 
                                            value={grantData.recipient} 
                                            onChange={(e) => setGrantData({...grantData, recipient: e.target.value})}
                                            className="w-full h-14 bg-background border border-border/50 rounded-2xl px-4 font-bold text-sm outline-none"
                                            required
                                        >
                                            <option value="">Choose Employee...</option>
                                            {employees.map(u => (
                                                <option key={u._id} value={u._id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Team Tab: no recipient needed */}
                                {activeGrantTab === 'teamwide' && (
                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground tracking-tight">Team-Wide Distribution</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">This bounty will be applied to all active team members.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Agent Tab: select from agents */}
                                {activeGrantTab === 'agents' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select External Agent</Label>
                                        <select 
                                            value={grantData.recipient} 
                                            onChange={(e) => setGrantData({...grantData, recipient: e.target.value})}
                                            className="w-full h-14 bg-background border border-border/50 rounded-2xl px-4 font-bold text-sm outline-none"
                                            required
                                        >
                                            <option value="">Choose Agent...</option>
                                            {agents.map(u => (
                                                <option key={u._id} value={u._id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bounty Amount (₹)</Label>
                                    <Input 
                                        type="number" 
                                        value={grantData.amount} 
                                        onChange={(e) => setGrantData({...grantData, amount: e.target.value})} 
                                        className="h-14 bg-background border-border/50 rounded-2xl font-black text-lg" 
                                        placeholder="0.00" 
                                        required 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Grant Reason</Label>
                                    <Input 
                                        value={grantData.reason} 
                                        onChange={(e) => setGrantData({...grantData, reason: e.target.value})} 
                                        className="h-14 bg-background border-border/50 rounded-2xl font-medium" 
                                        placeholder={activeGrantTab === 'agents' ? 'e.g. Referral bonus for 5 placements' : 'e.g. Performance bonus for Q1'} 
                                        required 
                                    />
                                </div>

                                <Button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl mt-4 text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                                    <Zap size={16} className="mr-2" />
                                    Issue {activeGrantTab === 'teamwide' ? 'Team' : activeGrantTab === 'agents' ? 'Agent' : 'Consultant'} Bounty
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-8 bg-primary hover:bg-primary/95 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98]">
                                <PlusCircle size={18} className="mr-2.5" /> Set Up Reward Rules
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] focus-visible:ring-0">
                            <div className="p-10 relative overflow-hidden bg-secondary/30 border-b border-border/40">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                
                                <DialogHeader className="relative z-10">
                                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4 text-foreground">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                            <Awards size={28} />
                                        </div>
                                        <div className="flex flex-col gap-1 items-start">
                                            Reward Level Setup
                                            <span className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black">Configure Bonus Rules</span>
                                        </div>
                                    </DialogTitle>
                                </DialogHeader>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-10 bg-background/50 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-border/30">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Who is it for?</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Button 
                                                type="button"
                                                variant="outline"
                                                onClick={() => setFormData({...formData, targetType: 'individual'})}
                                                className={`h-14 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold ${formData.targetType === 'individual' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border/50 text-muted-foreground hover:bg-secondary/50'}`}
                                            >
                                                <Target size={18} /> Just Me
                                            </Button>
                                            <Button 
                                                type="button"
                                                variant="outline"
                                                onClick={() => setFormData({...formData, targetType: 'team'})}
                                                className={`h-14 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold ${formData.targetType === 'team' ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-background border-border/50 text-muted-foreground hover:bg-secondary/50'}`}
                                            >
                                                <Crown size={18} /> Team Based
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Reward Program Name</Label>
                                        <Input id="title" required value={formData.title} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. Q4 Performance Reward" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Domain Context</Label>
                                        <select value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} className="w-full h-14 px-4 bg-background border border-border/50 rounded-2xl text-xs font-bold outline-none cursor-pointer shadow-sm">
                                            <option value="IT">IT (Software)</option>
                                            <option value="Non-IT">Non-IT (Core)</option>
                                            <option value="Executive">Executive</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Target Group</Label>
                                        <select value={formData.userRole} onChange={(e) => setFormData({...formData, userRole: e.target.value})} className="w-full h-14 px-4 bg-background border border-border/50 rounded-2xl text-xs font-bold outline-none cursor-pointer shadow-sm">
                                            <option value="employee">Consultants</option>
                                            <option value="agent">External Agents</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                            <TrendingUp size={14} className="text-primary/70" /> Reward Thresholds
                                        </h4>
                                        <Button type="button" onClick={addThreshold} variant="ghost" className="h-8 px-3 rounded-lg text-primary bg-primary/5 hover:bg-primary/10 font-black text-[9px] uppercase tracking-widest gap-2">
                                            <PlusCircle size={14} /> Add Tier
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.thresholds.map((tier, idx) => (
                                            <div key={idx} className="p-6 bg-card border border-border/50 rounded-2xl flex flex-col md:flex-row gap-6 items-center group shadow-sm transition-all hover:border-primary/20">
                                                <div className="w-full md:w-32 space-y-2 flex-shrink-0">
                                                    <Label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em]">Joined Target</Label>
                                                    <Input type="number" value={tier.count} onChange={(e) => handleThresholdChange(idx, 'count', e.target.value)} required className="h-12 bg-background border-border/50 rounded-xl font-black text-center" placeholder="5" />
                                                </div>
                                                <div className="flex-1 space-y-2 w-full">
                                                    <Label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em]">Bounty Value (₹)</Label>
                                                    <div className="relative">
                                                        <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                        <Input value={tier.rewardValue} onChange={(e) => handleThresholdChange(idx, 'rewardValue', e.target.value)} required className="h-12 pl-10 bg-background border-border/50 rounded-xl font-bold" placeholder="5,000" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2 w-full">
                                                    <Label className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em]">Description / Benefits</Label>
                                                    <Input value={tier.description} onChange={(e) => handleThresholdChange(idx, 'description', e.target.value)} className="h-12 bg-background border-border/50 rounded-xl text-xs font-semibold" placeholder="Bonus on 5 successful joining..." />
                                                </div>
                                                {formData.thresholds.length > 1 && (
                                                    <Button type="button" onClick={() => removeThreshold(idx)} variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-500/5 transition-colors shadow-none shrink-0 self-end md:self-center translate-y-1.5">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <DialogFooter className="pt-6">
                                    <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3">
                                        <Zap size={18} />
                                        Save Reward Rules
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Active Slabs', value: slabs.length, icon: LayoutGrid, color: 'text-primary bg-primary/10 border-primary/20' },
                    { label: 'Manual Grants', value: manualGrants.length, icon: Zap, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Team Targets', value: slabs.filter(s => s.targetType === 'team').length, icon: Crown, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
                    { label: 'Direct Value', value: `₹${manualGrants.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, icon: DollarSign, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' }
                ].map((stat, i) => (
                    <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 shadow-sm transition-all hover:border-border/60 hover:shadow-md group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl border ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <ArrowUpRight size={14} className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-black text-foreground tracking-tight">{stat.value}</h4>
                    </div>
                ))}
            </div>

            <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-8">
                <TabsList className="bg-secondary/30 p-1.5 rounded-[2rem] border border-border/20 w-full md:w-fit h-auto flex flex-wrap">
                    <TabsTrigger value="rules" className="rounded-2xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex-1">
                        <Target size={16} /> Auto Rules
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="rounded-2xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex-1">
                        <Clock size={16} /> Incentive Logs
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="rounded-2xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex-1">
                        <Wallet size={16} /> Payouts
                    </TabsTrigger>
                    <TabsTrigger value="slabs" className="rounded-2xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex-1">
                        <ListFilter size={16} /> Target Slabs
                    </TabsTrigger>
                    <TabsTrigger value="grants" className="rounded-2xl px-8 py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex-1">
                        <Zap size={16} /> Manual Grants
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="mt-0">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl shadow-sm">
                                    <Target size={18} /> Automated Incentive Rules
                                </div>
                            </h3>
                        </div>
                        <DataTable 
                            columns={[
                                { header: 'Target Role', cell: (row) => <Badge className="uppercase">{row.role}</Badge> },
                                { header: 'Event', cell: (row) => <Badge variant="outline">{row.event}</Badge> },
                                { header: 'Amount', cell: (row) => <span className="font-black text-emerald-600">₹{row.amount}</span> },
                                { header: 'Status', cell: (row) => <Badge className={row.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}>{row.status}</Badge> }
                            ]} 
                            data={rules} 
                            loading={loading} 
                            emptyMessage="No auto-rules configured." 
                        />
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-0">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl shadow-sm">
                                    <Clock size={18} /> Generated Incentives
                                </div>
                            </h3>
                        </div>
                        <DataTable 
                            columns={[
                                { header: 'User', accessor: 'user.name' },
                                { header: 'Referral', accessor: 'referral.candidateName' },
                                { header: 'Event', cell: (row) => <Badge variant="outline">{row.event}</Badge> },
                                { header: 'Value', cell: (row) => <span className="font-black text-emerald-600">₹{row.amount}</span> },
                                { header: 'Date', cell: (row) => new Date(row.createdAt).toLocaleDateString() },
                                { header: 'Status', cell: (row) => <Badge>{row.status}</Badge> }
                            ]} 
                            data={logs} 
                            loading={loading} 
                            emptyMessage="No incentive logs found." 
                        />
                    </div>
                </TabsContent>

                <TabsContent value="payouts" className="mt-0">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl shadow-sm">
                                    <Wallet size={18} /> Disbursement Ledger
                                </div>
                            </h3>
                        </div>
                        <DataTable 
                            columns={[
                                { header: 'Recipient', accessor: 'user.name' },
                                { header: 'Total Value', cell: (row) => <span className="font-black">₹{row.amount}</span> },
                                { header: 'Date', cell: (row) => row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : 'Pending' },
                                { header: 'Status', cell: (row) => (
                                    <Badge className={row.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}>
                                        {row.status}
                                    </Badge>
                                )}
                            ]} 
                            data={payouts} 
                            loading={loading} 
                            emptyMessage="No payouts recorded." 
                        />
                    </div>
                </TabsContent>

                <TabsContent value="slabs" className="mt-0">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl shadow-sm">
                                    <ListFilter size={18} />
                                </div>
                                Slab Repository
                            </h3>
                        </div>
                        <DataTable 
                            columns={columns} 
                            data={slabs} 
                            loading={loading} 
                            emptyMessage="Configure logic to initialize slabs." 
                        />
                    </div>
                </TabsContent>

                <TabsContent value="grants" className="mt-0">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                            <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl shadow-sm">
                                    <Zap size={18} />
                                </div>
                                Sent Rewards
                            </h3>
                        </div>
                        <DataTable 
                            columns={manualColumns} 
                            data={manualGrants} 
                            loading={loading} 
                            emptyMessage="No manual rewards sent yet." 
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* PERFORMANCE HUB */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-border/30 bg-secondary/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-xl shadow-sm">
                                    <Trophy size={18} />
                                </div>
                                Performance Analytics Hub
                            </h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-11">Visualize individual conversion logic</p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:block">Select Member</Label>
                            <select 
                                onChange={(e) => calculateUserStats(e.target.value)}
                                className="flex-1 md:w-64 h-12 bg-background border border-border/50 rounded-xl px-4 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Choose Team Member...</option>
                                <optgroup label="Consultants">
                                    {employees.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </optgroup>
                                <optgroup label="External Agents">
                                    {agents.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                </optgroup>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-10">
                    {selectedUserStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5 duration-700">
                             <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2rem] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <UserCheck size={20} />
                                    </div>
                                    <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black tracking-widest px-3">CONVERSIONS</Badge>
                                </div>
                                <div>
                                    <h4 className="text-4xl font-black text-foreground tracking-tighter">{selectedUserStats.count}</h4>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic">Successful Placements</p>
                                </div>
                            </div>

                            <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <Wallet size={20} />
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-600 border-none text-[9px] font-black tracking-widest px-3">CAPITAL EARNED</Badge>
                                </div>
                                <div>
                                    <h4 className="text-4xl font-black text-emerald-600 tracking-tighter">₹{selectedUserStats.earned.toLocaleString()}</h4>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic">Total Disbursed Incentives</p>
                                </div>
                            </div>

                            <div className="p-8 bg-purple-500/5 border border-purple-500/20 rounded-[2rem] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <TrendingUp size={20} />
                                    </div>
                                    <Badge className="bg-purple-500/20 text-purple-600 border-none text-[9px] font-black tracking-widest px-3">PIPELINE VOLUME</Badge>
                                </div>
                                <div>
                                    <h4 className="text-4xl font-black text-purple-600 tracking-tighter">{selectedUserStats.totalReferrals}</h4>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic">Total Candidates Registered</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border/40 rounded-[2rem] bg-secondary/5">
                            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground opacity-20">
                                <Focus size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-muted-foreground tracking-tight italic">Select a team member to fetch performance audit</p>
                                <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-2 italic">Data spans across entire historical timeline</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... existing Awards icon and export ...


// Simple Awards icon since Award name might conflict
const Awards = ({ size }) => <Trophy size={size} />;

export default IncentiveDashboard;
