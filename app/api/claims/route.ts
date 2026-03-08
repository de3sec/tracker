import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "data.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeData(data: unknown[]) {
  ensureDirectoryExistence(DATA_FILE);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const claims = readData();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "all";
    const dispatchPlace = searchParams.get("dispatchPlace") || "all";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    let filtered = claims;

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (c: Record<string, unknown>) =>
          (c.partyName as string)?.toLowerCase().includes(search) ||
          (c.vehicleNumber as string)?.toLowerCase().includes(search) ||
          (c.tyreModel as string)?.toLowerCase().includes(search) ||
          (c.stencilNumber as string)?.toString().toLowerCase().includes(search)
      );
    }

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((c: Record<string, unknown>) => {
        if (status === "passed")
          return typeof c.claimPassAmount === "number";
        if (status === "cancelled")
          return c.claimPassAmount === "CANCEL";
        if (status === "pending")
          return c.claimPassAmount === null || c.claimPassAmount === undefined;
        return true;
      });
    }

    // Dispatch place filter
    if (dispatchPlace !== "all") {
      filtered = filtered.filter(
        (c: Record<string, unknown>) =>
          (c.claimDispatchPlace as string)?.toLowerCase() ===
          dispatchPlace.toLowerCase()
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (c: Record<string, unknown>) => (c.date as string) >= dateFrom
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (c: Record<string, unknown>) => (c.date as string) <= dateTo
      );
    }

    // Sorting
    filtered.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
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
        default:
          valA = a.date;
          valB = b.date;
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const comparison = valA < valB ? -1 : 1;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Compute stats
    const allClaims = readData();
    const stats = {
      total: allClaims.length,
      totalPassedAmount: allClaims
        .filter(
          (c: Record<string, unknown>) => typeof c.claimPassAmount === "number"
        )
        .reduce(
          (sum: number, c: Record<string, unknown>) =>
            sum + (c.claimPassAmount as number),
          0
        ),
      cancelled: allClaims.filter(
        (c: Record<string, unknown>) => c.claimPassAmount === "CANCEL"
      ).length,
      pending: allClaims.filter(
        (c: Record<string, unknown>) =>
          c.claimPassAmount === null || c.claimPassAmount === undefined
      ).length,
      passed: allClaims.filter(
        (c: Record<string, unknown>) => typeof c.claimPassAmount === "number"
      ).length,
    };

    // Get unique dispatch places for filter dropdown
    const dispatchPlaces = [
      ...new Set(
        allClaims.map((c: Record<string, unknown>) => c.claimDispatchPlace)
      ),
    ].filter(Boolean);

    return NextResponse.json({ claims: filtered, stats, dispatchPlaces });
  } catch (error) {
    console.error("GET /api/claims error:", error);
    return NextResponse.json(
      { error: "Failed to read claims" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const claims = readData();

    const newClaim = {
      id: randomUUID(),
      date: body.date,
      partyName: body.partyName,
      vehicleNumber: body.vehicleNumber || "",
      tyreModel: body.tyreModel,
      stencilNumber: body.stencilNumber,
      claimDispatchDate: body.claimDispatchDate,
      claimDispatchPlace: body.claimDispatchPlace,
      claimPassAmount: body.claimPassAmount ?? null,
      claimReturnDate: body.claimReturnDate || null,
    };

    claims.push(newClaim);
    writeData(claims);

    return NextResponse.json(newClaim, { status: 201 });
  } catch (error) {
    console.error("POST /api/claims error:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 }
    );
  }
}
