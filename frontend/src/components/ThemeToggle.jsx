import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground transition-all duration-300"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon size={18} className="text-slate-600 animate-in zoom-in duration-300" />
            ) : (
                <Sun size={18} className="text-yellow-400 animate-in zoom-in duration-300" />
            )}
        </Button>
    );
};

export default ThemeToggle;
