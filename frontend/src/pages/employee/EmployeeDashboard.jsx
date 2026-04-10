import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import DashboardLayout from '@/components/DashboardLayout';
import { 
    LayoutDashboard, Users, Briefcase, BookOpen, 
    MessageSquare, Zap, Trophy, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, Outlet } from 'react-router-dom';
import DashboardOverview from '@/components/DashboardOverview';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const { toggleChat } = useUI();

    const menuItems = [
        { icon: <LayoutDashboard size={18} />, label: 'Command Center', path: '/employee/dashboard' },
        { icon: <Users size={18} />, label: 'My Candidates', path: '/employee/assigned-candidates' },
        { icon: <Briefcase size={18} />, label: 'Hiring Pipeline', path: '/employee/pipeline' },
        { icon: <Zap size={18} />, label: 'Job Inventory', path: '/employee/jobs' },
        { icon: <Trophy size={18} />, label: 'My Rewards', path: '/employee/incentives' },
        { icon: <BarChart3 size={18} />, label: 'Analytics & Reports', path: '/employee/performance-reports' },
        { icon: <BookOpen size={18} />, label: 'Recruitment Scripts', path: '/employee/scripts' },
        {
            icon: <MessageSquare size={18} />,
            label: 'Support Chat',
            action: toggleChat,
        },
    ];

    const footerContent = (
        <div className="flex items-center gap-3 bg-secondary/30 border border-border/50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'E'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Consultant</p>
                <p className="text-xs font-black text-foreground tracking-tight truncate">{user?.employeeId || 'FIC-EMP-001'}</p>
            </div>
        </div>
    );

    return (
        <DashboardLayout
            menuItems={menuItems}
            brandLabel="Forge India"
            brandSubtitle="Operations"
            brandIcon={<Zap size={20} className="fill-white" />}
            footerContent={footerContent}
        >
            <div className="p-0">
                <Outlet />
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;
