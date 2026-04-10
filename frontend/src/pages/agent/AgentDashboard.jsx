import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { 
    LayoutDashboard, Users, Briefcase, 
    ShieldCheck, Wallet, Zap, Trophy
} from 'lucide-react';
import DashboardOverview from '@/components/DashboardOverview';

const AgentDashboard = () => {
    const { user } = useAuth();

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Command Center', path: '/agent/dashboard' },
        { icon: <Zap size={18} />, label: 'Target Jobs', path: '/agent/jobs' },
        { icon: <Briefcase size={18} />, label: 'Hiring Pipeline', path: '/agent/pipeline' },
        { icon: <Users size={18} />, label: 'My Referrals', path: '/agent/referrals' },
        { icon: <ShieldCheck size={18} />, label: 'KYC Status', path: '/agent/kyc' },
        { icon: <Wallet size={18} />, label: 'Commissions', path: '/agent/commissions' },
        { icon: <Trophy size={18} />, label: 'Earnings Hub', path: '/agent/incentives' },
        { icon: <BarChart3 size={18} />, label: 'Analytics & Reports', path: '/agent/performance-reports' },
    ];

    const footerContent = (
        <div className="bg-secondary/30 border border-border/50 rounded-xl p-3">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Partner Entity</p>
            <p className="text-xs font-black text-foreground tracking-tight truncate">{user?.agencyName || 'Verified Partner'}</p>
        </div>
    );

    return (
        <DashboardLayout
            menuItems={menuItems}
            brandLabel="Forge India"
            brandSubtitle="Partner Node"
            brandIcon={<Zap size={20} className="fill-white" />}
            footerContent={footerContent}
        >
            <div className="p-0">
                <Outlet />
            </div>
        </DashboardLayout>
    );
};

export default AgentDashboard;
