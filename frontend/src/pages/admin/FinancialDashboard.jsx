import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
    Wallet, CheckCircle, XCircle, ExternalLink, 
    DollarSign, ArrowUpRight, Scale, CreditCard,
    FileText, Loader2, Landmark, History, Focus,
    TrendingUp, ArrowDownRight, PieChart, BarChart3,
    Filter, Search, Download, ChevronRight, Zap,
    Calendar, User, Building, MoreHorizontal, Plus,
    ArrowRight
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import InvoiceTemplate from '@/components/Invoices/InvoiceTemplate';
import { useRef } from 'react';

const FinancialDashboard = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRows, setSelectedRows] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('NEFT/RTGS');
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const invoiceRef = useRef(null);

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const [refRes, grantRes] = await Promise.all([
                api.get('/referrals'),
                api.get('/incentives/grants')
            ]);
            
            // Filter only those that are joined or have a payout status
            const referralClaims = refRes.data.data
                .filter(r => r.status === 'Joined' || r.payoutStatus !== 'unearned')
                .map(r => ({ ...r, entryType: 'referral' }));
            
            const manualClaims = grantRes.data.data.map(g => ({
                ...g,
                entryType: 'manual',
                // Map fields to match referral structure for consistency
                referrer: g.recipient,
                calculatedCommission: g.amount,
                payoutStatus: g.status === 'paid' ? 'paid' : 'pending_approval',
                job: { jobTitle: g.reason, companyName: 'Manual Grant' }
            }));

            setClaims([...referralClaims, ...manualClaims]);
        } catch (err) {
            toast.error('Failed to access financial ledger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    const filteredClaims = claims.filter(claim => {
        const matchesSearch = (claim.referrer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (claim.job?.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : claim.payoutStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        if (claims.length === 0) {
            toast.error('No data to export');
            return;
        }

        const exportData = claims.map(claim => ({
            'Agent Name': claim.agent?.name,
            'Candidate': claim.candidateName,
            'Job Title': claim.job?.jobTitle,
            'Company': claim.job?.companyName,
            'Payable Amount': claim.calculatedCommission || claim.job?.incentiveAgent || 5000,
            'Status': claim.status,
            'Payment Method': claim.paymentMethod || 'N/A',
            'Settled At': claim.settledAt ? new Date(claim.settledAt).toLocaleDateString() : 'Pending'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        worksheet['!cols'] = [
            { wch: 25 }, // Agent
            { wch: 25 }, // Candidate
            { wch: 30 }, // Job
            { wch: 25 }, // Company
            { wch: 15 }, // Amount
            { wch: 12 }, // Status
            { wch: 15 }, // Method
            { wch: 15 }  // Date
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Settlements');
        
        XLSX.writeFile(workbook, `settlement_audit_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Audit Exported as Excel');
    };
    
    const handlePrintInvoice = () => {
        const content = invoiceRef.current;
        const printWindow = window.open('', '', 'height=1000,width=1200');
        printWindow.document.write('<html><head><title>FIC Master Invoice</title>');
        printWindow.document.write('<link rel="stylesheet" href="/src/index.css">'); // Use main styles
        printWindow.document.write('</head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    };

    const handlePayoutUpdate = async (status) => {
        setIsProcessing(true);
        try {
            if (selectedClaim.entryType === 'manual') {
                // Future implementation: update manual grant status
                // For now, let's assume we need a separate endpoint or reuse
                await api.patch(`/incentives/grants/${selectedClaim._id}`, { status: status === 'paid' ? 'paid' : 'pending' });
            } else {
                await api.patch(`/referrals/${selectedClaim._id}/status`, { 
                    payoutStatus: status,
                    payoutNotes: `Settled via ${paymentMethod} on ${new Date().toLocaleString()}`
                });
            }
            toast.success(`Settlement status updated to ${status.toUpperCase()}`);
            setIsApproveOpen(false);
            fetchClaims();
        } catch (err) {
            toast.error('Failed to update ledger status');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkSettle = async () => {
        if (!selectedRows.length) return;
        setIsProcessing(true);
        try {
            await api.patch('/referrals/bulk-update', { 
                ids: selectedRows, 
                payoutStatus: 'paid' 
            });
            toast.success(`Successfully settled ${selectedRows.length} liabilities`);
            setSelectedRows([]);
            fetchClaims();
        } catch (err) {
            toast.error('Bulk reconciliation protocol failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id, entryType) => {
        if (!window.confirm("CRITICAL: Purge this financial record permanently? This cannot be undone.")) return;
        try {
            if (entryType === 'manual') {
                await api.delete(`/incentives/grants/${id}`);
            } else {
                // For referrals, we probably want to reset the payout status instead of deleting the referral
                // But the user specifically asked for "delete option for each" in finance hub.
                // I'll implement a reset of payout status to 'unearned' or similar, or a hard delete if it's mock data.
                // Given the context of "deleting all mock data", I'll allow hard delete for now.
                await api.delete(`/referrals/${id}`);
            }
            toast.success('Financial Record Purged');
            fetchClaims();
        } catch (err) {
            toast.error('Purge Protocol Failure');
        }
    };

    const toggleRowSelection = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    // Summary Stats Logic
    const stats = {
        totalLiability: claims.filter(c => c.payoutStatus !== 'paid').reduce((acc, curr) => acc + parseInt(curr.calculatedCommission || curr.job?.incentiveAgent || 5000), 0),
        totalPaid: claims.filter(c => c.payoutStatus === 'paid').reduce((acc, curr) => acc + parseInt(curr.calculatedCommission || curr.job?.incentiveAgent || 5000), 0),
        pendingSettlements: claims.filter(c => c.payoutStatus === 'pending_approval').length,
        monthlyVelocity: claims.filter(c => c.payoutStatus === 'paid' && new Date(c.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).reduce((acc, curr) => acc + parseInt(curr.calculatedCommission || curr.job?.incentiveAgent || 5000), 0)
    };

    // Dynamic Chart Data Generation
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-GB', { weekday: 'short' });
    });

    const velocityData = last7Days.map(day => {
        const dayTotal = claims
            .filter(c => c.payoutStatus === 'paid' && new Date(c.updatedAt).toLocaleDateString('en-GB', { weekday: 'short' }) === day)
            .reduce((acc, curr) => acc + parseInt(curr.calculatedCommission || curr.job?.incentiveAgent || 0), 0);
        return { name: day, amount: dayTotal };
    });

    const agentData = Array.from(new Set(claims.map(c => c.referrer?.name))).slice(0, 5).map(name => ({
        name: name?.split(' ')[0] || 'Agent',
        earnings: claims.filter(c => c.referrer?.name === name && c.payoutStatus === 'paid').reduce((acc, curr) => acc + parseInt(curr.calculatedCommission || curr.job?.incentiveAgent || 0), 0)
    }));

    const columns = [
        {
            header: (
                <div className="flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border/40 accent-primary cursor-pointer"
                        onChange={(e) => {
                            if (e.target.checked) setSelectedRows(filteredClaims.map(c => c._id));
                            else setSelectedRows([]);
                        }}
                        checked={selectedRows.length === filteredClaims.length && filteredClaims.length > 0}
                    />
                </div>
            ),
            cell: (row) => (
                <div className="flex items-center justify-center">
                     <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-border/40 accent-primary cursor-pointer"
                        checked={selectedRows.includes(row._id)}
                        onChange={() => toggleRowSelection(row._id)}
                    />
                </div>
            )
        },
        {
            header: 'Payee Target',
            cell: (row) => (
                <div className="flex items-center gap-4 group/item cursor-pointer" onClick={() => { setSelectedClaim(row); setIsDetailsOpen(true); }}>
                    <div className="w-12 h-12 rounded-2xl bg-secondary dark:bg-slate-900 border border-border/60 flex items-center justify-center font-black text-slate-900 dark:text-white shadow-sm group-hover/item:bg-primary group-hover/item:text-white transition-all duration-300">
                        {row.referrer?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-black text-slate-900 dark:text-white text-[13px] tracking-tight leading-none mb-1.5 group-hover/item:text-primary transition-colors">
                            {row.type === 'team' ? 'Direct Team Grant' : row.referrer?.name}
                        </p>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className={`h-5 rounded-md px-1.5 text-[8px] font-black uppercase tracking-[0.2em] w-fit shadow-none border ${row.entryType === 'manual' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : row.sourceType === 'agent' ? 'bg-amber-500/5 text-amber-600 border-amber-500/20' : 'bg-blue-500/5 text-blue-600 border-blue-500/20'}`}>
                                {row.entryType === 'manual' ? 'Direct Bounty' : row.sourceType}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground/60 font-black tracking-widest uppercase">ID: {row._id.substring(row._id.length - 6)}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Job Context',
            cell: (row) => (
                <div className="space-y-1.5">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Building size={12} className="text-primary/60" /> {row.job?.jobTitle}
                    </p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-2">
                        <Calendar size={12} /> {new Date(row.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                </div>
            )
        },
        {
            header: 'Payable Amount',
            cell: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 p-2 px-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl w-fit shadow-sm group-hover:border-emerald-500/40 transition-all">
                        <DollarSign size={14} className="text-emerald-600" />
                        <span className="text-[13px] font-black tracking-tight text-emerald-600">₹{parseInt(row.calculatedCommission || row.job?.incentiveAgent || '5000').toLocaleString()}</span> 
                    </div>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-60">Net Payout</span>
                </div>
            )
        },
        {
            header: 'Financial Status',
            cell: (row) => (
                <Badge className={`rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-none border ${
                    row.payoutStatus === 'paid' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 
                    row.payoutStatus === 'pending_approval' ? 'bg-amber-500/5 text-amber-600 border-amber-500/20 animate-pulse' : 
                    'bg-slate-100 dark:bg-slate-900 text-muted-foreground border-border/60'
                }`}>
                    {row.payoutStatus === 'pending_approval' ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2 inline-block shadow-[0_0_8px_rgba(217,119,6,0.5)]"/> Pending</> : 
                     row.payoutStatus === 'paid' ? <><CheckCircle size={10} className="mr-2" /> {row.payoutStatus}</> : row.payoutStatus}
                </Badge>
            )
        },
        {
            header: 'Operations',
            cell: (row) => (
                <div className="flex items-center gap-3 child-btn-opacity group-hover:child-btn-opacity-100">
                    {row.payoutStatus !== 'paid' ? (
                        <Button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClaim(row);
                                setIsApproveOpen(true);
                            }}
                            className="h-10 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.15em] text-[10px] shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95 border-0"
                        >
                            Authorize
                        </Button>
                    ) : (
                    <Button 
                        variant="ghost" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(row);
                            setIsInvoiceOpen(true);
                        }}
                        className="h-10 px-4 rounded-xl border border-primary/20 text-primary bg-primary/5 font-black text-[9px] uppercase tracking-widest gap-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                        <FileText size={14} /> Invoice
                    </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row._id, row.entryType);
                        }}
                        className="h-10 w-10 p-0 rounded-xl border border-rose-500/10 text-rose-500/40 hover:text-rose-600 hover:bg-rose-500/10 transition-all"
                    >
                         <XCircle size={18} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* TOPBAR / HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-2">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.8rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl transform -rotate-6">
                            <Landmark size={24} />
                        </div>
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-3">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic uppercase">Partner<span className="text-primary not-italic">.Finance</span></h2>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] px-3">PROTECTED NODE</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium tracking-wide">Financial Settlement & Partner Payouts</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-card/40 backdrop-blur-xl p-2 rounded-[2rem] border border-border/40 shadow-sm">
                    <Button 
                        onClick={handleExport}
                        variant="ghost" 
                        className="h-12 px-8 rounded-2xl border border-transparent text-slate-900 dark:text-white hover:bg-primary/5 hover:text-primary font-black text-[11px] uppercase tracking-[0.2em] gap-3 transition-all group"
                    >
                        <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" /> Export Data
                    </Button>
                    {selectedRows.length > 0 && (
                        <>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2">{selectedRows.length} Selected</span>
                                <Button 
                                    onClick={handleBulkSettle}
                                    disabled={isProcessing}
                                    className="h-12 px-8 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] gap-3 shadow-xl shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all border-0"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <><History size={18} /> Bulk Action</>}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* FINANCIAL SUMMARY HUD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Pending Payouts', value: stats.totalLiability, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
                    { label: 'Total Paid Amount', value: stats.totalPaid, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
                    { label: 'Waiting Approval', value: stats.pendingSettlements, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
                    { label: 'Monthly Earnings', value: stats.monthlyVelocity, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-500/5', border: 'border-rose-500/20' },
                ].map((stat, i) => (
                    <div key={i} className="group bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 relative overflow-hidden text-left">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform group-hover:scale-150 duration-1000`} />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} border ${stat.border} flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:-translate-y-1`}>
                                <stat.icon size={26} />
                            </div>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">{stat.label}</p>
                            <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">
                                {stat.label.includes('Audit') ? stat.value : `₹${stat.value.toLocaleString()}`}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* PERFORMANCE ANALYSIS & FILTERS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 text-left">
                {/* VELOCITY TREND CHART */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group min-h-[400px]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp size={12} className="text-primary" /> Payout Velocity</h4>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Daily Settlement Trends</h3>
                            </div>
                        </div>
                        
                        <div className="h-[250px] min-h-[250px] w-full relative z-10">
                             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                                <AreaChart data={velocityData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--brand-blue)" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="var(--brand-blue)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="rgba(148,163,184,0.5)" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} tickMargin={15} />
                                    <YAxis hide />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 1)', border: 'none', borderRadius: '1.5rem', padding: '12px 20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                        labelStyle={{ color: '#94a7b4', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        itemStyle={{ color: '#fff', fontSize: '16px', fontWeight: 900 }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="var(--brand-blue)" strokeWidth={5} fillOpacity={1} fill="url(#colorAmt)" animationBegin={300} animationDuration={2000} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* AGENT EARNINGS CHART */}
                <div className="lg:col-span-3 space-y-8">
                     <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group min-h-[400px]">
                        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2"><BarChart3 size={12} className="text-emerald-500" /> Capital Allocation</h4>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic">Top Agent Disbursements</h3>
                            </div>
                        </div>

                        <div className="h-[250px] min-h-[250px] w-full relative z-10">
                             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                                <BarChart data={agentData}>
                                    <XAxis dataKey="name" stroke="rgba(148,163,184,0.5)" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} tickMargin={15} />
                                    <YAxis hide />
                                    <RechartsTooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'rgba(16, 185, 129, 1)', border: 'none', borderRadius: '1.5rem', padding: '12px 20px', boxShadow: '0 25px 50px -12px rgba(16,185,129,0.3)' }}
                                        labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}
                                        itemStyle={{ color: '#fff', fontSize: '16px', fontWeight: 900 }}
                                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Earnings']}
                                    />
                                    <Bar dataKey="earnings" radius={[12, 12, 12, 12]} barSize={40} animationBegin={500} animationDuration={2500}>
                                        {agentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : 'var(--brand-blue)'} opacity={index === 0 ? 1 : 0.4} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     </div>
                </div>

                {/* SEARCH/FILTER HUD */}
                <div className="lg:col-span-6">
                    <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-black/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[800px] h-full bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="flex items-center gap-4 shrink-0 px-2">
                                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary border border-white/20 shadow-xl">
                                    <Filter size={28} />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Command Filters</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full text-left">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Search Finance Records</Label>
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" size={18} />
                                        <Input 
                                            placeholder="Agent, Payment ID, or Job..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-16 bg-white/5 border-white/10 rounded-2xl text-[13px] font-black text-white pl-14 pr-16 focus:bg-white/10 transition-all border-0 focus:ring-2 focus:ring-primary/50 shadow-inner"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20"
                                        >
                                            <Search size={18} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Payment Status Filter</Label>
                                    <select 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full h-16 px-8 bg-white/5 border border-white/10 rounded-2xl text-xs font-black text-white outline-none cursor-pointer focus:bg-white/10 transition-all uppercase tracking-widest appearance-none shadow-inner"
                                    >
                                        <option value="all" className="bg-slate-900">Global View</option>
                                        <option value="pending_approval" className="bg-slate-900 text-amber-400">Pending Approval</option>
                                        <option value="processing" className="bg-slate-900 text-blue-400">In Process</option>
                                        <option value="paid" className="bg-slate-900 text-emerald-400">Completed Payouts</option>
                                        <option value="declined" className="bg-slate-900 text-rose-400">Declined/Cancelled</option>
                                    </select>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <div className="h-16 px-10 bg-white dark:bg-slate-800 rounded-2xl flex flex-col justify-center shadow-2xl border border-white/10 group/stat">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] group-hover/stat:text-primary transition-colors">Records Found</span>
                                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{filteredClaims.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN LEDGER TABLE */}
            <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[4rem] shadow-sm overflow-hidden group">
                <div className="p-12 border-b border-border/40 flex items-center justify-between bg-secondary/20 text-left">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-border/60 flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-transform">
                            <History size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[13px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Finance Summary</h3>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase">Payment History Ledger</h2>
                        </div>
                    </div>
                </div>
                <div className="px-4">
                    <DataTable 
                        columns={columns} 
                        data={filteredClaims} 
                        loading={loading} 
                        emptyMessage="Financial ledger is balanced. No pending settlements found." 
                    />
                </div>
            </div>

            {/* AUTHORIZATION MODAL */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent className="max-w-2xl bg-card border border-border/40 rounded-[4rem] p-0 shadow-[0_45px_90px_-20px_rgba(0,0,0,0.25)] overflow-hidden focus-visible:ring-0 z-[110]">
                    <div className="p-12 relative overflow-hidden bg-secondary/40 border-b border-border/40">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        
                        <DialogHeader className="relative z-10 text-left">
                            <DialogTitle className="text-4xl font-black tracking-tighter flex items-center gap-6 text-slate-900 dark:text-white">
                                <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl border-4 border-white/10">
                                    <Focus size={36} />
                                </div>
                                <div className="flex flex-col gap-1 items-start">
                                    Authorize Payout
                                    <span className="text-[11px] text-primary uppercase tracking-[0.4em] font-black leading-none mt-2">Payment Approval System</span>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-12 space-y-10 relative z-10 text-left">
                        {selectedClaim && (
                            <div className="space-y-8">
                                <div className="p-8 bg-card rounded-[2.5rem] border border-border/60 shadow-sm flex items-center justify-between group/row hover:border-primary/20 transition-all">
                                    <div className="flex gap-6 items-center">
                                        <div className="w-20 h-20 rounded-[2rem] bg-secondary dark:bg-slate-900 border border-border/60 flex items-center justify-center text-slate-900 dark:text-white text-3xl font-black shadow-sm group-hover/row:bg-primary group-hover/row:text-white transition-all">
                                            {selectedClaim.referrer?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-black mb-3 italic">Verified Partner Profile</p>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1.5">{selectedClaim.referrer?.name}</p>
                                            <p className="text-[11px] font-black tracking-[0.1em] uppercase text-muted-foreground/80">{selectedClaim.referrer?.email}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/5 text-primary border border-primary/20 uppercase text-[10px] font-black tracking-[0.2em] px-4 py-2 rounded-2xl shadow-sm h-fit italic">
                                        {selectedClaim.sourceType}
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1 italic">Protocol: Payment Interface Selection</Label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['NEFT/RTGS', 'UPI GATEWAY', 'INTER-LEDGER'].map((method) => (
                                            <button 
                                                key={method} 
                                                onClick={() => setPaymentMethod(method)}
                                                className={`h-16 rounded-2xl border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest ${paymentMethod === method ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-secondary/20 border-border/60 text-muted-foreground hover:bg-primary/5 hover:border-primary/20 hover:text-primary'}`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] space-y-2 group/val hover:bg-emerald-500/10 transition-all">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Net Payout Amount</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-emerald-600 tracking-tighter">₹{parseInt(selectedClaim.calculatedCommission || selectedClaim.job?.incentiveAgent || '5000').toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-slate-100 dark:bg-slate-900 border border-border/60 rounded-[2.5rem] space-y-2">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Associated Job</span>
                                        <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight truncate uppercase italic">{selectedClaim.job?.jobTitle}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2.5rem] flex items-start gap-5">
                            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600 shadow-sm">
                                <Scale size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] text-amber-600 font-black tracking-widest uppercase italic">Immutable Reconciliation</p>
                                <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Proceeding with settlement will log this transaction as <span className="font-black text-slate-900 dark:text-white uppercase italic">Settled</span> in the master ledger. Ensure capital presence before authorization.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 bg-secondary/30 border-t border-border/40 gap-6 flex-col md:flex-row">
                        <Button 
                            variant="ghost" 
                            onClick={() => handlePayoutUpdate('declined')}
                            className="h-16 bg-white dark:bg-slate-900 border border-border/60 text-rose-600 font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.8rem] flex-1 transition-all shadow-xl hover:bg-rose-500 hover:text-white hover:border-rose-500"
                        >
                            <XCircle size={18} className="mr-3" /> Revoke Settlement
                        </Button>
                        <Button 
                            disabled={isProcessing}
                            onClick={() => handlePayoutUpdate('paid')}
                            className="h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.8rem] flex-1 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-95 border-0"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} className="mr-3" /> Authorize Execution</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DETAIL DRAWER / COMPONENT DETAIL PANEL */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="fixed inset-y-0 right-0 w-full sm:max-w-lg h-full bg-card border-l border-border/40 p-0 shadow-2xl transition-transform duration-500 rounded-none z-[120]">
                    <div className="h-full flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900/40">
                         {selectedClaim && (
                            <>
                                <div className="p-10 bg-slate-900 text-white relative overflow-hidden shrink-0 text-left">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 border border-white/20 flex items-center justify-center text-white text-3xl font-black">
                                                {selectedClaim.referrer?.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-black tracking-tighter uppercase italic">{selectedClaim.referrer?.name}</h3>
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{selectedClaim.sourceType} PARTNER • ID: {selectedClaim._id.substring(selectedClaim._id.length-8)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3">VERIFIED AGENT</Badge>
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest px-3">LEDGER ACTIVE</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 space-y-12 text-left">
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-6 bg-primary rounded-full" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">Job Analytics</h4>
                                        </div>
                                        <div className="bg-card border border-border/40 rounded-[2.5rem] p-8 shadow-sm space-y-8 hover:border-primary/20 transition-colors">
                                            <div className="flex justify-between items-center group/info">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover/info:text-primary transition-colors">
                                                        <Zap size={18} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Candidate Object</span>
                                                </div>
                                                <span className="text-[13px] font-black text-slate-900 dark:text-white">{selectedClaim.candidateName}</span>
                                            </div>
                                            <div className="flex justify-between items-center group/info">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover/info:text-primary transition-colors">
                                                        <Building size={18} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Job</span>
                                                </div>
                                                <span className="text-[13px] font-black text-slate-900 dark:text-white italic">{selectedClaim.job?.jobTitle}</span>
                                            </div>
                                            <div className="flex justify-between items-center group/info">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-secondary dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover/info:text-primary transition-colors">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Logic Registered</span>
                                                </div>
                                                <span className="text-[13px] font-black text-slate-900 dark:text-white">{new Date(selectedClaim.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">Audit & History</h4>
                                        </div>
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 text-center group/payout hover:bg-emerald-500/10 transition-all">
                                            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform group-hover:rotate-12 transition-transform">
                                                <DollarSign size={36} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Total Settlement Value</span>
                                                <h3 className="text-5xl font-black text-emerald-600 tracking-tighter">₹{parseInt(selectedClaim.calculatedCommission || selectedClaim.job?.incentiveAgent || '5000').toLocaleString()}</h3>
                                            </div>
                                            <Badge variant="outline" className="mt-4 border-emerald-500/30 text-emerald-600 font-bold px-4 py-1.5 rounded-full uppercase text-[9px] tracking-widest">
                                                Audit Status: {selectedClaim.payoutStatus.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>

                                    {selectedClaim.payoutNotes && (
                                        <div className="space-y-6">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white ml-1">Reconciliation Notes</h4>
                                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-8 text-xs font-medium text-amber-700 leading-relaxed italic">
                                                {selectedClaim.payoutNotes}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-10">
                                        <Button 
                                            onClick={() => setIsDetailsOpen(false)}
                                            className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border-0"
                                        >
                                            Dismiss Protocol <ArrowRight size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </>
                         )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* INVOICE PREVIEW MODAL */}
            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="max-w-5xl bg-card border border-border/40 rounded-[3rem] p-0 shadow-2xl overflow-hidden focus-visible:ring-0 z-[150]">
                    <div className="p-10 border-b border-border/40 bg-secondary/30 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-xl">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-foreground">Invoice Preview</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tax Compliant Settlement Hub</p>
                            </div>
                         </div>
                         <Button 
                            onClick={handlePrintInvoice}
                            className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl shadow-xl shadow-primary/20"
                         >
                            <Download size={18} className="mr-2" /> Print Invoice
                         </Button>
                    </div>
                    <div className="p-10 bg-slate-100 dark:bg-slate-950/40 relative max-h-[70vh] overflow-y-auto custom-scrollbar">
                         <div ref={invoiceRef}>
                            <InvoiceTemplate transaction={selectedClaim} recipient={selectedClaim?.referrer} />
                         </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinancialDashboard;
