import ClaimForm from "@/components/ClaimForm";
import Navbar from "@/components/Navbar";

export default function AddClaimPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <ClaimForm mode="add" />
    </div>
  );
}
