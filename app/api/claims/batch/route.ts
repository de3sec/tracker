import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Fallback to local process.cwd() if DATA_DIR env var isn't set (e.g. standard dev/build)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of claims" }, { status: 400 });
    }

    const claims = readData();
    let newClaimsAdded = 0;

    for (const item of body) {
      if (!item.partyName || !item.tyreModel || !item.date || !item.stencilNumber) {
         continue; // basic validation for CSV rows missing required fields
      }

      const newClaim = {
        id: randomUUID(),
        date: item.date,
        partyName: item.partyName,
        vehicleNumber: item.vehicleNumber || "",
        tyreModel: item.tyreModel,
        stencilNumber: item.stencilNumber,
        claimDispatchDate: item.claimDispatchDate || null,
        claimDispatchPlace: item.claimDispatchPlace || null,
        claimPassAmount: item.claimPassAmount !== undefined && item.claimPassAmount !== "" 
            ? (item.claimPassAmount === "CANCEL" ? "CANCEL" : Number(item.claimPassAmount)) 
            : null,
        claimReturnDate: item.claimReturnDate || null,
      };
      claims.push(newClaim);
      newClaimsAdded++;
    }

    writeData(claims);

    return NextResponse.json({ message: `Successfully imported ${newClaimsAdded} claims.` }, { status: 201 });
  } catch (error) {
    console.error("POST /api/claims/batch error:", error);
    return NextResponse.json(
      { error: "Failed to batch import claims" },
      { status: 500 }
    );
  }
}
