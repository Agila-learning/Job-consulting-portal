import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, GripVertical, Briefcase, Clock, Phone, FileText, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high': return 'bg-rose-500';
        case 'medium': return 'bg-amber-500';
        case 'low': return 'bg-emerald-500';
        default: return 'bg-slate-400';
    }
};

const getStageColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('new') || s.includes('referred')) return 'bg-blue-500';
    if (s.includes('review') || s.includes('contacted')) return 'bg-indigo-500';
    if (s.includes('interview')) return 'bg-primary';
    if (s.includes('selected') || s.includes('offered')) return 'bg-emerald-400';
    if (s.includes('joined') || s.includes('placed')) return 'bg-emerald-600';
    if (s.includes('rejected') || s.includes('dropped')) return 'bg-rose-500';
    if (s.includes('hold')) return 'bg-amber-500';
    return 'bg-slate-500';
};

export function AgentKanbanCard({ referral, onClick }) {
    return (
        <div 
            onClick={() => onClick && onClick(referral)}
            className="p-5 mb-4 bg-background border border-border/50 rounded-[1.8rem] cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/60 hover:border-primary/40 transition-all group relative overflow-hidden shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
        >
            {/* Status & Priority Indicator Line */}
            <div className={`absolute top-0 left-0 w-2 h-full ${getStageColor(referral.status)} opacity-40 group-hover:opacity-100 transition-opacity`} />
            <div className={`absolute top-0 left-0 w-0.5 h-full ${getPriorityColor(referral.priority)} z-10`} />
            
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className="w-11 h-11 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center font-black text-foreground shadow-sm shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        {referral.candidateName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-foreground group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate leading-none">{referral.candidateName}</p>
                            {referral.priority === 'high' && <Star size={10} className="text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] truncate flex items-center gap-1.5 group-hover:text-muted-foreground/80 transition-colors">
                            {referral.job?.companyName || 'Lead Interaction'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-secondary/30 group-hover:bg-primary/5 p-2.5 rounded-2xl border border-transparent group-hover:border-primary/10 transition-all">
                    <Briefcase size={12} className="text-primary/60" />
                    <span className="truncate group-hover:text-foreground transition-colors">{referral.job?.jobTitle || 'Unassigned Role'}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-black tracking-widest uppercase">
                        <Clock size={10} className="text-muted-foreground/40" />
                        <span>Last Update: {new Date(referral.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AgentKanbanColumn({ title, referrals, onCardClick }) {
    const stageColor = getStageColor(title);
    
    return (
        <div className="flex flex-col w-[280px] sm:w-[320px] min-w-[280px] sm:min-w-[320px] h-full bg-card/40 backdrop-blur-3xl border border-border/30 rounded-[2.2rem] sm:rounded-[2.8rem] p-4 sm:p-6 mr-4 sm:mr-6 shadow-[0_8px_40px_rgba(0,0,0,0.02)] transition-all hover:border-border/60">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3.5">
                    <div className={`w-4 h-10 rounded-lg ${stageColor} shadow-[0_8px_20px_rgba(0,0,0,0.1)] relative overflow-hidden`}>
                        <div className={`absolute inset-0 rounded-full ${stageColor} animate-pulse opacity-20`} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5 italic">
                            {title}
                        </h3>
                    </div>
                </div>
                <Badge variant="secondary" className="bg-background/80 text-[10px] text-foreground px-3.5 py-1.5 rounded-2xl border-border/40 font-black tracking-widest shadow-sm">
                    {referrals.length}
                </Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 -mx-2">
                <div className="space-y-0.5 min-h-[50vh]">
                    {referrals.map((referral) => (
                        <AgentKanbanCard key={referral._id} referral={referral} onClick={onCardClick} />
                    ))}
                </div>
                
                {referrals.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-border/30 rounded-[2rem] mt-2 opacity-40 bg-secondary/10 group/empty hover:bg-secondary/20 transition-all">
                        <FileCheck size={24} className="text-muted-foreground/30 mb-3 group-hover/empty:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">No Candidates</p>
                    </div>
                )}
            </div>
        </div>
    );
}
