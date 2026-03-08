"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Claim {
  id: string;
  date: string;
  partyName: string;
  vehicleNumber: string;
  tyreModel: string;
  stencilNumber: string;
  claimDispatchDate: string;
  claimDispatchPlace: string;
  claimPassAmount: number | string | null;
  claimReturnDate: string | null;
}

interface ClaimTableProps {
  claims: Claim[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: string) => void;
  onDelete: (id: string) => void;
}

function getStatus(amount: number | string | null) {
  if (typeof amount === "number") return "passed";
  if (amount === "CANCEL") return "cancelled";
  return "pending";
}

function StatusBadge({ amount }: { amount: number | string | null }) {
  const status = getStatus(amount);

  const variants: Record<string, string> = {
    passed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  let label: string;
  if (status === "passed") {
    label = `₹${(amount as number).toLocaleString("en-IN")}`;
  } else if (status === "cancelled") {
    label = "CANCELLED";
  } else {
    label = "PENDING";
  }

  return (
    <Badge variant="outline" className={`${variants[status]} font-medium text-xs`}>
      {label}
    </Badge>
  );
}

function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
  if (column !== sortBy) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  return sortOrder === "asc" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ClaimTable({ claims, sortBy, sortOrder, onSort, onDelete }: ClaimTableProps) {
  const router = useRouter();
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    await onDelete(deleteDialog);
    setDeleting(false);
    setDeleteDialog(null);
  };

  const sortableHeaders = [
    { key: "date", label: "Date" },
    { key: "partyName", label: "Party Name" },
    { key: "tyreModel", label: "Tyre Model" },
    { key: "claimPassAmount", label: "Status / Amount" },
  ];

  if (claims.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-slate-400 text-lg font-medium">No claims found</p>
        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                {sortableHeaders.map((header) => (
                  <TableHead
                    key={header.key}
                    className="text-slate-400 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => onSort(header.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.label}
                      <SortIcon column={header.key} sortBy={sortBy} sortOrder={sortOrder} />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  Vehicle
                </TableHead>
                <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  Stencil
                </TableHead>
                <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  Dispatch
                </TableHead>
                <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow
                  key={claim.id}
                  className="border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell className="text-slate-300 text-sm font-mono">
                    {new Date(claim.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-white font-medium text-sm">
                    {claim.partyName}
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm max-w-[200px] truncate">
                    {claim.tyreModel}
                  </TableCell>
                  <TableCell>
                    <StatusBadge amount={claim.claimPassAmount} />
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm font-mono">
                    {claim.vehicleNumber || "—"}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm font-mono">
                    {claim.stencilNumber}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {claim.claimDispatchPlace}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-700/50 h-8 w-8 p-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-slate-800 border-slate-700"
                      >
                        <DropdownMenuItem
                          className="text-slate-300 hover:text-white focus:text-white focus:bg-slate-700 cursor-pointer"
                          onClick={() => router.push(`/edit/${claim.id}`)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                          onClick={() => setDeleteDialog(claim.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-slate-800 px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing {claims.length} claim{claims.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Claim</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this claim? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialog(null)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
