import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { 
    User, Mail, Phone, Shield, MapPin, 
    Calendar, Edit3, Save, Camera, 
    CheckCircle2, AlertCircle, BarChart3, 
    TrendingUp, PieChart, DollarSign, 
    Clock, Zap, ChevronRight, 
    Lock, Bell, Globe, LogOut,
    Briefcase, Target, Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalCandidates: 0,
        conversions: 0,
        conversionRate: 0,
        activePipeline: 0,
        interviews: 0
    });
    const [performance, setPerformance] = useState({
        earnings: 0,
        pendingIncentives: 0,
        paidIncentives: 0,
        target: 100000,
        currentMonth: 0
    });

    const [preferences, setPreferences] = useState([
        { id: 'perf', label: 'Dynamic Performance Alerts', status: true },
        { id: 'sec', label: 'Security Login Heartbeat', status: true },
        { id: 'mkt', label: 'Marketing Protocol Sync', status: false },
    ]);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: 'Not Specified',
        specialization: ''
    });

    const fetchProfileData = async () => {
        try {
            const [refRes, incRes] = await Promise.all([
                api.get('/referrals/my-referrals'),
                api.get('/incentives/my-earnings')
            ]);
            
            const refs = refRes.data.data;
            const myStats = {
                totalCandidates: refs.length,
                conversions: refs.filter(r => r.status === 'Joined').length,
                conversionRate: refs.length ? Math.round((refs.filter(r => r.status === 'Joined').length / refs.length) * 100) : 0,
                activePipeline: refs.filter(r => r.status !== 'Joined' && r.status !== 'Rejected').length,
                interviews: refs.filter(r => r.status === 'Shortlisted').length
            };
            setStats(myStats);
            
            // Set performance data based on earnings
            const earnings = incRes.data.data;
            setPerformance({
                earnings: earnings.totalEarned,
                pendingIncentives: earnings.pending,
                paidIncentives: earnings.paid,
                target: 100000,
                currentMonth: earnings.totalEarned > 100000 ? 100 : Math.round((earnings.totalEarned / 100000) * 100)
            });
        } catch (err) {
            console.error('Failed to fetch profile stats');
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const togglePreference = (idx) => {
        const newPrefs = [...preferences];
        newPrefs[idx].status = !newPrefs[idx].status;
        setPreferences(newPrefs);
        toast.success(`${newPrefs[idx].label} updated`);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Future API integration for profile update
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success('Identity node updated successfully');
            setIsEditing(false);
        } catch (err) {
            toast.error('Update protocol failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 text-left">
            {/* HERO PROFILE HEADER */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3.5rem] p-10 md:p-16 shadow-2xl shadow-black/40 group">
                 {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-[800px] h-full bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-primary/30 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-12">
                    <div className="relative group/avatar">
                        <div className="w-44 h-44 rounded-[2.5rem] bg-gradient-to-br from-primary to-indigo-600 p-1.5 shadow-2xl transform transition-transform group-hover/avatar:scale-105 duration-500">
                            <div className="w-full h-full rounded-[2.2rem] bg-slate-900 flex items-center justify-center text-white text-6xl font-black overflow-hidden relative">
                                {user?.name?.charAt(0) || 'U'}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Camera size={32} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-emerald-500 border-4 border-slate-900 flex items-center justify-center text-white shadow-xl animate-pulse">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 text-center lg:text-left">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-2">
                                <Badge className="bg-primary/20 text-primary border-none font-black text-xs px-5 py-1.5 rounded-full uppercase tracking-widest italic">
                                    {user?.role || 'Authorized Consultant'}
                                </Badge>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-[0.2em] italic">
                                    Verified Agent
                                </Badge>
                                <span className="text-[10px] text-white/40 font-black tracking-widest uppercase ml-2 italic">ID: FIC-{user?.id?.substring(0, 8).toUpperCase() || 'SYS-NODE'}</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter italic uppercase leading-none">{user?.name}</h1>
                            <p className="text-white/60 font-medium text-lg lg:max-w-2xl mx-auto lg:mx-0">
                                Senior Talent Acquisition Partner specializing in <span className="text-primary font-black italic">MERN Tech Stack</span> and High-Performance Engineering teams.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4 pb-4">
                            <div className="flex items-center gap-3 text-white/50 text-[11px] font-black uppercase tracking-[0.2em]">
                                <Mail size={16} className="text-primary" /> {user?.email}
                            </div>
                            <div className="flex items-center gap-3 text-white/50 text-[11px] font-black uppercase tracking-[0.2em]">
                                <Phone size={16} className="text-primary" /> {formData.phone}
                            </div>
                            <div className="flex items-center gap-3 text-white/50 text-[11px] font-black uppercase tracking-[0.2em]">
                                <MapPin size={16} className="text-primary" /> {formData.location}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                             <Button 
                                onClick={() => setIsEditing(!isEditing)}
                                className="h-14 px-10 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 border-0"
                            >
                                {isEditing ? <><Save className="mr-3" size={18} /> Sync Changes</> : <><Edit3 className="mr-3" size={18} /> Modify Identity</>}
                            </Button>
                             <Button 
                                variant="outline" 
                                onClick={logout}
                                className="h-14 px-10 bg-transparent border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all shadow-xl shadow-black/10"
                            >
                                <LogOut className="mr-3" size={18} /> Self Service Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* LEFT COLUMN: PERFORMANCE & KYC */}
                <div className="lg:col-span-4 space-y-10">
                    {/* CORE PERFORMANCE HUD */}
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-8 shadow-sm space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="flex items-center justify-between relative z-10">
                            <h3 className="text-xs font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><BarChart3 size={14} /> Performance HUD</h3>
                            <Badge variant="ghost" className="text-[10px] font-black text-emerald-500">Node Robust</Badge>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {[
                                { label: 'Total Handled', value: stats.totalCandidates, icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Total Conversions', value: stats.conversions, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
                                { label: 'Active Pipeline', value: stats.activePipeline, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                { label: 'Vetted Interviews', value: stats.interviews, icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-4 px-6 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-all group/item cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
                                            <stat.icon size={18} />
                                        </div>
                                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                                    </div>
                                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KYC STATUS CARD */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                             <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                <Shield size={24} />
                             </div>
                             <div className="space-y-1">
                                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest italic">Identity Verification</h4>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">KYC Level 2 Cleared</h3>
                             </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                             {[
                                { key: 'Documents', value: 'Verified', color: 'text-emerald-600' },
                                { key: 'Payout Node', value: 'Active', color: 'text-emerald-600' },
                                { key: 'Bank Reconcile', value: 'Complete', color: 'text-emerald-600' }
                             ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center px-2">
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{item.key}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.value}</span>
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: TABS (INCENTIVES, ACTIVITY, SETTINGS) */}
                <div className="lg:col-span-8 space-y-10">
                    <Tabs defaultValue="incentives" className="w-full">
                        <div className="w-full overflow-x-auto pb-4 -mb-4 custom-scrollbar">
                            <TabsList className="h-auto min-h-[64px] min-w-[500px] sm:min-w-0 w-full max-w-[600px] bg-secondary/40 backdrop-blur-xl rounded-2xl p-2 mb-10 border border-border/40 grid grid-cols-3 gap-2">
                                <TabsTrigger value="incentives" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 shadow-sm transition-all italic py-3">Incentive Ledger</TabsTrigger>
                                <TabsTrigger value="activity" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 shadow-sm transition-all italic py-3">Recent Activity</TabsTrigger>
                                <TabsTrigger value="settings" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900 shadow-sm transition-all italic py-3">Identity Settings</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="incentives" className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* EARNINGS GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[
                                    { label: 'Total Bounty Collected', value: performance.earnings, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-500/5' },
                                    { label: 'Pending Disbursement', value: performance.pendingIncentives, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/5' },
                                    { label: 'Asset Finalized', value: performance.paidIncentives, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
                                ].map((box, i) => (
                                    <div key={i} className="animate-card group bg-card/40 backdrop-blur-2xl border border-border/40 hover:border-primary/40 rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all relative text-left duration-500">
                                        <div className={`absolute top-0 right-0 w-24 h-24 ${box.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                                        <div className="flex items-center gap-3 relative z-10">
                                             <div className={`w-10 h-10 rounded-xl ${box.bg} ${box.color} flex items-center justify-center shadow-sm`}>
                                                <box.icon size={18} />
                                             </div>
                                             <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">{box.label}</h4>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none relative z-10 italic">₹{box.value.toLocaleString()}</h3>
                                    </div>
                                ))}
                            </div>

                            {/* PROGRESS TOWARD TARGET */}
                            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-black/40 relative group">
                                <div className="absolute top-0 right-0 w-[500px] h-full bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                                
                                <div className="space-y-10 relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] italic mb-2">Performance Velocity</h4>
                                            <h3 className="text-3xl font-black text-white tracking-tighter italic uppercase leading-none">Monthly Target Advancement</h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-5xl font-black text-white tracking-tighter leading-none italic">{performance.currentMonth}%</span>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mr-1 mt-1">Quota Filled</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/10 shadow-inner">
                                            <div 
                                                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_20px_rgba(6,96,252,0.4)] transition-all duration-1000"
                                                style={{ width: `${performance.currentMonth}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Current: ₹1.25L</span>
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Target: ₹2.00L</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PIPELINE SNAPSHOT */}
                            <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-10 shadow-sm space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] italic mb-2">Operational Grid</h4>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Active Pipeline Snapshot</h3>
                                    </div>
                                    <Button variant="ghost" className="h-10 text-[10px] uppercase font-black tracking-widest hover:text-primary gap-2">Full View <ChevronRight size={14} /></Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { name: 'Aditya Varma', stage: 'Technical Screening', date: '2 hours ago', score: 88, color: 'emerald' },
                                        { name: 'Neha Sharma', stage: 'Final Leadership', date: 'Today, 10:45 AM', score: 94, color: 'emerald' },
                                        { name: 'Rohit Khanna', stage: 'Shortlisted', date: 'Yesterday', score: 72, color: 'blue' },
                                        { name: 'Sanya Malhotra', stage: 'Waitlisted', date: '2 days ago', score: 45, color: 'amber' },
                                    ].map((candidate, i) => (
                                        <div key={i} className="p-6 bg-secondary/20 border border-border/60 rounded-[2rem] hover:border-primary/20 transition-all flex items-center justify-between group/row">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm group-hover/row:bg-primary transition-colors">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight leading-none group-hover/row:text-primary transition-colors italic uppercase">{candidate.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-${candidate.color}-500`} />
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{candidate.stage}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={`bg-${candidate.color}-500/10 text-${candidate.color}-600 border-none font-black text-[9px] px-3`}>{candidate.score}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-10 shadow-sm space-y-10">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em] italic mb-2">Audit Logs</h4>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Global Activity Stream</h3>
                                </div>

                                <div className="space-y-0 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border/60">
                                    {[
                                        { action: 'Identity Updated', desc: 'Modified profile settings and contact details.', time: '2 mins ago', icon: User, color: 'blue' },
                                        { action: 'Candidate Shortlisted', desc: 'Aditya Varma advanced to Tech Screen phase.', time: '45 mins ago', icon: Target, color: 'emerald' },
                                        { action: 'Bounty Reconciled', desc: 'Settlement for Senior Engineer placement cleared.', time: '3 hours ago', icon: Award, color: 'primary' },
                                        { action: 'System Login', desc: 'New session initiated via Chrome/Windows Node.', time: '6 hours ago', icon: Zap, color: 'slate' },
                                        { action: 'KYC Document Upload', desc: 'Identity verification phase complete.', time: 'Yesterday', icon: Shield, color: 'emerald' },
                                    ].map((act, i) => (
                                        <div key={i} className="relative pl-14 pb-10 last:pb-0 group/stream">
                                             <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center group-hover/stream:border-primary/40 group-hover/stream:shadow-lg transition-all z-10`}>
                                                <act.icon size={16} className={`text-${act.color === 'primary' ? 'primary' : act.color + '-600'}`} />
                                             </div>
                                             <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight italic uppercase">{act.action}</h4>
                                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{act.time}</span>
                                                </div>
                                                <p className="text-[12px] font-medium text-muted-foreground leading-relaxed">{act.desc}</p>
                                             </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                                {/* IDENTITY SETTINGS */}
                                <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-6 lg:p-10 shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 rounded-2xl bg-secondary/40 flex items-center justify-center text-primary border border-border/60 shadow-sm">
                                            <Edit3 size={24} />
                                         </div>
                                         <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Node</h4>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Identity Access</h3>
                                         </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Full Legal Identity</Label>
                                            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 bg-secondary/10 border-border/40 rounded-2xl font-bold text-xs shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Communication Channel</Label>
                                            <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 bg-secondary/10 border-border/40 rounded-2xl font-bold text-xs shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">Verified Phone</Label>
                                            <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-14 bg-secondary/10 border-border/40 rounded-2xl font-bold text-xs shadow-inner" />
                                        </div>
                                        <Button className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 border-0">Commit Updates</Button>
                                    </div>
                                </div>

                                {/* SECURITY & PREFERENCES */}
                                <div className="space-y-10">
                                    <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[3rem] p-10 shadow-sm space-y-6 group">
                                         <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/20 flex items-center justify-center shadow-sm">
                                                <Lock size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Protocol Buffer</h4>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Access Security</h3>
                                            </div>
                                         </div>
                                         <p className="text-[12px] font-medium text-muted-foreground leading-relaxed px-1 group-hover:text-amber-500 transition-colors">You last changed your password <span className="font-black italic">14 days ago</span>. We recommend quarterly resets.</p>
                                         <Button variant="outline" className="w-full h-14 bg-transparent border-rose-500/20 text-rose-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">Password Update Protocol</Button>
                                    </div>

                                    <div className="bg-slate-900 rounded-[3rem] p-6 lg:p-10 space-y-8 shadow-2xl shadow-black/40 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                                                <Bell size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Signal Hub</h4>
                                                <h3 className="text-xl font-black text-white tracking-tight italic uppercase">Notification Mesh</h3>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 relative z-10">
                                            {preferences.map((pref, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => togglePreference(i)}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group/row hover:bg-white/10 transition-all cursor-pointer"
                                                >
                                                    <span className="text-[11px] font-black text-white/70 uppercase tracking-widest group-hover/row:text-white transition-colors">{pref.label}</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${pref.status ? 'bg-primary' : 'bg-white/10'}`}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${pref.status ? 'right-1' : 'left-1'}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
