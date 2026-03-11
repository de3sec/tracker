import { NextRequest, NextResponse } from "next/server";
import { updateClaimInSheets, deleteClaimFromSheets, getClaimsFromSheets } from "@/lib/google-sheets";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData = {
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

    await updateClaimInSheets(id, updateData);
    
    // We should fetch the claims to return the updated record like the original code did
    const claims = await getClaimsFromSheets();
    const updatedClaim = claims.find(c => c.id === id);

    if (!updatedClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error("PUT /api/claims/[id] error:", error);
    const message = error instanceof Error && error.message.includes("Google Sheets is not available")
      ? error.message
      : "Failed to update claim";
    return NextResponse.json(
      { error: message },
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
    await deleteClaimFromSheets(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/claims/[id] error:", error);
    const message = error instanceof Error && error.message.includes("Google Sheets is not available")
      ? error.message
      : "Failed to delete claim";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
