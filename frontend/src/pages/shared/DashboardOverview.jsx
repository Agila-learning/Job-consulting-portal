import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Briefcase, Users, CheckCircle, Clock, 
    TrendingUp, Activity, Plus, ArrowRight,
    Loader2, Layers, LayoutPanelLeft, Zap, Search,
    UserCheck, UserMinus, MessageSquare, ListTodo,
    BarChart3, Award, History, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
import { cn } from "@/lib/utils";

const DashboardOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCandidates: 0,
        newLeads: 0,
        followUpsPending: 0,
        interviewsScheduled: 0,
        selectedCount: 0,
        hiredCount: 0,
        rejectedCount: 0,
        activeJobs: 0,
        teamPerformance: [],
        employeePerformance: [],
        agentPerformance: []
    });
    const [activities, setActivities] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(user?.role === 'admin' ? 'all' : (user?.branchId || 'all'));
    const [loading, setLoading] = useState(true);

    const currentBranchName = branches.find(b => b._id === selectedBranch)?.name || 'All Branches';

    useEffect(() => {
        const fetchBranches = async () => {
            if (user?.role === 'admin') {
                try {
                    const res = await api.get('/branches');
                    setBranches(res.data.data);
                } catch (err) {
                    console.error('Failed to fetch branches');
                }
            } else {
                // For non-admins, we might want to still show their branch name
                try {
                    const res = await api.get('/branches');
                    setBranches(res.data.data);
                } catch (err) {}
            }
        };

        const fetchAllData = async () => {
            setLoading(true);
            try {
                const branchQuery = selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : '';
                
                // Fetch Stats
                const statsRes = await api.get(`/referrals/stats${branchQuery}`);
                setStats(statsRes.data.data);

                // Fetch Activities
                const activityRes = await api.get(`/referrals/branch-activity${branchQuery}`);
                setActivities(activityRes.data.data);

            } catch (err) {
                console.error('Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
        fetchAllData();
    }, [selectedBranch, user?.role]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-card border border-border/40 shadow-xl flex items-center justify-center">
                    <Loader2 size={36} className="text-primary animate-spin" />
                </div>
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] relative z-10">Syncing Branch Data...</p>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Base', value: stats.totalCandidates, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/5', desc: 'Total Candidates' },
        { label: 'New Leads', value: stats.newLeads, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/5', desc: 'Fresh Applications' },
        { label: 'Follow-ups', value: stats.followUpsPending, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/5', desc: 'Tasks Pending' },
        { label: 'Interviews', value: stats.interviewsScheduled, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/5', desc: 'Schedules Active' },
        { label: 'Selected', value: stats.selectedCount, icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/5', desc: 'Awaiting Joining' },
        { label: 'Joined', value: stats.hiredCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/5', desc: 'Successful Placements' },
        { label: 'Rejected', value: stats.rejectedCount, icon: UserMinus, color: 'text-rose-500', bg: 'bg-rose-500/5', desc: 'Dropped Records' },
        { label: 'Open Jobs', value: stats.activeJobs, icon: ListTodo, color: 'text-slate-500', bg: 'bg-slate-500/5', desc: 'Active Mandates' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10">
            {/* BRANCH HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-1">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm group">
                            <Building2 size={24} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none capitalize">
                                    {currentBranchName}
                                </h2>
                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 rounded-md">
                                    Operational
                                </Badge>
                            </div>
                            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} className="text-primary animate-pulse" />
                                Branch-Specific Insights & Control Center
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {user?.role === 'admin' && (
                        <div className="relative">
                            <select 
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="h-12 pl-10 pr-6 rounded-2xl border border-border/60 bg-background/50 font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                            >
                                <option value="all">Global Workspace (Total)</option>
                                {branches.map(branch => (
                                    <option key={branch._id} value={branch._id}>{branch.name} Branch</option>
                                ))}
                            </select>
                            <LayoutPanelLeft size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                        </div>
                    )}
                    <Badge variant="outline" className="h-12 px-5 rounded-2xl border-border/60 bg-background/50 font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white shadow-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Badge>
                </div>
            </div>

            {/* EXPANDED METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {statCards.map((stat, i) => (
                    <div key={i} className="group bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-150 duration-700`} />
                        <div className="flex items-center gap-4 mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:-translate-y-1 shadow-sm",
                                stat.bg, stat.color, stat.bg.replace('/5', '/10').replace('bg-', 'border-')
                            )}>
                                <stat.icon size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">{stat.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* TEAM PERFORMANCE & ACTIVITY */}
                <div className="lg:col-span-8 space-y-8">
                    {/* TEAM STATS */}
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8 overflow-hidden relative">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
                                    <BarChart3 size={20} className="text-primary" />
                                    Department Throughput
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Candidate distribution per team</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {['IT', 'BDA', 'Consulting', 'Credit card', 'Banking', 'Manufacturing'].map(team => {
                                const teamStat = stats.teamPerformance?.find(t => t._id === team);
                                const count = teamStat ? teamStat.count : 0;
                                const percentage = stats.totalCandidates > 0 ? (count / stats.totalCandidates) * 100 : 0;

                                return (
                                    <div key={team} className="bg-secondary/30 rounded-2xl p-5 border border-border/50 hover:border-primary/30 transition-colors group">
                                        <div className="flex justify-between items-end mb-3">
                                            <p className="text-[11px] font-black text-foreground uppercase tracking-wider">{team}</p>
                                            <p className="text-2xl font-black text-primary tracking-tighter">{count}</p>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000 ease-out" 
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RECENT ACTIVITY LOG */}
                    <div className="bg-slate-900/5 dark:bg-slate-900/40 border border-border/40 rounded-[2.5rem] overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-border/20 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                                    <History size={18} className="text-primary" />
                                    Branch Live Feed
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time status updates</p>
                            </div>
                            <button 
                                onClick={() => {
                                    const basePath = user?.role === 'team_leader' ? '/team-leader' : (user?.role === 'employee' ? '/employee' : '/admin');
                                    navigate(`${basePath}/referrals`);
                                }} 
                                className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
                            >
                                View ATS Pipeline <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
                            {activities.length > 0 ? activities.map((act, i) => (
                                <div key={i} className="p-6 flex items-start gap-4 hover:bg-white/5 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shrink-0">
                                        {act.userName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-xs font-black text-foreground truncate">{act.candidateName}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground whitespace-nowrap uppercase tracking-tighter">
                                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground font-medium">{act.action} by</span>
                                            <span className="text-[10px] text-primary font-black uppercase tracking-widest">{act.userName}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-20 text-center space-y-4">
                                    <Activity size={40} className="mx-auto text-muted-foreground/30" />
                                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">No recent branch activity found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* LEADERBOARDS & QUICK ACTIONS */}
                <div className="lg:col-span-4 space-y-8">
                    {/* TOP EMPLOYEES */}
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                <Award size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg font-black text-foreground tracking-tight">Recruiter Elite</h3>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Top conversion specialists</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {stats.employeePerformance?.length > 0 ? stats.employeePerformance.map((emp, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-primary/40 w-4">#{i+1}</span>
                                        <p className="text-xs font-black text-foreground tracking-tight uppercase truncate max-w-[120px]">{emp.name}</p>
                                    </div>
                                    <Badge variant="outline" className="font-black text-[9px] border-indigo-500/20 text-indigo-500 bg-indigo-500/5">
                                        {emp.count} Hires
                                    </Badge>
                                </div>
                            )) : (
                                <p className="text-[10px] text-center font-bold text-muted-foreground py-10 uppercase italic">No placements logged yet</p>
                            )}
                        </div>
                    </div>

                    {/* TOP AGENTS */}
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                <UserCheck size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-lg font-black text-foreground tracking-tight">Agent Partners</h3>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Top branch referrals</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {stats.agentPerformance?.length > 0 ? stats.agentPerformance.map((age, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/50 border border-border/30">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-amber-500/40 w-4">#{i+1}</span>
                                        <p className="text-xs font-black text-foreground tracking-tight uppercase truncate max-w-[120px]">{age.name}</p>
                                    </div>
                                    <Badge variant="outline" className="font-black text-[9px] border-amber-500/20 text-amber-500 bg-amber-500/5">
                                        {age.count} Leads
                                    </Badge>
                                </div>
                            )) : (
                                <p className="text-[10px] text-center font-bold text-muted-foreground py-10 uppercase italic">Waiting for referrals...</p>
                            )}
                        </div>
                    </div>

                    {/* QUICK ACTION */}
                    <div className="bg-primary rounded-[2.5rem] p-8 shadow-2xl shadow-primary/20 relative overflow-hidden group border border-white/10">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                         <div className="space-y-6 relative z-10">
                             <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/20 shadow-sm transition-all group-hover:rotate-6">
                                <Plus size={24} />
                             </div>
                             <div>
                                <h3 className="text-2xl font-black tracking-tight text-white leading-tight mb-2">
                                    Boost Branch Throughput
                                </h3>
                                <p className="text-white/70 font-medium text-[11px] leading-relaxed pr-4">
                                    Rapidly add candidates to your branch pipeline to accelerate conversion metrics.
                                </p>
                             </div>
                             <button 
                                onClick={() => {
                                    const basePath = user?.role === 'team_leader' ? '/team-leader' : (user?.role === 'employee' ? '/employee' : '/admin');
                                    const path = user?.role === 'admin' ? '/admin/referrals' : `${basePath}/pipeline`;
                                    navigate(path);
                                }}
                                className="h-12 w-full bg-white text-primary font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                             >
                                Open Referral Port <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* INTEGRATED FOOTER */}
            <Footer />
        </div>
    );
};

export default DashboardOverview;
