import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Users, Briefcase, UserCheck, TrendingUp, 
    ArrowUpRight, Clock, Zap, Wallet, 
    BarChart3, PieChart, Activity, ShieldCheck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area,
    Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import gsap from 'gsap';

const DashboardOverview = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOverview = async () => {
        try {
            const res = await api.get('/dashboard/summary');
            setData(res.data.data);
        } catch (err) {
            console.error('Snapshot synchronization lag');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    useEffect(() => {
        if (!loading && data) {
            gsap.from('.animate-stat', {
                y: 30,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: 'power4.out'
            });
        }
    }, [loading, data]);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-card/20 rounded-[2rem] border border-border/40" />
            ))}
        </div>
    );

    const stats = data?.stats || {};
    const COLORS = ['#0660FC', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

    const renderAdminStats = () => [
        { label: 'Global Workforce', value: stats.users, icon: <Users />, color: 'primary', trend: '+12%' },
        { label: 'Active Inventory', value: stats.totalJobs, icon: <Briefcase />, color: 'emerald', trend: '+5%' },
        { label: 'Talent Inflow', value: stats.totalReferrals, icon: <Activity />, color: 'amber', trend: '+18%' },
        { label: 'Revenue Pool', value: `₹${(stats.totalRevenuePool / 1000).toFixed(1)}k`, icon: <Wallet />, color: 'indigo', trend: '+24%' }
    ];

    const renderTLStats = () => [
        { label: 'Managed Jobs', value: stats.activeJobs, icon: <Zap />, color: 'primary' },
        { label: 'System Pipeline', value: stats.totalPipeline, icon: <Activity />, color: 'amber' },
        { label: 'Team Conversions', value: stats.teamPlacements, icon: <ShieldCheck />, color: 'emerald' },
        { label: 'Equity Value', value: `₹${(stats.managedValue / 1000).toFixed(1)}k`, icon: <TrendingUp />, color: 'indigo' }
    ];

    const renderEmployeeStats = () => [
        { label: 'Assigned Talent', value: stats.assignedCandidates, icon: <UserCheck />, color: 'primary' },
        { label: 'My Submissions', value: stats.mySubmissions, icon: <Activity />, color: 'amber' },
        { label: 'Successful Hires', value: stats.successfulPlacements, icon: <ShieldCheck />, color: 'emerald' },
        { label: 'Unearned Credit', value: `₹${stats.accruedIncentives}`, icon: <Wallet />, color: 'indigo' }
    ];

    const renderAgentStats = () => [
        { label: 'Total Referrals', value: stats.myReferrals, icon: <Users />, color: 'primary' },
        { label: 'Market Access', value: stats.activeJobs, icon: <Briefcase />, color: 'amber' },
        { label: 'Verified Hires', value: stats.successfulPlacements, icon: <ShieldCheck />, color: 'emerald' },
        { label: 'Gross Earnings', value: `₹${stats.totalEarnings}`, icon: <Wallet />, color: 'indigo' }
    ];

    const getRoleStats = () => {
        switch (user?.role) {
            case 'admin': return renderAdminStats();
            case 'team_leader': return renderTLStats();
            case 'employee': return renderEmployeeStats();
            case 'agent': return renderAgentStats();
            default: return [];
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* 1. Metric Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {getRoleStats().map((stat, i) => (
                    <div key={i} className="animate-stat group bg-card/40 backdrop-blur-3xl border border-border/40 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden text-left cursor-default">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000`} />
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 shadow-inner group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                </div>
                                {stat.trend && (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] font-black">{stat.trend}</Badge>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">{stat.label}</p>
                                <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">{stat.value}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Analytical Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Time Series: Talent Inflow */}
                <div className="animate-stat xl:col-span-2 bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 lg:p-10 shadow-sm space-y-8 text-left">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 leading-none">
                                <Activity size={16} className="text-primary" /> Velocity Visualization
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 leading-none">14-Day Talent Acquisition Heartbeat</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-lg border border-primary/20">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Inbound</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <AreaChart data={data?.timeSeries || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0660FC" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#0660FC" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(0,0,0,0.3)' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    hide 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255,255,255,0.95)', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#0660FC" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorCount)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution: Status Breakdown */}
                <div className="animate-stat bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 lg:p-10 shadow-sm space-y-8 flex flex-col text-left">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 leading-none">
                            <PieChart size={16} className="text-primary" /> Lifecycle Mix
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 leading-none">Status Attribution</p>
                    </div>

                    <div className="flex-1 h-[250px] min-h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                            <RePieChart>
                                <Pie
                                    data={data?.statusDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {(data?.statusDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total</p>
                             <h4 className="text-2xl font-black text-foreground tracking-tighter leading-none italic">{data?.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}</h4>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                         {(data?.statusDistribution || []).slice(0, 4).map((entry, index) => (
                             <div key={index} className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                 <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest truncate">{entry.name}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
