import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
    DollarSign, TrendingUp, CheckCircle, Clock, 
    FileText, Upload, Send, Loader2, Landmark,
    AlertCircle, ShieldCheck, ChevronRight, Zap, X
} from 'lucide-react';
import * as XLSX from 'xlsx';

const Commissions = () => {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kycStatus, setKycStatus] = useState(null);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [refRes, kycRes] = await Promise.all([
                api.get('/referrals'),
                api.get('/kyc/my')
            ]);
            setReferrals(refRes.data.data);
            setKycStatus(kycRes.data.data?.status || 'uninitiated');
        } catch (err) {
            toast.error('Failed to load financial telemetry');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvoiceUpload = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.patch(`/referrals/${selectedReferral._id}/status`, { 
                agentInvoiceUrl: invoiceUrl,
                payoutStatus: 'pending_approval' 
            });
            toast.success('Settlement claim authorized');
            setIsUploadOpen(false);
            setInvoiceUrl('');
            fetchData();
        } catch (err) {
            toast.error('Failed to submit financial claim');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        const data = referrals.map(r => ({
            'Candidate Name': r.candidateName,
            'Job Role': r.job?.jobTitle || 'N/A',
            'Projected Value (INR)': r.calculatedCommission || r.job?.incentiveAgent || 5000,
            'Ledger Status': r.payoutStatus,
            'Lifecycle Node': r.status,
            'Submission Date': r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Ledger');
        XLSX.writeFile(workbook, `financial_ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Financial Ledger Exported to Excel');
    };

    const totalEarned = referrals
        .filter(r => r.payoutStatus === 'paid')
        .reduce((acc, r) => acc + (r.calculatedCommission || r.job?.incentiveAgent || 5000), 0);

    const projectedPipeline = referrals
        .filter(r => r.status !== 'Rejected' && r.payoutStatus !== 'paid')
        .reduce((acc, r) => acc + (r.calculatedCommission || r.job?.incentiveAgent || 5000), 0);

    const columns = [
        {
            header: 'Target Candidate',
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center font-black text-foreground shadow-sm">
                        {row.candidateName.charAt(0)}
                    </div>
                    <div>
                        <p className="font-black text-foreground text-sm tracking-tight leading-none mb-1.5">{row.candidateName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5 line-clamp-1">
                            {row.job?.jobTitle}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Projected Value',
            cell: (row) => (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black tracking-tight text-sm">
                    <div className="p-1 bg-emerald-500/10 text-emerald-600/70 border border-emerald-500/20 rounded-md">
                        <DollarSign size={12} />
                    </div>
                    <span>₹{(row.calculatedCommission || row.job?.incentiveAgent || 5000).toLocaleString()}</span> 
                </div>
            )
        },
        {
            header: 'Ledger Status',
            cell: (row) => (
                <div className="flex flex-col gap-2">
                    <Badge variant="outline" className={`w-fit rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${
                        row.payoutStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        row.payoutStatus === 'pending_approval' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm' : 
                        'bg-secondary/50 text-muted-foreground border-border/50'
                    }`}>
                        {row.payoutStatus.replace('_', ' ')}
                    </Badge>
                    {row.status === 'Joined' && row.payoutStatus === 'unearned' && (
                        <div className="flex items-center gap-1.5 text-[9px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest animate-pulse ml-1">
                            <Zap size={10} className="fill-amber-500/50" /> Claim Ready
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Action',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.status === 'Joined' ? (
                        <Button 
                            disabled={kycStatus !== 'verified'}
                            onClick={() => {
                                setSelectedReferral(row);
                                setIsUploadOpen(true);
                            }}
                            className={`h-9 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all ${
                                kycStatus === 'verified' 
                                ? 'bg-background border border-border/50 text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20' 
                                : 'bg-secondary/50 text-muted-foreground/50 border border-transparent cursor-not-allowed'
                            }`}
                        >
                            <Upload size={12} className="mr-2" />
                            {row.agentInvoiceUrl ? 'Update Claim' : 'Submit Claim'}
                        </Button>
                    ) : (
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-30 flex items-center gap-1.5">
                            Pending Term
                        </span>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5">
                     <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tight leading-none text-shadow-sm">Financial Ledger</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Active Sync
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Track operational commissions, project pipeline value, and synchronize payouts.</p>
                </div>
                
                <Button onClick={handleExport} className="h-11 px-6 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all font-black text-[10px] uppercase tracking-widest">
                    <FileText size={16} className="mr-2" />
                    Export Ledger
                </Button>
            </div>

            {/* KYC Alert Banner */}
            {kycStatus !== 'verified' && (
                <div className="relative group bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgba(251,191,36,0.05)]">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-background border border-amber-500/20 rounded-[1.5rem] flex items-center justify-center text-amber-600 shadow-xl shadow-amber-900/5 transition-transform group-hover:scale-110 duration-500">
                                <AlertCircle size={32} />
                            </div>
                            <div className="space-y-1.5">
                                <h4 className="font-black text-foreground tracking-tight text-xl leading-none">Authentication Required</h4>
                                <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-[0.15em]">
                                    Status: <span className="text-amber-600 dark:text-amber-400 font-black">[{kycStatus === 'uninitiated' ? 'MISSING' : kycStatus?.toUpperCase() || 'UNKNOWN'}]</span>. Payout infrastructure locked.
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => window.location.href = '/agent/kyc'}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[10px] h-14 px-8 rounded-2xl shadow-xl shadow-amber-600/20 active:scale-[0.98] transition-all w-full md:w-auto"
                        >
                            Authorize Identity <ChevronRight size={16} className="ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-card/60 backdrop-blur-xl border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden group hover:border-emerald-500/20 hover:shadow-[0_20px_50px_rgba(16,185,129,0.05)] transition-all duration-500 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100%] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
                    <CardContent className="p-8 pb-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-700 shadow-sm relative z-10">
                                <Landmark size={24} />
                            </div>
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2">Liquidated Value</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-foreground tracking-tighter leading-none">₹{totalEarned.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-xl border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden group hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(6,96,252,0.05)] transition-all duration-500 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] pointer-events-none group-hover:bg-primary/10 transition-all duration-500" />
                    <CardContent className="p-8 pb-10">
                        <div className="flex justify-between items-start mb-6">
                             <div className="w-14 h-14 rounded-2xl bg-secondary/80 border border-border/50 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-sm relative z-10">
                                <Zap size={24} />
                            </div>
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-2">Pipeline Value</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-foreground tracking-tighter leading-none">₹{projectedPipeline.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-8 border-b border-border/30 bg-secondary/10">
                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <FileText size={18} />
                        </div>
                        Transaction Ledger
                    </h3>
                </div>
                <DataTable 
                    columns={columns} 
                    data={referrals} 
                    loading={loading} 
                    emptyMessage="No financial synchronization data available." 
                />
            </div>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-y-auto focus:ring-0">
                    <button 
                        onClick={() => setIsUploadOpen(false)}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors z-50 text-muted-foreground bg-white/50 backdrop-blur-sm shadow-sm"
                    >
                        <X size={20} />
                    </button>
                    <div className="p-10 border-b border-border/40 bg-secondary/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-background border border-border/60 flex items-center justify-center text-foreground shadow-sm">
                                <Landmark size={24} />
                            </div>
                            Claim Authorization
                        </DialogTitle>
                    </div>
                    <form onSubmit={handleInvoiceUpload} className="p-10 space-y-8">
                        <div className="p-6 bg-gradient-to-tr from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-[1.5rem] relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 text-emerald-500/20 pointer-events-none">
                                <ShieldCheck size={100} />
                            </div>
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <ShieldCheck className="text-emerald-600" size={16} />
                                <p className="text-[10px] text-emerald-600 uppercase tracking-widest font-black">Eligibility Verified</p>
                            </div>
                            <p className="text-xl font-black text-foreground tracking-tight mb-2 relative z-10">Node <span className="underline decoration-emerald-500/30 underline-offset-4">{selectedReferral?.candidateName}</span> synchronized!</p>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium max-w-sm relative z-10">You are authorized to execute the standardized commission bounty for this successful allocation.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase ml-1">Documentation URI</Label>
                                <Input 
                                    className="bg-secondary/30 border-transparent h-14 px-5 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold shadow-inner shadow-black/5 outline-none"
                                    placeholder="https://drive.google.com/..."
                                    value={invoiceUrl}
                                    onChange={(e) => setInvoiceUrl(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground mt-2 ml-1 leading-relaxed font-medium">Providing standardized documentation accelerates the administrative reconciliation sequence.</p>
                            </div>
                        </div>

                        <DialogFooter className="pt-6">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3"
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><Send size={18} /> Execute Claim</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Commissions;
