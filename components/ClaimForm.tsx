"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClaimFormData {
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

interface ClaimFormProps {
  initialData?: ClaimFormData & { id: string };
  mode: "add" | "edit";
}

interface FormErrors {
  [key: string]: string;
}

export default function ClaimForm({ initialData, mode }: ClaimFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<ClaimFormData>({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    partyName: initialData?.partyName || "",
    vehicleNumber: initialData?.vehicleNumber || "",
    tyreModel: initialData?.tyreModel || "",
    stencilNumber: initialData?.stencilNumber || "",
    claimDispatchDate:
      initialData?.claimDispatchDate ||
      new Date().toISOString().split("T")[0],
    claimDispatchPlace: initialData?.claimDispatchPlace || "",
    claimPassAmount: initialData?.claimPassAmount ?? null,
    claimReturnDate: initialData?.claimReturnDate || "",
  });

  const [amountType, setAmountType] = useState<string>(
    initialData?.claimPassAmount === "CANCEL"
      ? "cancel"
      : typeof initialData?.claimPassAmount === "number"
      ? "amount"
      : "pending"
  );

  const [amountValue, setAmountValue] = useState<string>(
    typeof initialData?.claimPassAmount === "number"
      ? String(initialData.claimPassAmount)
      : ""
  );

  useEffect(() => {
    if (amountType === "cancel") {
      setFormData((prev) => ({ ...prev, claimPassAmount: "CANCEL" }));
    } else if (amountType === "amount") {
      const num = parseFloat(amountValue);
      setFormData((prev) => ({
        ...prev,
        claimPassAmount: isNaN(num) ? null : num,
      }));
    } else {
      setFormData((prev) => ({ ...prev, claimPassAmount: null }));
    }
  }, [amountType, amountValue]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.partyName || formData.partyName.trim().length < 2)
      newErrors.partyName = "Party name is required (min 2 characters)";
    if (!formData.tyreModel || formData.tyreModel.trim().length === 0)
      newErrors.tyreModel = "Tyre model is required";
    if (!formData.stencilNumber || formData.stencilNumber.trim().length === 0)
      newErrors.stencilNumber = "Stencil number is required";
    if (!formData.claimDispatchDate)
      newErrors.claimDispatchDate = "Dispatch date is required";
    if (
      formData.claimDispatchDate &&
      formData.date &&
      formData.claimDispatchDate < formData.date
    )
      newErrors.claimDispatchDate =
        "Dispatch date must be on or after entry date";
    if (
      !formData.claimDispatchPlace ||
      formData.claimDispatchPlace.trim().length === 0
    )
      newErrors.claimDispatchPlace = "Dispatch place is required";

    if (amountType === "amount") {
      const num = parseFloat(amountValue);
      if (isNaN(num) || num <= 0)
        newErrors.claimPassAmount = "Amount must be a positive number";
    }

    if (
      formData.claimReturnDate &&
      formData.claimDispatchDate &&
      formData.claimReturnDate < formData.claimDispatchDate
    )
      newErrors.claimReturnDate =
        "Return date must be on or after dispatch date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const url =
        mode === "add"
          ? "/api/claims"
          : `/api/claims/${initialData?.id}`;
      const method = mode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save claim");
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: keyof ClaimFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-slate-400 hover:text-white mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-white">
            {mode === "add" ? "Add New Claim" : "Edit Claim"}
          </h1>
          <p className="text-slate-400 mt-1">
            {mode === "add"
              ? "Fill in the details to add a new tyre claim entry"
              : "Update the claim details below"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg">Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date & Party Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-slate-300">
                    Date <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className={`bg-slate-800/50 border-slate-700 text-white ${
                      errors.date ? "border-red-500" : ""
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-400 text-xs">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partyName" className="text-slate-300">
                    Party Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="partyName"
                    placeholder="Enter party name"
                    value={formData.partyName}
                    onChange={(e) =>
                      updateField("partyName", e.target.value.toUpperCase())
                    }
                    className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${
                      errors.partyName ? "border-red-500" : ""
                    }`}
                  />
                  {errors.partyName && (
                    <p className="text-red-400 text-xs">{errors.partyName}</p>
                  )}
                </div>
              </div>

              {/* Vehicle & Tyre Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber" className="text-slate-300">
                    Vehicle Number
                  </Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g. HR74B-9618"
                    value={formData.vehicleNumber}
                    onChange={(e) =>
                      updateField(
                        "vehicleNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tyreModel" className="text-slate-300">
                    Tyre Model <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="tyreModel"
                    placeholder="e.g. MRF 295/90R20 S3C8"
                    value={formData.tyreModel}
                    onChange={(e) =>
                      updateField("tyreModel", e.target.value.toUpperCase())
                    }
                    className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${
                      errors.tyreModel ? "border-red-500" : ""
                    }`}
                  />
                  {errors.tyreModel && (
                    <p className="text-red-400 text-xs">{errors.tyreModel}</p>
                  )}
                </div>
              </div>

              {/* Stencil Number */}
              <div className="space-y-2">
                <Label htmlFor="stencilNumber" className="text-slate-300">
                  Stencil Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="stencilNumber"
                  placeholder="Enter stencil number"
                  value={formData.stencilNumber}
                  onChange={(e) =>
                    updateField(
                      "stencilNumber",
                      e.target.value.toUpperCase()
                    )
                  }
                  className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${
                    errors.stencilNumber ? "border-red-500" : ""
                  }`}
                />
                {errors.stencilNumber && (
                  <p className="text-red-400 text-xs">
                    {errors.stencilNumber}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-white font-medium mb-4">
                  Dispatch Information
                </h3>

                {/* Dispatch Date & Place */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="claimDispatchDate" className="text-slate-300">
                      Dispatch Date <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="claimDispatchDate"
                      type="date"
                      value={formData.claimDispatchDate}
                      onChange={(e) =>
                        updateField("claimDispatchDate", e.target.value)
                      }
                      className={`bg-slate-800/50 border-slate-700 text-white ${
                        errors.claimDispatchDate ? "border-red-500" : ""
                      }`}
                    />
                    {errors.claimDispatchDate && (
                      <p className="text-red-400 text-xs">
                        {errors.claimDispatchDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="claimDispatchPlace" className="text-slate-300">
                      Dispatch Place <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="claimDispatchPlace"
                      placeholder="e.g. BIKASH, MAGO, RAJA"
                      value={formData.claimDispatchPlace}
                      onChange={(e) =>
                        updateField(
                          "claimDispatchPlace",
                          e.target.value.toUpperCase()
                        )
                      }
                      className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${
                        errors.claimDispatchPlace ? "border-red-500" : ""
                      }`}
                    />
                    {errors.claimDispatchPlace && (
                      <p className="text-red-400 text-xs">
                        {errors.claimDispatchPlace}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-white font-medium mb-4">
                  Claim Resolution
                </h3>

                {/* Amount Type & Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Claim Status</Label>
                    <Select value={amountType} onValueChange={(val) => setAmountType(val as string)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="amount">
                          Passed (with amount)
                        </SelectItem>
                        <SelectItem value="cancel">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {amountType === "amount" && (
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-slate-300">
                        Pass Amount (₹)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        placeholder="Enter amount"
                        value={amountValue}
                        onChange={(e) => {
                          setAmountValue(e.target.value);
                          if (errors.claimPassAmount) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.claimPassAmount;
                              return next;
                            });
                          }
                        }}
                        className={`bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 ${
                          errors.claimPassAmount ? "border-red-500" : ""
                        }`}
                      />
                      {errors.claimPassAmount && (
                        <p className="text-red-400 text-xs">
                          {errors.claimPassAmount}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Return Date */}
                <div className="mt-4 space-y-2">
                  <Label htmlFor="claimReturnDate" className="text-slate-300">
                    Return Date
                  </Label>
                  <Input
                    id="claimReturnDate"
                    type="date"
                    value={formData.claimReturnDate || ""}
                    onChange={(e) =>
                      updateField("claimReturnDate", e.target.value)
                    }
                    className={`bg-slate-800/50 border-slate-700 text-white max-w-xs ${
                      errors.claimReturnDate ? "border-red-500" : ""
                    }`}
                  />
                  {errors.claimReturnDate && (
                    <p className="text-red-400 text-xs">
                      {errors.claimReturnDate}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg shadow-blue-500/20"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : mode === "add" ? (
                "Add Claim"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
