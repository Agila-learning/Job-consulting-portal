import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { gsap } from 'gsap';
import { Lock, Mail, ArrowRight, Loader2, Zap } from 'lucide-react';
import monkeySad from '@/assets/animations/monkey_sad.png';
import monkeySuccess from '@/assets/animations/monkey_success.png';
import logo from '@/assets/Updated-Logo-New.jpg';

const FeedbackOverlay = ({ status }) => {
    const overlayRef = useRef(null);
    const monkeyRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        if (status !== 'idle') {
            const tl = gsap.timeline();
            tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
              .fromTo(monkeyRef.current, { y: 100, scale: 0.8, rotate: -10 }, { y: 0, scale: 1, rotate: 0, duration: 0.8, ease: "back.out(2)" })
              .fromTo(textRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.3");
        }
    }, [status]);

    if (status === 'idle') return null;

    return (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-8 text-center animate-in zoom-in duration-300">
                <div ref={monkeyRef} className="w-40 h-40 md:w-56 md:h-56 relative rounded-full border-4 border-primary/20 bg-card/50 backdrop-blur-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex items-center justify-center group ring-8 ring-primary/5">
                    <img 
                        src={status === 'success' ? monkeySuccess : monkeySad} 
                        alt="Monkey Feedback" 
                        className="w-[85%] h-[85%] object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-500"
                    />
                </div>
                <div ref={textRef} className="space-y-2">
                    <h2 className={`text-2xl md:text-4xl font-black tracking-tighter ${status === 'success' ? 'text-primary' : 'text-destructive'}`}>
                        {status === 'success' ? 'YOU ARE RIGHT!' : 'SO SAD...'}
                    </h2>
                    <p className="text-sm md:text-xl font-bold text-muted-foreground uppercase tracking-widest">
                        {status === 'success' ? 'Go ahead' : 'You are wrong'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [localError, setLocalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authStatus, setAuthStatus] = useState('idle'); // idle, success, error
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        if (user && authStatus === 'success') {
            const timer = setTimeout(() => {
                const redirectPath = user.role === 'admin' 
                    ? '/admin/dashboard' 
                    : user.role === 'team_leader'
                    ? '/team-leader/dashboard'
                    : user.role === 'employee' 
                    ? '/employee/dashboard' 
                    : '/agent/dashboard';
                navigate(redirectPath);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, navigate, authStatus]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial split-screen entry
            gsap.from(".login-left", { x: -100, opacity: 0, duration: 1.5, ease: "power4.out" });
            gsap.from(".login-right", { x: 100, opacity: 0, duration: 1.5, ease: "power4.out" });

            // Staggered text reveal for hero
            const heroLines = document.querySelectorAll(".hero-line");
            gsap.from(heroLines, {
                y: 30,
                opacity: 0,
                stagger: 0.15,
                duration: 1,
                delay: 0.3,
                ease: "power3.out"
            });

            // Parallax/Floating decor
            gsap.to(".parallax-zap", {
                y: 20,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            // Count-up stats
            const stats = { retention: 0, agents: 0 };
            gsap.to(stats, {
                retention: 98,
                agents: 1210,
                duration: 2.5,
                delay: 0.8,
                ease: "power2.out",
                onUpdate: () => {
                    const retEl = document.querySelector(".stat-retention");
                    const agtEl = document.querySelector(".stat-agents");
                    if (retEl) retEl.textContent = `${Math.round(stats.retention)}%`;
                    if (agtEl) agtEl.textContent = `${(stats.agents / 1000).toFixed(1)}K+`;
                }
            });

            // Form content stagger
            gsap.from(".login-form-content > *", { 
                y: 20, 
                opacity: 0, 
                stagger: 0.1, 
                duration: 0.8, 
                delay: 0.6, 
                ease: "power3.out" 
            });
        });
        return () => ctx.revert();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setIsSubmitting(true);
        try {
            await login(formData.email, formData.password);
            setAuthStatus('success');
            
            // System Exit Animation
            gsap.to(".login-form-content", {
                scale: 0.95,
                opacity: 0,
                duration: 0.8,
                ease: "power4.in"
            });
            gsap.to(".login-left", {
                x: -50,
                opacity: 0,
                duration: 1,
                ease: "power4.in"
            });
            } catch (err) {
            setAuthStatus('error');
            if (!err.response) {
                setLocalError('Cannot connect to mission control. Please check if your backend server is running and accessible.');
            } else {
                setLocalError(err.response.data?.message || 'Invalid credentials. Please check your password.');
            }
            
            // Shake animation for error
            if (document.querySelector(".error-alert")) {
                gsap.fromTo(".error-alert", 
                    { x: -10 }, 
                    { x: 10, duration: 0.1, repeat: 5, yoyo: true, ease: "linear", onComplete: () => {
                        gsap.set(".error-alert", { x: 0 });
                    }}
                );
            }
            
            setTimeout(() => setAuthStatus('idle'), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background overflow-hidden relative">
            <FeedbackOverlay status={authStatus} />
            
            {/* LEFT SIDE: BRAND EXPERIENCE */}
            <div className="login-left hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-20 overflow-hidden">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 right-0 w-[800px] h-full bg-primary/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 space-y-10 max-w-xl">
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center p-3 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                        <img src={logo} alt="FIC Logo" className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="space-y-6">
                        <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] px-5 py-2 rounded-full uppercase tracking-[0.3em] italic">
                            Mission Control Center
                        </Badge>
                        <h1 className="text-6xl xl:text-7xl font-black text-white tracking-tighter leading-[0.9] italic uppercase">
                            <span className="block hero-line">Empowering</span>
                            <span className="block hero-line text-primary not-italic relative">
                                WORKFORCE
                                <span className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse -z-10 rounded-full" />
                            </span>
                            <span className="block hero-line">Excellence.</span>
                        </h1>
                        <p className="text-white/50 text-lg font-medium leading-relaxed max-w-md hero-line">
                            The universal terminal for recruitment orchestration, financial reconciliation, and agent network management.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10 hero-line">
                         <div className="space-y-2 group/stat cursor-default">
                            <p className="stat-retention text-4xl font-black text-white italic tracking-tighter transition-all group-hover:scale-110 group-hover:text-primary">0%</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Retention Rate</p>
                         </div>
                         <div className="space-y-2 group/stat cursor-default">
                            <p className="stat-agents text-4xl font-black text-primary italic tracking-tighter transition-all group-hover:scale-110 group-hover:text-white">0K+</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Verified Agents</p>
                         </div>
                    </div>
                </div>
                
                {/* Geometric Decor */}
                <div className="parallax-zap absolute bottom-10 right-10 opacity-20 pointer-events-none">
                    <Zap size={300} className="text-white fill-white stroke-none drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]" />
                </div>
            </div>

            {/* RIGHT SIDE: AUTH FORM */}
            <div className="login-right w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-background relative">
                {/* Mobile Decor (Hidden on Desktop) */}
                <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="w-full max-w-md space-y-12 login-form-content">
                    <div className="space-y-4">
                        <div className="lg:hidden w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 mb-8 border border-border/40">
                             <img src={logo} alt="FIC Logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-4xl font-black text-foreground tracking-tighter leading-tight italic uppercase">Access Protocol</h2>
                        <p className="text-muted-foreground font-medium">Initialize your session to manage the engine.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {localError && (
                            <Alert variant="destructive" className="error-alert bg-destructive/5 border-destructive/20 text-destructive py-4 rounded-2xl">
                                <AlertDescription className="text-xs font-bold leading-tight">{localError}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="space-y-6">
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Universal Identity</Label>
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="node-identifier@workforce.com" 
                                        className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm group-focus-within/input:scale-[1.01]"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Access Matrix</Label>
                                    <a href="#" className="text-[9px] uppercase tracking-widest font-black text-primary hover:opacity-80 transition-opacity">Reset Sequence</a>
                                </div>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        placeholder="••••••••••••"
                                        className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm group-focus-within/input:scale-[1.01]"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="group/btn w-full h-16 bg-slate-900 dark:bg-primary hover:scale-[1.01] active:scale-95 text-white font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all mt-4 flex gap-3 text-[11px] uppercase tracking-[0.2em] border-0 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] pointer-events-none" />
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-3 relative z-10 transition-transform group-hover/btn:scale-105">
                                    Authorize Entry <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="pt-10 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-muted-foreground text-xs font-medium">New integration node?</p>
                        <Link to="/register">
                            <Button variant="ghost" className="h-12 px-8 rounded-2xl border border-border/40 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                                Request Access
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="absolute bottom-8 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.4em] italic">
                    FORGE INDIA CONNECT • CRM V2.0 ENGINE
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
