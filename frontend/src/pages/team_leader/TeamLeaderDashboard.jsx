import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import DashboardLayout from '@/components/DashboardLayout';
import { 
    LayoutDashboard, Users, Briefcase, 
    MessageSquare, Zap, ShieldCheck, Sparkles, Plus, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, Outlet } from 'react-router-dom';
import DashboardOverview from '@/components/DashboardOverview';

const TeamLeaderDashboard = () => {
    const { user } = useAuth();
    const { toggleChat } = useUI();

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Command Center', path: '/team-leader/dashboard' },
        { icon: <Users size={18} />, label: 'Team Workforce', path: '/team-leader/team' },
        { icon: <Briefcase size={18} />, label: 'Hiring Pipeline', path: '/team-leader/pipeline' },
        { icon: <Sparkles size={18} />, label: 'ATS Screening', path: '/team-leader/ats-tracker' },
        { icon: <Zap size={18} />, label: 'Job Inventory', path: '/team-leader/jobs' },
        { icon: <BarChart3 size={18} />, label: 'Individual Performance', path: '/team-leader/performance-reports' },
        { icon: <Users size={18} />, label: 'Workforce Ledger', path: '/team-leader/workforce-reports' },
        {
            icon: <MessageSquare size={18} />,
            label: 'Support Chat',
            action: toggleChat,
        },
    ];

    const footerContent = (
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 font-black text-xs flex-shrink-0 shadow-inner">
                {user?.name?.charAt(0)?.toUpperCase() || 'TL'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-indigo-600/70 uppercase tracking-widest mb-0.5">Team Leader</p>
                <p className="text-xs font-black text-indigo-600 tracking-tight truncate">{user?.employeeId || 'FIC-TL-001'}</p>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            menuItems={menuItems}
            brandLabel="Forge India"
            brandSubtitle="Team Lead Node"
            brandIcon={<ShieldCheck size={20} className="fill-white" />}
            footerContent={footerContent}
        >
            <div className="p-0">
                <Outlet />
            </div>
        </DashboardLayout>
    );
};

export default TeamLeaderDashboard;
