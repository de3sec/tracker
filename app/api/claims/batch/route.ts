import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addClaimsBatchToSheets, ClaimData } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of claims" }, { status: 400 });
    }

    const newClaims: ClaimData[] = [];
    let newClaimsAdded = 0;

    for (const item of body) {
      if (!item.partyName || !item.tyreModel || !item.date || !item.stencilNumber) {
         continue; // basic validation for CSV rows missing required fields
      }

      const newClaim: ClaimData = {
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
      
      newClaims.push(newClaim);
      newClaimsAdded++;
    }

    if (newClaims.length > 0) {
      await addClaimsBatchToSheets(newClaims);
    }

    return NextResponse.json({ message: `Successfully imported ${newClaimsAdded} claims.` }, { status: 201 });
  } catch (error) {
    console.error("POST /api/claims/batch error:", error);
    const message = error instanceof Error && error.message.includes("Google Sheets is not available")
      ? error.message
      : "Failed to batch import claims";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
