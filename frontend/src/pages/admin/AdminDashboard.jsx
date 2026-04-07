import React from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { 
    LayoutDashboard, Users, UserCheck, Briefcase,
    BookOpen, CreditCard, ShieldAlert, Shield, Trophy, BarChart3, Sparkles 
} from 'lucide-react';
import DashboardOverview from '@/components/DashboardOverview';

const AdminDashboard = () => {
    const { user } = useAuth();

    const menuItems = [
        { label: 'Operations', type: 'header' },
        { icon: <LayoutDashboard size={18} />, label: 'Command Center', path: '/admin/dashboard' },
        { icon: <Users size={18} />, label: 'Our Team', path: '/admin/team' },
        { icon: <UserCheck size={18} />, label: 'Agent Approvals', path: '/admin/approvals' },
        { icon: <ShieldAlert size={18} />, label: 'Verification Center', path: '/admin/kyc-management' },
        
        { label: 'Recruitment', type: 'header' },
        { icon: <Briefcase size={18} />, label: 'Job Inventory', path: '/admin/jobs' },
        { icon: <Users size={18} />, label: 'Hiring Pipeline', path: '/admin/referrals' },
        { icon: <Sparkles size={18} />, label: 'ATS Screening', path: '/admin/ats-tracker' },
        { icon: <BookOpen size={18} />, label: 'Recruitment Scripts', path: '/admin/scripts' },
        
        { label: 'Finance & Insights', type: 'header' },
        { icon: <CreditCard size={18} />, label: 'Finance Hub', path: '/admin/financials' },
        { icon: <Trophy size={18} />, label: 'Incentive Slabs', path: '/admin/incentives' },
        { icon: <BarChart3 size={18} />, label: 'Financial Audits', path: '/admin/reports' },
    ];

    const footerContent = (
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse flex-shrink-0" />
            <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">System Status</p>
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Operational</p>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            menuItems={menuItems}
            brandLabel="Forge India"
            brandSubtitle="Admin Core"
            brandIcon={<Shield size={20} />}
            footerContent={footerContent}
        >
            <div className="p-4 lg:p-8 space-y-10">
                <div className="flex flex-col gap-2 text-left">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">Command<span className="text-primary not-italic">.Center</span></h2>
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] ml-1">Real-time Global Operations Snapshot</p>
                </div>
                
                <DashboardOverview />
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
