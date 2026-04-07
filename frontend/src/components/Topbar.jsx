import React, { useState } from 'react';
import { Search, Bell, Menu, User, LogOut, Settings, HelpCircle, ChevronDown, ChevronRight, Plus, Zap, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Topbar = ({ title, showSidebarMobile }) => {
  const { user, logout } = useAuth();
  const { toggleChat, toggleNewAction, openNotifications, notifications } = useUI();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      const rolePath = user?.role === 'team_leader' ? 'team-leader' : user?.role;
      navigate(`/${rolePath}/referrals?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  return (
    <header className="h-[80px] bg-background border-b border-border/40 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-300 gap-4 shadow-sm">
      <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden w-10 h-10 rounded-xl hover:bg-secondary text-foreground" 
          onClick={showSidebarMobile}
        >
          <Menu size={20} />
        </Button>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-border/50 p-1 flex-shrink-0">
                <img src="/Updated-Logo-New.jpg" alt="FIC Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
                <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">{title || 'Command Center'}</h1>
                <p className="text-[9px] text-primary font-black tracking-[0.2em] uppercase mt-2 hidden sm:block">Operational Node Active</p>
            </div>
        </div>
      </div>

      {/* Global Search - Enhanced for Enterprise */}
      <div className="hidden md:flex items-center relative flex-1 max-w-[480px] group mx-4 lg:mx-10">
        <div className="absolute left-4 text-muted-foreground/30 transition-colors group-focus-within:text-primary z-10 transition-colors duration-300">
          <Search size={16} />
        </div>
        <Input 
          placeholder="Search jobs, candidates, or data..." 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearch}
          className="pl-11 h-12 bg-secondary/20 dark:bg-slate-900/60 border-border/40 hover:bg-secondary/40 dark:hover:bg-slate-900/80 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all rounded-2xl font-bold placeholder:text-muted-foreground/30 text-[11px] shadow-sm outline-none dark:border-white/5 dark:focus:border-primary/40 text-slate-900 dark:text-white"
        />
        <div className="absolute right-4 hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background border border-border/50 text-[10px] font-black text-muted-foreground/40 shadow-sm pointer-events-none group-focus-within:opacity-0 transition-opacity">
            <span className="text-[10px] opacity-60">⌘</span>K
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Quick Actions Group */}
        <div className="hidden xl:flex items-center gap-2 mr-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/10"
                onClick={toggleNewAction}
            >
                <Plus size={20} />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/10"
                onClick={toggleChat}
            >
                <MessageSquare size={20} />
            </Button>
        </div>

        <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationCenter />
        </div>

        <div className="w-px h-6 bg-border/40 mx-1 hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-12 gap-3 pl-2 pr-2 md:pr-3 rounded-2xl hover:bg-secondary/50 transition-all border border-transparent hover:border-border/50 focus-visible:ring-0 max-w-[50px] md:max-w-none">
              <div className="w-9 h-9 rounded-xl bg-primary shadow-[0_6px_15px_rgba(6,96,252,0.2)] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:flex flex-col items-start gap-1 text-left min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none tracking-tight truncate w-full">{user?.name || 'Authorized User'}</p>
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] flex-shrink-0" />
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-none truncate">{user?.role || 'CONSULTANT'}</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-3 rounded-[2.5rem] bg-background border-border/40 shadow-2xl mt-4 overflow-hidden border">
            <div className="p-5 mb-3 bg-secondary/10 rounded-[1.8rem] flex items-center gap-4 border border-border/30">
                 <div className="w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-white font-black text-lg">
                    {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="overflow-hidden">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight tracking-tight truncate">{user?.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight truncate mt-1">{user?.email}</p>
                </div>
            </div>
            
            <div className="px-2 pb-3 space-y-1">
                <DropdownMenuLabel className="font-black text-[9px] uppercase tracking-[0.25em] text-muted-foreground/50 px-4 py-2">Account Control</DropdownMenuLabel>
                <DropdownMenuItem 
                    onClick={() => {
                        const rolePath = user?.role === 'team_leader' ? 'team-leader' : user?.role;
                        window.location.href = `/${rolePath}/profile`;
                    }}
                    className="rounded-xl flex items-center gap-4 p-3.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-all focus:bg-primary/10 focus:text-primary group"
                >
                    <User size={16} className="text-muted-foreground group-hover:text-primary" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Global Profile</span>
                    <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl flex items-center gap-4 p-3.5 cursor-pointer hover:bg-primary/10 hover:text-primary transition-all focus:bg-primary/10 focus:text-primary group">
                    <Settings size={16} className="text-muted-foreground group-hover:text-primary" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Preferences</span>
                    <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </DropdownMenuItem>
            </div>
            
            <div className="py-2 px-2">
                <div className="h-px bg-border/40 my-2 mx-2" />
                <DropdownMenuItem onClick={logout} className="rounded-xl flex items-center gap-4 p-3.5 text-rose-500 focus:text-white focus:bg-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer transition-all mt-2 shadow-sm font-black text-[10px] uppercase tracking-widest">
                    <LogOut size={16} />
                    <span>Logout</span>
                </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar;
