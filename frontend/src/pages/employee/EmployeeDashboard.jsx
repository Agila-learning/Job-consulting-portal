import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import DashboardLayout from '@/components/DashboardLayout';
import { 
    LayoutDashboard, Users, Briefcase, BookOpen, 
    MessageSquare, Zap, Trophy, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
            <div className="p-4 lg:p-8 space-y-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2 text-left">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">Operations<span className="text-primary not-italic">.Hub</span></h2>
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] ml-1">Consultant Throughput & Lifecycle Metrics</p>
                    </div>
                    <Link to="/employee/pipeline">
                        <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 flex gap-3">
                            <Plus size={16} /> Refer Candidate
                        </Button>
                    </Link>
                </div>
                
                <DashboardOverview />
            </div>
        </DashboardLayout>
    );
};

export default EmployeeDashboard;
