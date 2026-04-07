import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Database, AlertCircle } from "lucide-react";
import Pagination from './Pagination';

const DataTable = ({ columns, data, loading, emptyMessage = "No relevant records found.", pageSize: initialPageSize = 10 }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const totalPages = Math.ceil(data.length / pageSize);
    const paginatedData = data.length > pageSize 
        ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : data;

    // Reset to page 1 when data changes significantly
    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    // Ensure currentPage is valid when data shrinks
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [data.length, totalPages, currentPage]);

    return (
        <div className="rounded-[2rem] border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in duration-500">
            <Table>
                <TableHeader className="bg-secondary/40">
                    <TableRow className="hover:bg-transparent border-border/50">
                        {columns.map((column, index) => (
                            <TableHead 
                                key={index} 
                                className="text-muted-foreground font-bold uppercase tracking-[0.1em] text-[10px] py-5 px-6"
                            >
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin opacity-20" />
                                        <Database className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Operational Data...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground text-sm font-medium italic">
                                        {emptyMessage}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedData.map((row, rowIndex) => (
                            <TableRow key={rowIndex} className="border-border/40 hover:bg-secondary/20 transition-colors group">
                                {columns.map((column, colIndex) => (
                                    <TableCell key={colIndex} className="py-5 px-6 text-foreground text-sm">
                                        {column.cell ? column.cell(row) : row[column.accessor]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {!loading && data.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    totalItems={data.length}
                />
            )}
        </div>
    );
};

export default DataTable;
