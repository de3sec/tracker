"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import ClaimForm from "@/components/ClaimForm";
import Navbar from "@/components/Navbar";

interface ClaimData {
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

export default function EditClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClaim() {
      try {
        const res = await fetch("/api/claims");
        const data = await res.json();
        const found = data.claims.find(
          (c: ClaimData) => c.id === id
        );
        if (found) {
          setClaim(found);
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    fetchClaim();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
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
      </div>
    );
  }

  if (!claim) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <ClaimForm mode="edit" initialData={claim} />
    </div>
  );
}
