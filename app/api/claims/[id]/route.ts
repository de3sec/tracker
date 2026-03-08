import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const claims = readData();

    const index = claims.findIndex(
      (c: Record<string, unknown>) => c.id === id
    );
    if (index === -1) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    claims[index] = {
      ...claims[index],
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

    writeData(claims);  
    return NextResponse.json(claims[index]);
  } catch (error) {
    console.error("PUT /api/claims/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const claims = readData();

    const index = claims.findIndex(
      (c: Record<string, unknown>) => c.id === id
    );
    if (index === -1) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    claims.splice(index, 1);
    writeData(claims);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/claims/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete claim" },
      { status: 500 }
    );
  }
}
