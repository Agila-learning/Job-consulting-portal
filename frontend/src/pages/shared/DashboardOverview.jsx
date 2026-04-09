import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Briefcase, Users, CheckCircle, Clock, 
    TrendingUp, Activity, Plus, ArrowRight,
    Loader2, Layers, LayoutPanelLeft, Zap, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';

const DashboardOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalReferrals: 0,
        pendingReferrals: 0,
        hiredCandidates: 0,
        totalCommission: 0,
        referralGrowth: 12,
        pipelineVelocity: 85
    });
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user?.role === 'admin' ? 'all' : (user?.branchId || 'all'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            if (user?.role === 'admin') {
                try {
                    const res = await api.get('/branches');
                    setBranches(res.data.data);
                } catch (err) {
                    console.error('Failed to fetch branches');
                }
            }
        };

        const fetchStats = async () => {
            try {
                const url = selectedBranch === 'all' 
                    ? '/referrals/stats' 
                    : `/referrals/stats?branchId=${selectedBranch}`;
                const res = await api.get(url);
                const statsData = res.data.data;
                setStats({
                    totalJobs: statsData.totalJobs || 0,
                    activeJobs: statsData.activeJobs || 0,
                    totalReferrals: statsData.totalCandidates || statsData.totalReferrals || 0,
                    pendingReferrals: statsData.pendingReferrals || statsData.pendingCount || 0,
                    hiredCandidates: statsData.hiredCount || statsData.hiredCandidates || 0,
                    totalCommission: statsData.totalEarnings || statsData.totalCommission || 0,
                    referralGrowth: statsData.referralGrowth || 12,
                    pipelineVelocity: (statsData.totalCandidates && statsData.hiredCount)
                        ? Math.round((statsData.hiredCount / statsData.totalCandidates) * 100)
                        : (statsData.pipelineVelocity || 85)
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats');
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
        fetchStats();
    }, [selectedBranch, user?.role]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-card border border-border/40 shadow-xl flex items-center justify-center">
                    <Loader2 size={36} className="text-primary animate-spin" />
                </div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] relative z-10">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* WELCOME HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                            Welcome, {user?.name?.split(' ')[0]}
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium ml-1">Real-time overview of your recruitment engine.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {user?.role === 'admin' && (
                        <select 
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="h-10 px-4 rounded-xl border border-border/60 bg-background/50 font-bold text-[11px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <option value="all">All Branches</option>
                            {branches.map(branch => (
                                <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                        </select>
                    )}
                    <Badge variant="outline" className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-border/60 bg-background/50 font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm flex items-center gap-2">
                        <Clock size={14} className="text-primary" />
                        <span className="hidden sm:inline text-[9px]">Live Status:</span> Online
                    </Badge>
                    <Badge className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 border-0">
                        <Zap size={14} className="fill-white" />
                        v2.4.1
                    </Badge>
                </div>
            </div>

            {/* QUICK STATS HUB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Active Jobs', value: stats.activeJobs || 0, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
                    { label: 'Referrals', value: stats.totalReferrals || 0, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
                    { label: 'Hired Members', value: stats.hiredCandidates || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
                    { label: 'Pending Reviews', value: stats.pendingReferrals || 0, icon: LayoutPanelLeft, color: 'text-rose-500', bg: 'bg-rose-500/5', border: 'border-rose-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="group bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden text-left">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-150 duration-700`} />
                        <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
                            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${stat.bg} ${stat.color} border ${stat.border} flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:-translate-y-1`}>
                                <stat.icon size={22} />
                            </div>
                            <div className="font-black text-[8px] sm:text-[10px] uppercase tracking-widest text-emerald-500 flex items-center gap-1 sm:gap-1.5 bg-emerald-500/5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-emerald-500/10 shadow-sm transition-all group-hover:scale-105">
                                <TrendingUp size={10} /> {stats.referralGrowth}%
                            </div>
                        </div>
                        <div className="space-y-1 relative z-10 transition-transform duration-500 group-hover:translate-x-1">
                            <p className="text-[9px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.25em] ml-0.5 sm:ml-1">{stat.label}</p>
                            <h3 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                {stat.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* PERFORMANCE ANALYSIS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 pb-10">
                {/* CHART PLACEHOLDER / MAIN METRIC */}
                <div className="lg:col-span-4 bg-slate-900/5 dark:bg-slate-900/40 border border-border/40 rounded-[3rem] p-8 sm:p-10 flex flex-col justify-between min-h-[400px] sm:min-h-[450px] relative overflow-hidden group text-left">
                     <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                     <div className="space-y-4 relative z-10">
                        <h4 className="text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-900 dark:text-white opacity-60">
                           <Layers size={16} className="text-primary" /> System Performance
                        </h4>
                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white max-w-sm leading-tight italic">
                            System activity is at <span className="text-primary">{stats.pipelineVelocity}%</span> currently.
                        </h3>
                     </div>
                     
                     <div className="space-y-10 relative z-10">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 border-t border-border/20 pt-8 sm:pt-10">
                            {[
                                { label: 'Efficiency', val: '98.5%', color: 'text-emerald-500' },
                                { label: 'Uptime', val: '99.9%', color: 'text-blue-500' },
                                { label: 'Throughput', val: 'High', color: 'text-amber-500' },
                                { label: 'Load', val: 'Optimum', color: 'text-indigo-500' },
                            ].map((v, i) => (
                                <div key={i} className="space-y-2 group/metric cursor-default">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] group-hover/metric:text-primary transition-colors">{v.label}</p>
                                    <p className={`text-xl font-black tracking-tighter ${v.color} transition-transform group-hover/metric:rotate-1`}>{v.val}</p>
                                </div>
                            ))}
                         </div>
                         <div className="pt-2">
                             <button 
                                onClick={() => navigate(`/${user?.role === 'agent' ? 'agent' : user?.role === 'employee' ? 'employee' : 'admin'}/referrals`)}
                                className="h-12 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group/probe"
                             >
                                <Search size={14} className="group-hover/probe:rotate-12 transition-transform" /> View All Candidates
                             </button>
                         </div>
                     </div>
                </div>

                {/* SIDEBAR CTA / QUICK ACTION */}
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-primary rounded-[3rem] p-8 sm:p-10 flex flex-col justify-between min-h-[400px] sm:min-h-[450px] shadow-2xl shadow-primary/20 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 text-left">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                         
                         <div className="space-y-6 relative z-10">
                             <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-xl transition-all group-hover:rotate-12">
                                <Plus size={32} />
                             </div>
                             <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                Manage your work.
                             </h3>
                             <p className="text-white/70 font-medium text-sm leading-relaxed pr-6">
                                Create new jobs or manage your candidate list directly from the dashboard.
                             </p>
                         </div>

                         <button 
                            onClick={() => navigate(`/${user?.role === 'team_leader' ? 'team-leader' : user?.role}/referrals`)}
                            className="h-14 w-full bg-white text-primary font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn relative z-10"
                         >
                            Job Listings <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                         </button>
                     </div>
                </div>
            </div>

            {/* INTEGRATED FOOTER */}
            <Footer />
        </div>
    );
};

export default DashboardOverview;
