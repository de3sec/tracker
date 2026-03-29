import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getClaimsFromSheets, addClaimToSheets } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const claims = await getClaimsFromSheets();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "all";
    const dispatchPlace = searchParams.get("dispatchPlace") || "all";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    let filtered = claims as Record<string, any>[];

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (c) =>
          (c.partyName as string)?.toLowerCase().includes(search) ||
          (c.vehicleNumber as string)?.toLowerCase().includes(search) ||
          (c.tyreModel as string)?.toLowerCase().includes(search) ||
          (c.stencilNumber as string)?.toString().toLowerCase().includes(search)
      );
    }

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((c) => {
        if (status === "passed")
          return typeof c.claimPassAmount === "number";
        if (status === "cancelled")
          return c.claimPassAmount === "CANCEL";
        if (status === "pending")
          return c.claimPassAmount === null || c.claimPassAmount === undefined || c.claimPassAmount === "";
        return true;
      });
    }

    // Dispatch place filter
    if (dispatchPlace !== "all") {
      filtered = filtered.filter(
        (c) =>
          (c.claimDispatchPlace as string)?.toLowerCase() ===
          dispatchPlace.toLowerCase()
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (c) => (c.date as string) >= dateFrom
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (c) => (c.date as string) <= dateTo
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA: unknown, valB: unknown;

      switch (sortBy) {
        case "date":
          valA = a.date;
          valB = b.date;
          break;
        case "partyName":
          valA = (a.partyName as string)?.toLowerCase();
          valB = (b.partyName as string)?.toLowerCase();
          break;
        case "tyreModel":
          valA = (a.tyreModel as string)?.toLowerCase();
          valB = (b.tyreModel as string)?.toLowerCase();
          break;
        case "claimPassAmount":
          valA =
            typeof a.claimPassAmount === "number" ? a.claimPassAmount : -1;
          valB =
            typeof b.claimPassAmount === "number" ? b.claimPassAmount : -1;
          break;
        case "claimDispatchDate":
          valA = a.claimDispatchDate;
          valB = b.claimDispatchDate;
          break;
        case "claimReturnDate":
          valA = a.claimReturnDate;
          valB = b.claimReturnDate;
          break;
        default:
          valA = a.date;
          valB = b.date;
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined || valA === "") return 1;
      if (valB === null || valB === undefined || valB === "") return -1;

      const isDateField = sortBy === "date" || sortBy === "claimDispatchDate" || sortBy === "claimReturnDate";
      const comparison = isDateField
        ? (new Date(valA as string).getTime() - new Date(valB as string).getTime())
        : (valA < valB ? -1 : 1);
      const result = isDateField ? (comparison < 0 ? -1 : comparison > 0 ? 1 : 0) : comparison;
      return sortOrder === "asc" ? result : -result;
    });

    // Compute stats
    const allClaims = await getClaimsFromSheets() as Record<string, any>[];
    const stats = {
      total: allClaims.length,
      totalPassedAmount: allClaims
        .filter(
          (c) => typeof c.claimPassAmount === "number"
        )
        .reduce(
          (sum: number, c) =>
            sum + (c.claimPassAmount as number),
          0
        ),
      cancelled: allClaims.filter(
        (c) => c.claimPassAmount === "CANCEL"
      ).length,
      pending: allClaims.filter(
        (c) =>
          c.claimPassAmount === null || c.claimPassAmount === undefined || c.claimPassAmount === ""
      ).length,
      passed: allClaims.filter(
        (c) => typeof c.claimPassAmount === "number"
      ).length,
    };

    // Get unique dispatch places for filter dropdown
    const dispatchPlaces = [
      ...new Set(
        allClaims.map((c) => c.claimDispatchPlace)
      ),
    ].filter(Boolean);

    // Pagination: when page or limit provided, slice results; otherwise return all (backward compatible)
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const usePagination = pageParam !== null || limitParam !== null;

    const totalCount = filtered.length;
    let resultClaims = filtered;
    let pageNum = 1;
    let limitNum = totalCount;
    let totalPages = 1;

    if (usePagination) {
      pageNum = Math.max(1, parseInt(pageParam || "1", 10));
      limitNum =
        limitParam === "0" || limitParam === "all"
          ? 0
          : Math.min(100, Math.max(1, parseInt(limitParam || "20", 10)));

      if (limitNum === 0) {
        limitNum = totalCount;
        totalPages = 1;
      } else {
        totalPages = Math.ceil(totalCount / limitNum) || 1;
        resultClaims = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      }
    }

    return NextResponse.json({
      claims: resultClaims,
      stats,
      dispatchPlaces,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/claims error:", error);
    const message = error instanceof Error && error.message.includes("Google Sheets is not available")
      ? error.message
      : "Failed to read claims";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newClaim = {
      id: randomUUID(),
      date: body.date,
      partyName: body.partyName,
      vehicleNumber: body.vehicleNumber || "",
      tyreModel: body.tyreModel,
      stencilNumber: body.stencilNumber,
      claimDispatchDate: body.claimDispatchDate || null,
      claimDispatchPlace: body.claimDispatchPlace || null,
      claimPassAmount: body.claimPassAmount ?? null,
      claimReturnDate: body.claimReturnDate || null,
    };

    await addClaimToSheets(newClaim);

    return NextResponse.json(newClaim, { status: 201 });
  } catch (error) {
    console.error("POST /api/claims error:", error);
    const message = error instanceof Error && error.message.includes("Google Sheets is not available")
      ? error.message
      : "Failed to create claim";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
