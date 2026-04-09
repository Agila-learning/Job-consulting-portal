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
import { Mail, Lock, ArrowRight, Loader2, User, MapPin, CheckCircle2, Zap, Phone, ShieldCheck } from 'lucide-react';
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
              .fromTo(monkeyRef.current, { y: 200, scale: 0.5, rotate: -20 }, { y: 0, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.7)" })
              .fromTo(textRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.2");
        }
    }, [status]);

    if (status === 'idle') return null;

    return (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-8 text-center animate-in zoom-in duration-300">
                <div ref={monkeyRef} className="w-56 h-56 relative rounded-full border-4 border-primary/20 bg-card/50 backdrop-blur-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex items-center justify-center group ring-8 ring-primary/5">
                    <img 
                        src={monkeySuccess} 
                        alt="Monkey Success" 
                        className="w-[85%] h-[85%] object-contain drop-shadow-2xl transition-transform group-hover:scale-110 duration-500"
                    />
                </div>
                <div ref={textRef} className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter text-primary">
                        YOU ARE RIGHT!
                    </h2>
                    <p className="text-xl font-bold text-muted-foreground uppercase tracking-widest">
                        Go ahead, welcome to the team
                    </p>
                </div>
            </div>
        </div>
    );
};

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'agent', // Fixed for this page
        mobile: '',
        location: ''
    });
    const [localError, setLocalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authStatus, setAuthStatus] = useState('idle'); // idle, success
    const [isSuccess, setIsSuccess] = useState(false);
    const { register, user } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        // Only auto-redirect if specifically in a success state or fresh context
        // This prevents the "Request Access" loop where users are kicked back to login/dashboard
        if (user && authStatus === 'success') {
            const redirectPath = user.role === 'admin' ? '/admin/dashboard' : user.role === 'employee' ? '/employee/dashboard' : '/agent/dashboard';
            navigate(redirectPath);
        }
    }, [user, navigate, authStatus]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".reg-left", { x: -100, opacity: 0, duration: 1.2, ease: "power4.out" });
            gsap.from(".reg-right", { x: 100, opacity: 0, duration: 1.2, ease: "power4.out" });
            gsap.from(".reg-form-content > *", { 
                y: 20, 
                opacity: 0, 
                stagger: 0.1, 
                duration: 0.8, 
                delay: 0.5, 
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
            await register(formData);
            setAuthStatus('success');
            setTimeout(() => {
                setAuthStatus('idle');
                setIsSuccess(true);
                setTimeout(() => navigate('/login'), 4000);
            }, 2000);
        } catch (err) {
            setLocalError(err.response?.data?.message || 'Registration failed. Please check your data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <Card className="max-w-md bg-card/70 border-border/50 backdrop-blur-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[3rem] p-12 space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="bg-emerald-500/10 p-6 rounded-[2rem] w-24 h-24 mx-auto flex items-center justify-center border border-emerald-500/20 text-emerald-600 shadow-sm transition-transform hover:scale-105">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-3">
                        <CardTitle className="text-3xl font-black tracking-tight text-foreground leading-none">Application Sent</CardTitle>
                        <p className="text-muted-foreground font-medium text-sm leading-relaxed px-4">
                            Your account is now <span className="text-primary font-bold">waiting for approval</span> by the admin. 
                        </p>
                    </div>
                    <div className="pt-4">
                        <Badge variant="outline" className="border-primary/20 text-primary py-2 px-6 font-black uppercase tracking-[0.15em] bg-primary/5 rounded-2xl animate-pulse">
                            Wait for Redirect
                        </Badge>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-background overflow-hidden relative">
            <FeedbackOverlay status={authStatus} />
            
            {/* LEFT SIDE: BRAND EXPERIENCE */}
            <div className="reg-left hidden lg:flex lg:w-1/3 relative bg-slate-900 items-center justify-center p-16 overflow-hidden border-r border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/3" />
                <div className="relative z-10 space-y-10">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-3 transform -rotate-6">
                        <img src={logo} alt="FIC Logo" className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="space-y-6">
                        <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-4 py-1.5 rounded-full uppercase tracking-[0.3em] italic">
                            Agent Onboarding
                        </Badge>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none italic uppercase">
                            Start Your <br/>
                            <span className="text-primary not-italic">Earnings</span> <br/>
                            Stream.
                        </h1>
                        <p className="text-white/40 text-sm font-medium leading-relaxed">
                            Join the Forge India Connect network as a verified recruitment agent and access high-value incentives.
                        </p>
                    </div>

                    <ul className="space-y-4">
                        {[
                            'Instant Bounty Tracking',
                            'Automated KYC Verification',
                            'Direct Ledger Settlement',
                            '24/7 Agent Support Hub'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                                <CheckCircle2 size={16} className="text-primary" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT SIDE: REGISTRATION FORM */}
            <div className="reg-right w-full lg:w-2/3 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-background relative overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-2xl space-y-12 reg-form-content py-10">
                    <div className="space-y-4">
                        <div className="lg:hidden w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 mb-8">
                             <img src={logo} alt="FIC Logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-4xl font-black text-foreground tracking-tighter leading-tight italic uppercase">Agent Registration</h2>
                        <p className="text-muted-foreground font-medium">Create your credentials to join the universal network.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {localError && (
                            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive py-4 rounded-2xl animate-in shake duration-500">
                                <AlertDescription className="text-xs font-bold leading-tight">{localError}</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-2.5">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Full Legal Name</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input id="name" placeholder="Johnathan Doe" className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm" required value={formData.name} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Universal Identity (Email)</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input id="email" type="email" placeholder="agent@workforce.com" className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm" required value={formData.email} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Security Matrix (Password)</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input id="password" type="password" placeholder="••••••••••••" className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm" required value={formData.password} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label htmlFor="mobile" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Verified Mobile Node</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input id="mobile" placeholder="+91 90000 00000" className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm" required value={formData.mobile} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2.5 md:col-span-2">
                                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Operational Location</Label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                    <Input id="location" placeholder="Bangalore, Karnataka, India" className="h-16 pl-12 bg-secondary/20 border-transparent focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/20 rounded-2xl font-bold placeholder:text-muted-foreground/30 transition-all outline-none text-sm" required value={formData.location} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-start gap-4">
                            <ShieldCheck size={24} className="text-primary shrink-0" />
                            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                Proceeding with registration implies agreement with the <span className="font-black italic uppercase text-primary tracking-widest">Agent Compliance Protocol</span>. Your application will be queued for manual node validation by the administration.
                            </p>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-slate-900 dark:bg-primary hover:scale-[1.01] active:scale-[0.99] text-white font-black rounded-2xl shadow-2xl transition-all flex gap-3 text-[11px] uppercase tracking-[0.2em] border-0">
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Submit Registration Protocol <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="pt-10 border-t border-border/40 flex items-center justify-between">
                        <p className="text-muted-foreground text-xs font-medium">Existing authorized node?</p>
                        <Link to="/login" className="text-primary hover:underline font-black uppercase tracking-widest text-[11px]">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
