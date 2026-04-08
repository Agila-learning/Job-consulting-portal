import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
    Search, ShieldCheck, CheckCircle2, XCircle, 
    Eye, ExternalLink, User, Landmark, 
    CreditCard, FileText, Smartphone, Mail,
    ShieldAlert, Fingerprint, Banknote, Shield
} from 'lucide-react';

const KYCManagement = () => {
    const [kycs, setKycs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedKYC, setSelectedKYC] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchKYCs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/kyc/all');
            setKycs(res.data.data);
        } catch (err) {
            toast.error('Failed to load compliance clearances');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKYCs();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        setSubmitting(true);
        try {
            await api.patch(`/kyc/${id}/status`, { status, rejectionReason });
            toast.success(`Clearance ${status === 'verified' ? 'Authorized' : 'Restricted'} successfully`);
            setIsReviewOpen(false);
            setRejectionReason('');
            fetchKYCs();
        } catch (err) {
            toast.error('Verification update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            header: 'Entity Identity',
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center font-black text-foreground shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        {row.agent?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-black text-foreground text-sm tracking-tight leading-none mb-1.5">{row.agent?.name}</p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">{row.agent?.email}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Identity Credentials',
            cell: (row) => (
                <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                        <Badge variant="outline" className="h-5 px-1.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] bg-secondary/50 text-muted-foreground border-border/50 shadow-none">UIDAI</Badge>
                        <span className="text-[10px] text-foreground font-mono font-black tracking-widest">{row.aadhaarNumber}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Badge variant="outline" className="h-5 px-1.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] bg-secondary/50 text-muted-foreground border-border/50 shadow-none">ITD-PAN</Badge>
                        <span className="text-[10px] text-foreground font-mono font-black tracking-widest">{row.panNumber}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Settlement Ledger',
            cell: (row) => (
                <div className="space-y-1.5 pl-2 border-l border-border/40">
                    <p className="text-[10px] text-foreground font-black uppercase tracking-[0.2em]">{row.bankName}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-black tracking-[0.2em]">
                        <Landmark size={12} className="text-primary/50" />
                        <span className="uppercase">{row.ifscCode}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Compliance Status',
            cell: (row) => (
                <Badge className={`rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border ${
                    row.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' :
                    row.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm' :
                    'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-sm'
                }`}>
                    {row.status}
                </Badge>
            )
        },
        {
            header: 'Security Review',
            cell: (row) => (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border-border/50 hover:bg-background shadow-sm hover:text-primary hover:border-primary/50 transition-all hover:scale-[1.03]"
                    onClick={() => { setSelectedKYC(row); setIsReviewOpen(true); }}
                >
                    <Eye size={16} className="mr-2" /> Execute Audit
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black tracking-tight leading-none text-shadow-sm" style={{ color: 'var(--section-kyc)' }}>Security & Governance</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            KYC Gateway
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Audit identity credentials and enforce financial settlement governance across the network.</p>
                </div>
            </div>

            {/* Main Data View */}
            <div className="bg-card/95 dark:bg-slate-900 border border-border/40 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="p-8 border-b border-border/30 bg-secondary/10 flex items-center justify-between">
                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <ShieldAlert size={18} />
                        </div>
                        Compliance Clearances
                    </h3>
                </div>
                <DataTable 
                    columns={columns} 
                    data={kycs} 
                    loading={loading} 
                    emptyMessage="No pending compliance clearances found in the primary directory."
                />
            </div>

            {selectedKYC && (
                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                    <DialogContent className="max-w-4xl bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden focus-visible:ring-0">
                        <div className="p-10 border-b border-border/40 bg-secondary/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-20 h-20 bg-background border border-border/50 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                    <ShieldCheck size={36} />
                                </div>
                                <div className="space-y-1.5">
                                    <DialogTitle className="text-3xl font-black tracking-tight leading-none mb-1 text-foreground">Identity Compliance Audit</DialogTitle>
                                    <DialogDescription className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Reviewing sensitive credentials for <span className="text-primary px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">{selectedKYC.agent?.name}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar bg-background/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Identity Documents */}
                                <section className="space-y-6">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        <Fingerprint size={14} className="text-primary/70" /> Identity Repository
                                    </h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Aadhaar (Primary UIDAI)', url: selectedKYC.aadhaarFront },
                                            { label: 'Permanent Account Number', url: selectedKYC.panCard }
                                        ].map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-5 bg-card border border-border/50 hover:border-primary/30 rounded-2xl transition-all group/doc shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover/doc:bg-primary/10 group-hover/doc:text-primary transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <span className="text-xs font-black text-foreground/90 uppercase tracking-widest">{doc.label}</span>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl" asChild>
                                                    <a href={`${BASE_URL.replace(/\/$/, '')}/${doc.url?.replaceAll('\\', '/').replace(/^\//, '')}`} target="_blank" rel="noopener noreferrer">
                                                        Explore <ExternalLink size={14} className="ml-2" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Banking Details */}
                                <section className="space-y-6">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        <Banknote size={14} className="text-emerald-500/70" /> Settlement Credentials
                                    </h4>
                                    <div className="p-6 bg-card rounded-2xl border border-border/50 hover:border-emerald-500/30 transition-all space-y-6 shadow-sm">
                                        <div className="space-y-1.5 border-b border-border/40 pb-5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Financial Institution</p>
                                            <p className="text-xl font-black text-foreground tracking-tight leading-none uppercase">{selectedKYC.bankName}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 pt-1">
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Account Serial</p>
                                                <p className="text-sm font-mono font-black text-foreground tracking-widest">{selectedKYC.accountNumber}</p>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">IFSC Routing</p>
                                                <p className="text-sm font-mono font-black text-foreground tracking-widest uppercase">{selectedKYC.ifscCode}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {selectedKYC.status !== 'verified' && (
                                <div className="space-y-4 pt-6 mt-6 border-t border-border/40">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Compliance Discrepancy Log (Internal)</Label>
                                    <Textarea 
                                        placeholder="Document any irregularities, verification failures, or specify reasons for re-upload requests..."
                                        className="min-h-[120px] bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-rose-500/20 rounded-2xl p-5 text-sm font-medium shadow-sm resize-none outline-none"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-8 bg-secondary/30 border-t border-border/40 gap-4 flex-col sm:flex-row relative z-10">
                            <Button 
                                variant="outline" 
                                className="h-14 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 font-black text-xs uppercase tracking-widest rounded-2xl flex-1 shadow-sm transition-all"
                                onClick={() => handleUpdateStatus(selectedKYC._id, 'rejected')}
                                disabled={submitting}
                            >
                                <XCircle size={18} className="mr-2.5" /> Reject Discovery
                            </Button>
                            <Button 
                                className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex-1 md:flex-[2] shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] border-none"
                                onClick={() => handleUpdateStatus(selectedKYC._id, 'verified')}
                                disabled={submitting}
                            >
                                <CheckCircle2 size={18} className="mr-2.5" /> Authorize Governance
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default KYCManagement;
