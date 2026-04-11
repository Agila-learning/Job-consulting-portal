import React, { useState } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
    UserPlus, Mail, Phone, Building2, 
    MapPin, Globe, Sparkles, Loader2, ShieldCheck,
    Zap, PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ReferAgentForm = () => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        agencyName: '',
        city: '',
        location: '',
        specialization: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Logic: Create a user with role 'agent' and referredBy = current user
            // We'll use the register endpoint or a new dedicated referral endpoint
            await api.post('/users/refer-agent', {
                ...formData,
                referredBy: user.id
            });
            
            setSuccess(true);
            toast.success('Agent referral sequence initialized!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Referral protocol failure');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/20">
                    <PartyPopper size={40} />
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                        Referral <span className="text-emerald-500 not-italic">Synchronized</span>
                    </h2>
                    <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                        Agent <span className="text-foreground font-black uppercase tracking-widest">{formData.name}</span> has been added to the vetting queue. You will receive incentives for all successful candidates they refer.
                    </p>
                </div>
                <Button 
                    onClick={() => setSuccess(false)}
                    className="h-14 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all"
                >
                    Refer Another Partner
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                    <Sparkles size={16} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Strategic Partnership</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                    Refer <span className="text-primary not-italic">Agency Partner</span>
                </h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto font-medium">
                    Expand our recruitment ecosystem by referring professional agents. 
                    <span className="text-primary font-bold"> Direct incentive attribution enabled</span> for all their successful placements.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-3">
                    <div className="bg-card border border-border/40 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
                        
                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Name</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><UserPlus size={16} /></div>
                                        <input 
                                            name="name" required value={formData.name} onChange={handleChange}
                                            className="w-full h-14 bg-secondary/30 border-border/40 pl-12 pr-4 rounded-2xl text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                            placeholder="Agent Full Name"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Mail size={16} /></div>
                                        <input 
                                            name="email" type="email" required value={formData.email} onChange={handleChange}
                                            className="w-full h-14 bg-secondary/30 border-border/40 pl-12 pr-4 rounded-2xl text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                            placeholder="agent@agency.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Sequence</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Phone size={16} /></div>
                                        <input 
                                            name="mobile" required value={formData.mobile} onChange={handleChange}
                                            className="w-full h-14 bg-secondary/30 border-border/40 pl-12 pr-4 rounded-2xl text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                            placeholder="+91 00000 00000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Agency Brand</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Building2 size={16} /></div>
                                        <input 
                                            name="agencyName" required value={formData.agencyName} onChange={handleChange}
                                            className="w-full h-14 bg-secondary/30 border-border/40 pl-12 pr-4 rounded-2xl text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                            placeholder="Organization Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-border/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">HQ Location / City</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><MapPin size={16} /></div>
                                            <input 
                                                name="city" required value={formData.city} onChange={handleChange}
                                                className="w-full h-14 bg-secondary/30 border-border/40 pl-12 pr-4 rounded-2xl text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                                placeholder="e.g. Bangalore"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Domain Expertise</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"><Globe size={16} /></div>
                                            <input 
                                                name="specialization" required value={formData.specialization} onChange={handleChange}
                                                className="w-full h-14 bg-secondary/30 border-border/40 pl-12 pr-4 rounded-2xl text-sm font-bold focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                                placeholder="e.g. IT, BDA, Banking"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full h-16 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex gap-3"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin" /> Transmitting Protocol...</>
                                ) : (
                                    <><Zap size={18} /> Initialize Partner Referral</>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Info Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] translate-y-1/2 translate-x-1/2" />
                        <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                            <ShieldCheck size={24} /> Partner Benefits
                        </h3>
                        <div className="space-y-6">
                            {[
                                { t: 'Lifetime Attribution', d: 'Earn incentives from every successful joint placement.' },
                                { t: 'Real-time Telemetry', d: 'Track their candidates in your dashboard instantly.' },
                                { t: 'Automated Settlements', d: 'Verified joined status triggers instant credit.' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-1 border-l-2 border-white/20 pl-4 py-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.t}</p>
                                    <p className="text-sm font-bold">{item.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-secondary/30 border border-border/40 rounded-[2.5rem] p-8 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notice</p>
                        <p className="text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-400">
                            Referred agents must be manually verified by the administrative core before they can start referring candidates. Once verified, they will be linked to your employee profile permanently.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferAgentForm;
