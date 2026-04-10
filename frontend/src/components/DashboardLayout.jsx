import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import Topbar from '@/components/Topbar';
import { Button } from '@/components/ui/button';
import ReferralChat from '@/components/ReferralChat';
import ChatList from '@/components/ChatList';
import { X, MessageSquare, Plus, Bell, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Reusable sidebar layout shell for Admin, Employee, and Agent dashboards.
 */
const DashboardLayout = ({ menuItems, brandLabel, brandSubtitle, brandIcon, footerContent }) => {
    const { user } = useAuth();
    const { 
        isChatOpen, closeChat, 
        isNotificationsOpen, closeNotifications, notifications, clearNotifications,
        isNewActionOpen, closeNewAction, 
        activeThread, openChat 
    } = useUI();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => path && location.pathname === path;
    const currentModule = menuItems.find(item => item.path && isActive(item.path))?.label || 'Command Center';

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">

            {/* ── Mobile Backdrop ──────────────────────────── */}
            {(isMobileOpen || isChatOpen) && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={() => {
                        setIsMobileOpen(false);
                        closeChat();
                    }}
                />
            )}

            {/* ── Sidebar ───────────────────────────────────── */}
            <aside className={`
                fixed lg:static top-0 left-0 h-full flex flex-col
                w-[272px] bg-background lg:bg-card border-r border-border/50
                z-50 shadow-2xl lg:shadow-none
                transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex items-center justify-between px-6 py-8 border-b border-border/40 flex-shrink-0 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4">
                        <Link 
                            to={`/${user?.role === 'admin' ? 'admin' : user?.role === 'employee' ? 'employee' : user?.role === 'agent' ? 'agent' : 'team-leader'}/dashboard`}
                            className="w-11 h-11 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-transform bg-white/10 p-1 border-2 border-primary/20"
                        >
                            <img src="/Updated-Logo-New.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
                        </Link>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">{brandLabel}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                <p className="text-[9px] text-primary font-black tracking-[0.25em] uppercase leading-none">
                                    {brandSubtitle}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost" size="icon"
                        className="md:hidden h-9 w-9 rounded-xl text-muted-foreground hover:bg-secondary flex-shrink-0"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <X size={18} />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {menuItems.map((item, idx) => {
                        if (item.type === 'header') {
                            return (
                                <div key={`header-${idx}`} className="px-4 pt-6 pb-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                                        {item.label}
                                    </p>
                                </div>
                            );
                        }

                        const active = isActive(item.path);
                        const baseClass = `
                            group w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl 
                            transition-all duration-200 relative text-left
                            ${active
                                ? 'bg-primary/10 text-primary font-black border border-primary/15'
                                : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground font-semibold border border-transparent'}
                        `;

                        const inner = (
                            <>
                                {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r-full shadow-[2px_0_8px_rgba(6,96,252,0.4)]" />
                                )}
                                <span className={`flex-shrink-0 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span className="text-[13px] tracking-tight flex-1 truncate">{item.label}</span>
                                {item.badge && (
                                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center flex-shrink-0">
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        );

                        return item.action ? (
                            <button key={idx} onClick={() => { item.action(); setIsMobileOpen(false); }} className={baseClass}>
                                {inner}
                            </button>
                        ) : (
                            <Link key={idx} to={item.path} onClick={() => setIsMobileOpen(false)} className={baseClass}>
                                {inner}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                {footerContent && (
                    <div className="px-4 py-4 border-t border-border/40 flex-shrink-0">
                        {footerContent}
                    </div>
                )}
            </aside>

            {/* ── Content Area ─────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Topbar title={currentModule} showSidebarMobile={() => setIsMobileOpen(true)} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-[1600px] mx-auto w-full p-3 sm:p-6 lg:p-10">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* ── Global Chat Drawer ─────────────────────── */}
            <div className={`
                fixed top-0 right-0 h-full w-full sm:w-[420px] z-50
                bg-card border-l border-border/50 shadow-2xl
                flex flex-col overflow-hidden
                transition-transform duration-300 ease-in-out
                ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-secondary/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                            {activeThread ? <div className="font-black text-xs">{activeThread.name?.charAt(0)}</div> : <MessageSquare size={16} />}
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground tracking-tight leading-none truncate max-w-[200px]">
                                {activeThread ? activeThread.name : 'Internal Communications'}
                            </h3>
                            <p className="text-[9px] text-emerald-500 font-black tracking-widest uppercase mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {activeThread ? 'Secure Thread' : 'Select Transmission'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {activeThread && (
                            <Button 
                                variant="ghost" size="icon" 
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-secondary"
                                onClick={() => openChat(null)} 
                            >
                                <ArrowLeft size={16} />
                            </Button>
                        )}
                        <Button
                            variant="ghost" size="icon"
                            className="rounded-xl h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            onClick={closeChat}
                        >
                            <X size={16} />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    {activeThread ? (
                        <ReferralChat 
                            referralId={activeThread.type === 'referral' ? activeThread.id : null}
                            recipientId={activeThread.type === 'direct' ? activeThread.id : null}
                            candidateName={activeThread.name}
                        />
                    ) : (
                        <ChatList onSelectThread={(thread) => openChat(thread)} />
                    )}
                </div>
            </div>

            {/* ── Notification Drawer ───────────────────── */}
            <div className={`
                fixed top-0 right-0 h-full w-full sm:w-[420px] z-50
                bg-card border-l border-border/50 shadow-2xl
                flex flex-col overflow-hidden
                transition-transform duration-300 ease-in-out
                ${isNotificationsOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-secondary/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground tracking-tight leading-none">System Telemetry</h3>
                            <p className="text-[9px] text-muted-foreground font-black tracking-widest uppercase mt-1">Operational Alerts</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost" size="icon"
                        className="rounded-xl h-9 w-9 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        onClick={closeNotifications}
                    >
                        <X size={18} />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {notifications?.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 opacity-40">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                                <Zap size={32} className="text-muted-foreground" />
                            </div>
                            <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">System nominal</p>
                            <p className="text-[9px] mt-2 text-muted-foreground font-medium">No new operational alerts in your domain scope.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className="p-4 rounded-3xl bg-secondary/30 border border-border/40 hover:border-primary/20 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                <div className="flex justify-between items-start mb-1 gap-4">
                                    <h4 className="text-xs font-black text-foreground leading-none tracking-tight group-hover:text-primary transition-colors cursor-pointer">{notif.title}</h4>
                                    <span className="text-[9px] font-bold text-muted-foreground/60 whitespace-nowrap bg-background px-2 py-0.5 rounded-lg border border-border/40">{notif.time}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium mt-2">{notif.message}</p>
                            </div>
                        ))
                    )}
                </div>
                {notifications?.length > 0 && (
                    <div className="p-4 border-t border-border/40 bg-secondary/5">
                        <Button 
                            variant="outline" 
                            className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-border/50 text-muted-foreground hover:bg-background hover:text-foreground"
                            onClick={clearNotifications}
                        >
                            Decommission All Alerts
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Quick Actions Overlay (New Sequence) ────── */}
            {isNewActionOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeNewAction} />
                    <div className="relative w-full max-w-lg bg-card border border-border/40 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black tracking-tight text-foreground">Quick Operations</h3>
                            <Button variant="ghost" size="icon" onClick={closeNewAction} className="rounded-xl"><X size={20} /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="h-32 flex-col gap-3 rounded-3xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group" onClick={() => { 
                                closeNewAction(); 
                                const rolePath = user.role?.replace('_', '-');
                                navigate(`/${rolePath}/jobs`);
                                toast.success('Initializing Mandate Pipeline...'); 
                            }}>
                                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all"><Plus size={24} /></div>
                                <span className="font-black text-[10px] uppercase tracking-widest leading-none">New Mandate</span>
                            </Button>
                            <Button variant="outline" className="h-32 flex-col gap-3 rounded-3xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group" onClick={() => { 
                                closeNewAction(); 
                                const rolePath = user.role?.replace('_', '-');
                                const target = user.role === 'agent' ? `/${rolePath}/jobs` : 
                                               user.role === 'employee' ? `/${rolePath}/pipeline` : 
                                               `/${rolePath}/pipeline`;
                                
                                navigate(target);
                                toast.success('Initializing Referral Protocol...'); 
                            }}>
                                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all"><Plus size={24} /></div>
                                <span className="font-black text-[10px] uppercase tracking-widest leading-none">New Referral</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
