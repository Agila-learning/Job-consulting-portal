import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Outlet } from 'react-router-dom';
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
        { icon: <BarChart3 size={18} />, label: 'Global Pipeline', path: '/admin/pipeline' },
        { icon: <Sparkles size={18} />, label: 'ATS Screening', path: '/admin/ats-tracker' },
        { icon: <BookOpen size={18} />, label: 'Recruitment Scripts', path: '/admin/scripts' },
        
        { label: 'Finance & Insights', type: 'header' },
        { icon: <CreditCard size={18} />, label: 'Finance Hub', path: '/admin/financials' },
        { icon: <Trophy size={18} />, label: 'Incentive Slabs', path: '/admin/incentives' },
        { icon: <BarChart3 size={18} />, label: 'Individual Performance', path: '/admin/performance-reports' },
        { icon: <Users size={18} />, label: 'Workforce Ledger', path: '/admin/workforce-reports' },
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
            <div className="p-0">
                <Outlet />
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
