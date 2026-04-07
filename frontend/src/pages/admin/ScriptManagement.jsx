import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
    FileText, PlusCircle, Trash2, Copy, 
    Download, Search, Filter, BookOpen, 
    MessageSquare, FileCode, Clock, User,
    ChevronRight, MoreVertical, Globe, Layers
} from 'lucide-react';

const ScriptManagement = () => {
    const { user } = useAuth();
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        category: 'Initial Outreach',
        type: 'text',
        content: '',
        fileUrl: ''
    });

    const fetchScripts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/scripts');
            setScripts(res.data.data);
        } catch (err) {
            toast.error('Failed to access communication repository');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScripts();
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSelectChange = (id, value) => {
        setFormData({ ...formData, [id]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/scripts', formData);
            toast.success('Protocol published to network active state');
            setIsCreateOpen(false);
            setFormData({
                title: '',
                category: 'Initial Outreach',
                type: 'text',
                content: '',
                fileUrl: ''
            });
            fetchScripts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to publish protocol');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Retract this protocol from the active repository?')) {
            try {
                await api.delete(`/scripts/${id}`);
                toast.success('Protocol retracted');
                fetchScripts();
            } catch (err) {
                toast.error('Retraction failed');
            }
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Protocol copied to clipboard ready for execution');
    };

    const filteredScripts = scripts.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-foreground tracking-tight leading-none text-shadow-sm">Message Templates</h2>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Saved Templates
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">Standardized messages and guides for outreach.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input 
                            placeholder="Search protocol repository..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 w-[280px] bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-background font-bold shadow-sm transition-all"
                        />
                    </div>
                    {user.role === 'admin' && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger 
                                render={
                                    <Button className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98]">
                                        <PlusCircle size={18} className="mr-2" />
                                        Create Template
                                    </Button>
                                } 
                            />
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar bg-card/95 backdrop-blur-3xl border-border/40 rounded-[3rem] p-0 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] focus-visible:ring-0">
                                <div className="p-10 relative overflow-hidden bg-secondary/30 border-b border-border/40">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    
                                    <DialogHeader className="relative z-10">
                                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-4 text-foreground">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                                <FileCode size={28} />
                                            </div>
                                            <div className="flex flex-col gap-1 items-start">
                                                New Message Template
                                                <span className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black">Save a Reusable Message</span>
                                            </div>
                                        </DialogTitle>
                                    </DialogHeader>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8 p-10 bg-background/50 relative z-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Protocol Identifier</Label>
                                            <Input id="title" required value={formData.title} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="e.g. LinkedIn Closure Pitch" />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Operational Category</Label>
                                            <Select onValueChange={(val) => handleSelectChange('category', val)} defaultValue={formData.category}>
                                                <SelectTrigger className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                    <SelectValue placeholder="Outreach" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-border shadow-2xl bg-white dark:bg-slate-950 z-[110]">
                                                    <SelectItem value="Initial Outreach" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">Initial Outreach</SelectItem>
                                                    <SelectItem value="Screening" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">Screening</SelectItem>
                                                    <SelectItem value="Technical Pitch" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">Technical Pitch</SelectItem>
                                                    <SelectItem value="Closure Pitch" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">Closure Pitch</SelectItem>
                                                    <SelectItem value="Onboarding" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">Onboarding</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Transmission Format</Label>
                                            <Select onValueChange={(val) => handleSelectChange('type', val)} defaultValue={formData.type}>
                                                <SelectTrigger className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none">
                                                    <SelectValue placeholder="Text Content" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-border shadow-2xl bg-white dark:bg-slate-950 z-[110]">
                                                    <SelectItem value="text" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">Digital Text Payload</SelectItem>
                                                    <SelectItem value="file" className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer transition-colors m-1 font-bold text-sm">External File Resource</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {formData.type === 'file' && (
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Resource Locator (URL)</Label>
                                                <Input id="fileUrl" required value={formData.fileUrl} onChange={handleChange} className="h-14 bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl font-bold px-4 shadow-sm outline-none" placeholder="https://resource-link.com" />
                                            </div>
                                        )}
                                    </div>
                                    {formData.type === 'text' && (
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Payload Content</Label>
                                            <Textarea id="content" required value={formData.content} onChange={handleChange} className="bg-background border border-border/50 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-2xl min-h-[160px] p-4 font-medium shadow-sm outline-none resize-none" placeholder="Enter standard operations talk-track content here..." />
                                        </div>
                                    )}
                                    <DialogFooter className="pt-6 border-t border-border/40">
                                        <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex gap-3">
                                            <Globe size={18} />
                                            Save Template
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Script Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredScripts.length > 0 ? filteredScripts.map((script) => (
                    <Card key={script._id} className="group bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden hover:bg-card/80 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(var(--primary),0.1)] transition-all duration-300">
                        <CardContent className="p-0">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-500`}>
                                        {script.type === 'text' ? <MessageSquare size={24} /> : <FileText size={24} />}
                                    </div>
                                    <Badge variant="outline" className="rounded-xl px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] bg-secondary border-border/50 text-muted-foreground shadow-sm">
                                        {script.category}
                                    </Badge>
                                </div>
                                <h3 className="text-xl font-black text-foreground tracking-tight line-clamp-1 mb-3 group-hover:text-primary transition-colors">{script.title}</h3>
                                {script.type === 'text' ? (
                                    <p className="text-sm font-medium text-muted-foreground line-clamp-3 leading-relaxed mb-6">
                                        {script.content}
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-2xl border border-secondary mb-6 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                        <FileText size={24} className="text-primary" />
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-black text-foreground truncate">External PDF Resource</p>
                                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Document Secured</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between pt-6 border-t border-border/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-secondary border border-border/50 flex items-center justify-center text-primary text-[10px] font-black shadow-sm">
                                            {script.createdBy?.name?.charAt(0) || 'A'}
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{script.createdBy?.name || 'Admin Core'}</p>
                                            <span className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black">Author</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {script.type === 'text' ? (
                                            <Button onClick={() => copyToClipboard(script.content)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors shadow-none">
                                                <Copy size={16} />
                                            </Button>
                                        ) : (
                                            <a href={script.fileUrl} target="_blank" rel="noreferrer">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors shadow-none">
                                                    <Download size={16} />
                                                </Button>
                                            </a>
                                        )}
                                        {user.role === 'admin' && (
                                            <Button onClick={() => handleDelete(script._id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-colors shadow-none">
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card/60 backdrop-blur-xl border border-border/40 rounded-[2.5rem] shadow-sm">
                        <div className="w-20 h-20 rounded-3xl bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground mb-4">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">No Templates Found</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">Try searching for something else or create a new template.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScriptManagement;
