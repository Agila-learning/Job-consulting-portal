import React, { forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import logo from '@/assets/Updated-Logo-New.jpg';
import { FileText, Landmark, ShieldCheck, Mail, Phone, Globe } from 'lucide-react';

const InvoiceTemplate = forwardRef(({ transaction, recipient }, ref) => {
    if (!transaction) return null;

    const date = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const invoiceNumber = `FIC-INV-${transaction._id?.substring(0, 8).toUpperCase()}`;

    return (
        <div ref={ref} className="bg-white text-slate-900 p-12 w-full max-w-4xl mx-auto font-sans shadow-2xl border border-slate-100 rounded-[2rem]">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                <img src={logo} alt="Watermark" className="w-[800px] grayscale rotate-[-15deg] scale-150" />
            </div>

            {/* Header section */}
            <div className="flex justify-between items-start mb-16 relative z-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center p-2 shadow-xl">
                            <img src={logo} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">FORGE INDIA <span className="text-primary italic">CONNECT</span></h1>
                            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-400 mt-2">Workforce Engine Terminal</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="flex items-center gap-2 text-xs font-bold text-slate-600"><Mail size={12} /> accounts@forgeindiaconnect.com</p>
                        <p className="flex items-center gap-2 text-xs font-bold text-slate-600"><Globe size={12} /> www.forgeindiaconnect.com</p>
                    </div>
                </div>
                <div className="text-right space-y-2">
                    <Badge className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-xl mb-4">Official Tax Invoice</Badge>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document ID</p>
                        <p className="text-lg font-black text-slate-900">{invoiceNumber}</p>
                    </div>
                    <div className="space-y-1 pt-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Cycle</p>
                        <p className="text-sm font-bold text-slate-700">{date}</p>
                    </div>
                </div>
            </div>

            {/* GST & Entity Details Section */}
            <div className="grid grid-cols-2 gap-12 mb-16 relative z-10">
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" /> Service Provider Information
                    </h4>
                    <div>
                        <p className="text-md font-black text-slate-900 mb-1">FORGE INDIA CONNECT</p>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-[250px]">
                            Advanced Workforce Solutions & Recruitment Intelligence Hub, Chennai Node.
                        </p>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tax Registration (GST)</p>
                        <p className="text-sm font-black text-primary">33AAGCF4763Q1Z3</p>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Landmark size={14} className="text-indigo-600" /> Beneficiary / Partner Node
                    </h4>
                    <div>
                        <p className="text-md font-black text-slate-900 mb-1">{recipient?.name || 'Authorized Partner'}</p>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                            {recipient?.email}
                        </p>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Network Role</p>
                        <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase border-slate-300 text-slate-600">
                            {recipient?.role || 'Service Partner'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-16 relative z-10 overflow-hidden rounded-[2rem] border border-slate-100">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest italic">Success Identifier</th>
                            <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest italic">Mandate Allocation</th>
                            <th className="p-6 text-right text-[10px] font-black uppercase tracking-widest italic">Unit Bounty (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white italic">
                        <tr>
                            <td className="p-8">
                                <p className="text-md font-black text-slate-900 mb-1">{transaction.candidateName || 'Conversion Success'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol ID: {transaction._id?.substring(0, 12)}</p>
                            </td>
                            <td className="p-8">
                                <p className="text-sm font-black text-slate-700">{transaction.job?.jobTitle || 'Recruitment Service'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{transaction.job?.companyName || 'Success Placement'}</p>
                            </td>
                            <td className="p-8 text-right">
                                <p className="text-lg font-black text-slate-900">₹{(transaction.calculatedCommission || transaction.amount || 0).toLocaleString()}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Calculations Footer */}
            <div className="flex justify-end relative z-10">
                <div className="w-full max-w-sm space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-Total Value</p>
                        <p className="text-sm font-black text-slate-700">₹{(transaction.calculatedCommission || transaction.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center px-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tax Compliant (GST 0%)</p>
                        <p className="text-sm font-bold text-slate-700">₹0</p>
                    </div>
                    <div className="h-[2px] bg-slate-900 w-full" />
                    <div className="flex justify-between items-center p-6 bg-slate-900 rounded-2xl text-white">
                        <p className="text-xs font-black uppercase tracking-widest">Total Settled Amount</p>
                        <p className="text-2xl font-black italic underline decoration-primary underline-offset-8">₹{(transaction.calculatedCommission || transaction.amount || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Signature & Note */}
            <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-end relative z-10">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Declaration Hub</p>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-sm italic">
                            This is a system-generated electronic synchronization document for performance-based settlement. Valid across the Forge India Connect Partner Ecosystem.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                        <FileText size={14} /> AUTH-SEQ: LIC-EN-0012-V2
                    </div>
                </div>
                <div className="text-center space-y-4 pr-10">
                    <div className="h-10 border-b-2 border-slate-900 w-48 mx-auto" />
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Authorized Executioner</p>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
