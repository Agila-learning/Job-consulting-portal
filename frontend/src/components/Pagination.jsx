import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    pageSize = 10, 
    onPageSizeChange,
    totalItems = 0,
    pageSizeOptions = [10, 25, 50] 
}) => {
    if (totalPages <= 1 && !onPageSizeChange) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-border/40 bg-secondary/5">
            {/* Left: Item count & page size selector */}
            <div className="flex items-center gap-4">
                {totalItems > 0 && (
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {startItem}–{endItem} of {totalItems}
                    </span>
                )}
                {onPageSizeChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                            Show
                        </span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="h-8 px-2 bg-background border border-border/50 rounded-lg text-[10px] font-black outline-none cursor-pointer"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right: Page navigation */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 shadow-none"
                    >
                        <ChevronsLeft size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 shadow-none"
                    >
                        <ChevronLeft size={14} />
                    </Button>

                    <div className="flex items-center gap-1 px-2">
                        {generatePageNumbers(currentPage, totalPages).map((page, idx) => (
                            page === '...' ? (
                                <span key={`dots-${idx}`} className="w-8 text-center text-[10px] font-black text-muted-foreground/40">
                                    ···
                                </span>
                            ) : (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "ghost"}
                                    size="icon"
                                    onClick={() => onPageChange(page)}
                                    className={`h-8 w-8 rounded-lg text-[10px] font-black shadow-none transition-all ${
                                        currentPage === page 
                                            ? 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20' 
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                    }`}
                                >
                                    {page}
                                </Button>
                            )
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 shadow-none"
                    >
                        <ChevronRight size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-30 shadow-none"
                    >
                        <ChevronsRight size={14} />
                    </Button>
                </div>
            )}
        </div>
    );
};

// Generate smart page number array: [1, 2, '...', 8, 9, 10]
function generatePageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    
    const pages = [];
    if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
        pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
}

export default Pagination;
