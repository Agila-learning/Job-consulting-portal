import React, { useState, useEffect } from 'react';
import { 
    Coins, TrendingUp, Trophy, Star, 
    ArrowUpRight, Clock, CheckCircle2,
    Gift, Zap, Target, Loader2, User, History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const IncentiveTracker = ({ type = 'employee' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversions, setConversions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversions = async () => {
            setLoading(true);
            try {
                const res = await api.get('/referrals');
                // Filter conversions (only those with status 'Joined' or already have a calculated commission)
                const data = res.data.data.filter(r => 
                    r.status === 'Joined' || (r.calculatedCommission && parseInt(r.calculatedCommission) > 0)
                );
                setConversions(data);
            } catch (err) {
                console.error('Failed to fetch incentive telemetry');
            } finally {
                setLoading(false);
            }
        };
        fetchConversions();
    }, []);

    const stats = {
        totalEarned: conversions
            .filter(c => c.payoutStatus === 'paid')
            .reduce((acc, c) => acc + (parseInt(c.calculatedCommission) || 0), 0),
        pendingClaims: conversions
            .filter(c => c.payoutStatus !== 'paid' && c.payoutStatus !== 'declined')
            .reduce((acc, c) => acc + (parseInt(c.calculatedCommission) || 0), 0),
        conversionsCount: conversions.length,
        multiplier: conversions.length > 5 ? '1.5x' : '1.0x'
    };

    const [slabs, setSlabs] = useState([]);

    useEffect(() => {
        const fetchSlabs = async () => {
            try {
                const res = await api.get('/incentives/slabs?status=active');
                setSlabs(res.data.data.filter(s => s.userRole === user?.role || user?.role === 'admin'));
            } catch (err) {}
        };
        fetchSlabs();
    }, [user?.role]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Synchronizing Ledgers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Hub */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-sm">
                            <Trophy size={20} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic uppercase">Conversion<span className="text-amber-600 not-italic">.Rewards</span></h2>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] ml-1">Performance Incentives & Partner Payouts</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl"> Active Cycle: Q1 2026 </Badge>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Earned', value: `₹${stats.totalEarned.toLocaleString()}`, icon: Coins, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                    { label: 'Pipeline Value', value: `₹${stats.pendingClaims.toLocaleString()}`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5' },
                    { label: 'Success Nodes', value: stats.conversionsCount, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                    { label: 'Agent Multiplier', value: stats.multiplier, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/5' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 shadow-sm hover:translate-y-[-4px] transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} border border-current opacity-20 shadow-inner`}>
                                <stat.icon size={22} />
                            </div>
                            <TrendingUp size={16} className={stat.color} />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-70">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Slab Directory Hub */}
            {slabs.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Active Reward Policies</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {slabs.map((slab) => (
                            <div key={slab._id} className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 shadow-sm group hover:border-amber-500/40 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                                        <Trophy size={24} />
                                    </div>
                                    <Badge variant="outline" className="border-amber-500/20 text-amber-600 bg-amber-500/5 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg">
                                        {slab.domain} • {slab.userRole}
                                    </Badge>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase italic">{slab.title}</h4>
                                <div className="space-y-3 mt-6">
                                    {slab.thresholds.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/10">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Target: {t.count} Joined</span>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{t.description || 'Verified Placement'}</span>
                                            </div>
                                            <span className="text-sm font-black text-amber-600">₹{t.rewardValue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Detailed Conversions List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-4 bg-primary rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Transaction Logs</h3>
                        </div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Real-time Telemetry</div>
                    </div>
                    <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border/40 bg-secondary/10 font-black">
                                        <th className="text-[10px] text-muted-foreground uppercase tracking-widest p-6 text-left">Timeline</th>
                                        <th className="text-[10px] text-muted-foreground uppercase tracking-widest p-6 text-left">Partner Entity</th>
                                        <th className="text-[10px] text-muted-foreground uppercase tracking-widest p-6 text-left">Intel (Reason)</th>
                                        <th className="text-[10px] text-muted-foreground uppercase tracking-widest p-6 text-left text-right">Incentive</th>
                                        <th className="text-[10px] text-muted-foreground uppercase tracking-widest p-6 text-center">Protocol</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {conversions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center text-muted-foreground/40 font-black text-[10px] uppercase tracking-[0.3em]">No conversion cycles recorded in current scope</td>
                                        </tr>
                                    ) : conversions.map((conv) => (
                                        <tr key={conv._id} className="group hover:bg-secondary/5 transition-colors">
                                            <td className="p-6">
                                                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{new Date(conv.updatedAt).toLocaleDateString()}</p>
                                                <p className="text-[9px] text-muted-foreground font-bold tracking-tight mt-1">{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-center text-foreground font-black text-xs shadow-inner">
                                                        {(conv.referrer?.name || 'AD').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{conv.referrer?.name || 'Internal Protocol'}</p>
                                                        <Badge className={`rounded-xl px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border-none ${
                                                            conv.sourceType === 'agent' 
                                                            ? 'bg-amber-500/10 text-amber-600' 
                                                            : 'bg-blue-500/10 text-blue-600'
                                                        }`}>
                                                            {conv.sourceType}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{conv.job?.jobTitle || 'Unassigned Role'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">Success allocation for {conv.candidateName}</p>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="text-sm font-black text-emerald-600 tracking-tight">₹{(parseInt(conv.calculatedCommission) || 0).toLocaleString()}</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <Badge className={`rounded-xl px-4 py-1.5 text-[8px] font-black uppercase tracking-[0.15em] border-none shadow-sm ${
                                                        conv.payoutStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 
                                                        conv.payoutStatus === 'pending_approval' ? 'bg-amber-500/10 text-amber-600' : 
                                                        'bg-secondary text-muted-foreground'
                                                    }`}>
                                                        {conv.payoutStatus?.replace('_', ' ') || 'unearned'}
                                                    </Badge>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Engagement / Special Offers Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Active Campaigns</h3>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Gift size={24} />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black tracking-tight leading-loose">Elite Partner Recognition</h4>
                                <p className="text-white/70 text-xs font-medium leading-relaxed">Refer 5 Senior Architects this month to unlock a flat bonus of ₹25,000 extra per conversion.</p>
                            </div>
                            <Button 
                                onClick={() => navigate(`/${user?.role === 'agent' ? 'agent' : user?.role === 'employee' ? 'employee' : 'admin'}/jobs`)}
                                className="w-full h-14 bg-white text-indigo-600 hover:bg-white/90 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
                            >
                                Explore Campaign <ArrowUpRight size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Global Performance Index</h4>
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                        </div>
                        <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                <History size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-foreground uppercase tracking-wider mb-1">Live Tracking Active</p>
                                <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-relaxed">Referral leaderboards refresh <br /> every 24 hours.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncentiveTracker;

