"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  dispatchPlace: string;
  setDispatchPlace: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  dispatchPlaces: string[];
  onClear: () => void;
}

export default function Filters({
  search,
  setSearch,
  status,
  setStatus,
  dispatchPlace,
  setDispatchPlace,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  dispatchPlaces,
  onClear,
}: FiltersProps) {
  const hasFilters =
    search || status !== "all" || dispatchPlace !== "all" || dateFrom || dateTo;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-white"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              placeholder="Search party, vehicle, tyre, stencil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <Select value={status} onValueChange={(val) => setStatus(val as string)}>
          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Dispatch Place */}
        <Select value={dispatchPlace} onValueChange={(val) => setDispatchPlace(val as string)}>
          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="Dispatch Place" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Places</SelectItem>
            {dispatchPlaces.map((place) => (
              <SelectItem key={place} value={place}>
                {place}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white text-xs"
            placeholder="From"
          />
          <span className="text-slate-500 text-xs shrink-0">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white text-xs"
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
