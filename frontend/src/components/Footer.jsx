import React from 'react';
import { 
    Globe, ExternalLink, Mail, 
    ShieldCheck, ArrowUpRight, Zap 
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="mt-20 pb-12 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            
            <div className="max-w-7xl mx-auto pt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden shadow-2xl border-4 border-slate-900/10 dark:border-white/10 hover:scale-110 transition-transform duration-500 bg-white p-1">
                                <img src="/Updated-Logo-New.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Forge<span className="text-primary not-italic">.India</span></span>
                        </div>
                        <p className="text-[13px] font-medium text-muted-foreground leading-relaxed max-w-xs">
                            Architecting the future of human capital orchestration. A high-velocity recruitment engine powered by Forge India Connect.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Globe, ExternalLink, Mail].map((Icon, i) => (
                                <a key={i} href="#" className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all">
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Channels */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Neural Hub</h4>
                        <ul className="space-y-4">
                            {['Candidate Logic', 'Mandate Search', 'Telemetry Dashboard', 'Neural Pipeline'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-[13px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                                        <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Operational Docs */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Logistics</h4>
                        <ul className="space-y-4">
                            {[
                                { label: 'Network Protocol', path: '#' },
                                { label: 'Privacy Core', path: '#' },
                                { label: 'Service SLA', path: '#' },
                                { label: 'Employee Portal', path: 'https://forgeindiaconnect.in' }
                            ].map((item) => (
                                <li key={item.label}>
                                    <a href={item.path} className="text-[13px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                                        <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter / Contact */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Global Presence</h4>
                        <div className="p-6 bg-card border border-border/40 rounded-[2rem] space-y-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-primary" />
                                <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">info@forgeindiaconnect.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe size={16} className="text-primary" />
                                <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">forgeindiaconnect.com</span>
                            </div>
                            <div className="pt-2 flex flex-col gap-3">
                                <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest leading-loose">
                                    RK Towers, Rayakottai Road,<br/>Krishnagiri, Tamil Nadu.
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
                                    <ShieldCheck size={12} /> SYSTEM STATUS: OPERATIONAL
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-loose text-center md:text-left">
                        © {currentYear} Forge India Connect. All Rights Reserved. <br/>
                        <span className="opacity-60 italic font-medium lowercase">Engineered by Antigravity Core 2.0</span>
                    </p>
                    <div className="flex items-center gap-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <a href="#" className="hover:text-primary transition-colors">Compliance</a>
                        <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
                        <div className="flex items-center gap-2 group cursor-help">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="group-hover:text-emerald-500 transition-colors">Secure Node</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
