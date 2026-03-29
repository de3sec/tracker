"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import DashboardCards from "@/components/DashboardCards";
import Filters from "@/components/Filters";
import ClaimTable from "@/components/ClaimTable";
import Papa from "papaparse";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

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

interface Stats {
  total: number;
  totalPassedAmount: number;
  cancelled: number;
  pending: number;
  passed: number;
}

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalPassedAmount: 0,
    cancelled: 0,
    pending: 0,
    passed: 0,
  });
  const [dispatchPlaces, setDispatchPlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dispatchPlace, setDispatchPlace] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setPage(1);
  }, [search, status, dispatchPlace, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchClaims = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (dispatchPlace !== "all") params.set("dispatchPlace", dispatchPlace);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("page", String(page));
    params.set("limit", String(limit));

    try {
      const res = await fetch(`/api/claims?${params.toString()}`);
      const data = await res.json();
      setClaims(data.claims);
      setStats(data.stats);
      setDispatchPlaces(data.dispatchPlaces);
      setTotalCount(data.totalCount ?? data.claims.length);
      setTotalPages(data.totalPages ?? 1);
      setPage((p) =>
        data.totalPages && p > data.totalPages ? Math.max(1, data.totalPages) : p
      );
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setLoading(false);
    }
  }, [search, status, dispatchPlace, dateFrom, dateTo, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/claims/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClaims();
      }
    } catch (error) {
      console.error("Failed to delete claim:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setDispatchPlace("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const exportToCSV = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (dispatchPlace !== "all") params.set("dispatchPlace", dispatchPlace);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("limit", "0");

    try {
      const res = await fetch(`/api/claims?${params.toString()}`);
      const data = await res.json();
      const exportClaims = data.claims ?? [];

      if (!exportClaims || exportClaims.length === 0) {
        toast.error("No data to export");
        return;
      }

      const csvData = exportClaims.map((c: Claim) => ({
        Date: c.date,
        "Party Name": c.partyName,
        "Vehicle Number": c.vehicleNumber,
        "Tyre Model": c.tyreModel,
        "Stencil Number": c.stencilNumber,
        "Dispatch Date": c.claimDispatchDate || "",
        "Dispatch Place": c.claimDispatchPlace || "",
        "Passed Amount": c.claimPassAmount === null ? "" : c.claimPassAmount,
        "Return Date": c.claimReturnDate || "",
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `claims_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV Exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export CSV");
    }
  };

  const importCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedData = results.data.map((row: any) => ({
             date: row["Date"] || new Date().toISOString().split('T')[0],
             partyName: row["Party Name"] || "",
             vehicleNumber: row["Vehicle Number"] || "",
             tyreModel: row["Tyre Model"] || "",
             stencilNumber: row["Stencil Number"] || "",
             claimDispatchDate: row["Dispatch Date"] || null,
             claimDispatchPlace: row["Dispatch Place"] || null,
             claimPassAmount: row["Passed Amount"] === "CANCEL" ? "CANCEL" : (row["Passed Amount"] ? Number(row["Passed Amount"]) : null),
             claimReturnDate: row["Return Date"] || null,
          })).filter((r: any) => r.partyName && r.tyreModel && r.stencilNumber);

          if (formattedData.length === 0) {
            toast.error("No valid data found in CSV");
            return;
          }

          const res = await fetch("/api/claims/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedData)
          });

          if (res.ok) {
            toast.success(`Imported ${formattedData.length} claims successfully`);
            fetchClaims();
          } else {
            toast.error("Failed to import CSV data");
          }
        } catch (err) {
           console.error(err);
           toast.error("Error parsing CSV data");
        } finally {
           if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Track and manage all tyre claim entries
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white rounded-md transition-colors border border-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-slate-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={importCSV} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-md transition-colors font-medium text-sm shadow-sm shadow-blue-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-blue-500"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && <DashboardCards stats={stats} />}

        {/* Filters */}
        <Filters
          search={search}
          setSearch={setSearch}
          status={status}
          setStatus={setStatus}
          dispatchPlace={dispatchPlace}
          setDispatchPlace={setDispatchPlace}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dispatchPlaces={dispatchPlaces}
          onClear={clearFilters}
        />

        {/* Claims Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <>
            <ClaimTable
              claims={claims}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onDelete={handleDelete}
              totalCount={totalCount}
              page={page}
              limit={limit}
              totalPages={totalPages}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
