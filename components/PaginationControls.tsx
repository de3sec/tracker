"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const PAGE_SIZES = [10, 20, 50, 100];

export default function PaginationControls({
  page,
  totalPages,
  totalCount,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const start = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalCount);

  if (totalCount === 0) {
    return (
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-500">Showing 0 claims</p>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500">
          Showing {start}–{end} of {totalCount} claim{totalCount !== 1 ? "s" : ""}
        </p>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">per page</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => onLimitChange(Number(v))}
            >
              <SelectTrigger className="h-7 w-16 bg-slate-800/50 border-slate-700 text-slate-300 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {PAGE_SIZES.map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="text-slate-300 focus:text-white focus:bg-slate-700"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-7 px-2 text-slate-400 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>
        <span className="text-xs text-slate-500 px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-7 px-2 text-slate-400 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
