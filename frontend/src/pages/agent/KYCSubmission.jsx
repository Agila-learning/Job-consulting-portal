import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, ShieldCheck, Upload, AlertCircle, CheckCircle2, ChevronRight, Landmark, User, CreditCard, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';

const KYCSubmission = () => {
    const [kyc, setKyc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        aadhaarNumber: '',
        panNumber: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
    });
    const [files, setFiles] = useState({
        aadhaarFront: null,
        panCard: null
    });
    const [previews, setPreviews] = useState({
        aadhaarFront: '',
        panCard: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchKYC = async () => {
        try {
            const res = await api.get('/kyc/my');
            if (res.data.data) {
                setKyc(res.data.data);
                setFormData({
                    aadhaarNumber: res.data.data.aadhaarNumber || '',
                    panNumber: res.data.data.panNumber || '',
                    bankName: res.data.data.bankName || '',
                    accountNumber: res.data.data.accountNumber || '',
                    ifscCode: res.data.data.ifscCode || '',
                    accountHolderName: res.data.data.accountHolderName || ''
                });
                if (res.data.data.aadhaarFront || res.data.data.panCard) {
                    const cleanBase = BASE_URL.replace(/\/$/, '');
                    setPreviews({
                        aadhaarFront: res.data.data.aadhaarFront ? `${cleanBase}${res.data.data.aadhaarFront}` : '',
                        panCard: res.data.data.panCard ? `${cleanBase}${res.data.data.panCard}` : ''
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load compliance state');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKYC();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFiles({ ...files, [field]: file });
            setPreviews({ ...previews, [field]: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const data = new FormData();
        
        // Append text fields
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        
        // Append files
        if (files.aadhaarFront) data.append('aadhaarFront', files.aadhaarFront);
        if (files.panCard) data.append('panCard', files.panCard);

        try {
            await api.post('/kyc/submit', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Compliance documents successfully synchronized for verification');
            fetchKYC();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Synchronization failed. Please verify asset integrity.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <ShieldCheck size={48} className="text-primary animate-pulse opacity-20" />
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest leading-none">Syncing Security State</p>
        </div>
    );

    if (kyc && kyc.status === 'verified') {
        return (
            <div className="h-[70vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
                <Card className="bg-card border-border/50 text-center p-12 rounded-[3.5rem] max-w-xl shadow-2xl shadow-primary/5">
                    <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-sm">
                        <ShieldCheck size={56} />
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight mb-4 leading-none">Identity Verified</h2>
                    <p className="text-muted-foreground font-medium mb-10 leading-relaxed text-sm lg:px-10">Your profile is fully compliant. You are authorized for high-value talent orchestration and settlement processing.</p>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-8 font-black uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-emerald-500/20 border-none transition-all">
                        Compliant Partner
                    </Badge>
                </Card>
            </div>
        );
    }

    if (kyc && kyc.status === 'pending') {
        return (
            <div className="h-[70vh] flex items-center justify-center animate-in fade-in duration-1000">
                <Card className="bg-card border-border/50 p-12 rounded-[3.5rem] max-w-xl text-center shadow-2xl shadow-primary/5">
                    <div className="w-24 h-24 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-primary shadow-sm relative">
                        <FileText size={50} />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse border-4 border-card">
                             <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight mb-4 leading-none">Audit In-Progress</h2>
                    <p className="text-muted-foreground font-medium mb-10 leading-relaxed text-sm lg:px-10">Our compliance orchestration team is verifying your identity assets. Estimated throughput time is 24-48 business hours.</p>
                    <Badge variant="outline" className="border-primary/20 text-primary py-2.5 px-8 font-black uppercase tracking-[0.15em] bg-primary/5 rounded-2xl">
                        Verification Pending
                    </Badge>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">Identity Verification</h2>
                    <p className="text-muted-foreground text-sm mt-2 font-medium">Verify your details to enable payouts and job access.</p>
                </div>
                
                <div className="flex items-center gap-3 px-6 py-4 bg-secondary/30 rounded-2xl border border-border/30 backdrop-blur-sm">
                    <ShieldCheck size={20} className="text-primary opacity-60" />
                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Secure Verification Active</p>
                </div>
            </div>

            {/* Stepper Performance */}
            <div className="flex gap-4 px-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex-1 space-y-3">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= i ? 'bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)]' : 'bg-secondary'}`} />
                        <p className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 text-center ${step === i ? 'text-foreground' : 'text-muted-foreground opacity-40'}`}>
                            {i === 1 ? 'Personal Info' : i === 2 ? 'ID Proof' : 'Bank Details'}
                        </p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {step === 1 && (
                    <Card className="relative bg-card border-border/50 rounded-[2.5rem] p-10 shadow-sm animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] pointer-events-none" />
                        <CardHeader className="px-0 pt-0 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Identity Profiling</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Capture foundational identity markers.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 pt-0 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhaar Number (12 Digits)</Label>
                                    <Input id="aadhaarNumber" pattern="[0-9]{12}" minLength={12} maxLength={12} placeholder="1234 5678 9012" className="h-14 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-2xl font-bold tracking-widest" value={formData.aadhaarNumber} onChange={handleChange} required />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PAN Card Number</Label>
                                    <Input id="panNumber" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" placeholder="ABCDE1234F" className="h-14 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-2xl font-bold uppercase tracking-widest" value={formData.panNumber} onChange={handleChange} required />
                                </div>
                            </div>
                            <Button type="button" onClick={() => {
                                if (formData.aadhaarNumber.length === 12 && formData.panNumber.length === 10) {
                                    setStep(2);
                                } else {
                                    toast.error('Please enter valid 12-digit Aadhaar and 10-character PAN');
                                }
                            }} className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] flex gap-3 text-[11px] uppercase tracking-widest ml-auto">
                                Next Step <ChevronRight size={18} />
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="relative bg-card border-border/50 rounded-[2.5rem] p-10 shadow-sm animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] pointer-events-none" />
                        <CardHeader className="px-0 pt-0 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Upload ID Documents</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Please provide links to your document images.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 pt-0 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhaar Card Photo (Front)</Label>
                                    <div className="group relative">
                                        <div className={`w-full h-40 rounded-2xl border-2 border-dashed ${previews.aadhaarFront ? 'border-primary/40' : 'border-border/40'} bg-secondary/10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden relative active:scale-[0.98]`}>
                                            {previews.aadhaarFront ? (
                                                <img src={previews.aadhaarFront} alt="Aadhaar Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Upload size={24} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Select ID Image Asset</p>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                onChange={(e) => handleFileChange(e, 'aadhaarFront')}
                                                accept="image/*"
                                                required={!kyc}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PAN Card Photo</Label>
                                    <div className="group relative">
                                        <div className={`w-full h-40 rounded-2xl border-2 border-dashed ${previews.panCard ? 'border-indigo-500/40' : 'border-border/40'} bg-secondary/10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer overflow-hidden relative active:scale-[0.98]`}>
                                            {previews.panCard ? (
                                                <img src={previews.panCard} alt="PAN Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <>
                                                    <Upload size={24} className="text-muted-foreground/40 group-hover:text-indigo-500 transition-colors" />
                                                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Select PAN Image Asset</p>
                                                </>
                                            )}
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                                onChange={(e) => handleFileChange(e, 'panCard')}
                                                accept="image/*"
                                                required={!kyc}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-12 px-6 rounded-xl hover:bg-secondary flex gap-2 font-bold text-muted-foreground text-xs uppercase tracking-widest">
                                    <ArrowLeft size={16} /> Back
                                </Button>
                                <Button type="button" onClick={() => setStep(3)} className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] flex gap-3 text-[11px] uppercase tracking-widest">
                                    Financial Sync <ChevronRight size={18} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 3 && (
                    <Card className="relative bg-card border-border/50 rounded-[2.5rem] p-10 shadow-sm animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] pointer-events-none" />
                        <CardHeader className="px-0 pt-0 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                    <Landmark size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Bank Details</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Enter details where you want to receive payments.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 pt-0 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bank Name</Label>
                                    <Input id="bankName" placeholder="e.g. HDFC / SBI / ICICI" className="h-14 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-2xl font-bold" value={formData.bankName} onChange={handleChange} required />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bank IFSC Code</Label>
                                    <Input id="ifscCode" pattern="^[A-Z]{4}0[A-Z0-9]{6}$" placeholder="HDFC0123456" className="h-14 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-2xl font-bold uppercase tracking-widest" value={formData.ifscCode} onChange={handleChange} required />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Settlement Account Identifier</Label>
                                    <Input id="accountNumber" placeholder="Enter Full Banking Identifier" className="h-14 bg-secondary/20 border-transparent focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/20 rounded-2xl font-bold tracking-[0.2em]" value={formData.accountNumber} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="h-12 px-6 rounded-xl hover:bg-secondary flex gap-2 font-bold text-muted-foreground text-xs uppercase tracking-widest">
                                    <ArrowLeft size={16} /> Back
                                </Button>
                                <Button type="submit" disabled={submitting} className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.05] flex gap-3 text-[11px] uppercase tracking-widest">
                                    {submitting ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>Submit for Review <CheckCircle2 size={18} /></>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </form>
        </div>
    );
};

export default KYCSubmission;
