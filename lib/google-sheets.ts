import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export interface ClaimData {
  id: string;
  date: string;
  partyName: string;
  vehicleNumber: string;
  tyreModel: string;
  stencilNumber: string;
  claimDispatchDate: string | null;
  claimDispatchPlace: string | null;
  claimPassAmount: number | "CANCEL" | null;
  claimReturnDate: string | null;
}

// Ensure these are set in .env.local
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "";
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "";

const auth = new JWT({
  email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

let doc: GoogleSpreadsheet | null = null;

export async function getGoogleSheet() {
  if (!doc) {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
      console.warn("Missing Google Sheets credentials in environment variables.");
      return null;
    }
    try {
      doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, auth);
      await doc.loadInfo();
    } catch (e) {
      console.error("Failed to load Google Sheet:", e);
      return null;
    }
  }
  return doc;
}

async function getSheet() {
  const d = await getGoogleSheet();
  if (!d) return null;
  const sheet = d.sheetsByIndex[0]; // Assuming the first tab is the one and only
  
  try {
    // try to load header row, if it fails, maybe sheet is empty
    await sheet.loadHeaderRow();
  } catch (e) {
    // Sheet might be entirely empty, let's try to set headers
    await sheet.setHeaderRow([
      "id",
      "date",
      "partyName",
      "vehicleNumber",
      "tyreModel",
      "stencilNumber",
      "claimDispatchDate",
      "claimDispatchPlace",
      "claimPassAmount",
      "claimReturnDate"
    ]);
  }
  return sheet;
}

function mapRowToClaim(row: any): ClaimData {
  let claimPassAmount: number | "CANCEL" | null = null;
  if (row.get('claimPassAmount') === "CANCEL") {
    claimPassAmount = "CANCEL";
  } else if (row.get('claimPassAmount')) {
    claimPassAmount = Number(row.get('claimPassAmount'));
  }

  return {
    id: row.get('id') || "",
    date: row.get('date') || "",
    partyName: row.get('partyName') || "",
    vehicleNumber: row.get('vehicleNumber') || "",
    tyreModel: row.get('tyreModel') || "",
    stencilNumber: row.get('stencilNumber') || "",
    claimDispatchDate: row.get('claimDispatchDate') || null,
    claimDispatchPlace: row.get('claimDispatchPlace') || null,
    claimPassAmount,
    claimReturnDate: row.get('claimReturnDate') || null,
  };
}

export async function getClaimsFromSheets(): Promise<ClaimData[]> {
  const sheet = await getSheet();
  if (!sheet) return [];

  const rows = await sheet.getRows();
  return rows.map(mapRowToClaim).filter(c => c.id);
}

export async function addClaimToSheets(claim: ClaimData): Promise<void> {
  const sheet = await getSheet();
  if (!sheet) {
    throw new Error("Google Sheets is not available. Ensure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID are set in .env.local and the service account has access to the spreadsheet.");
  }

  await sheet.addRow({
    id: claim.id,
    date: claim.date,
    partyName: claim.partyName,
    vehicleNumber: claim.vehicleNumber,
    tyreModel: claim.tyreModel,
    stencilNumber: claim.stencilNumber,
    claimDispatchDate: claim.claimDispatchDate || "",
    claimDispatchPlace: claim.claimDispatchPlace || "",
    claimPassAmount: claim.claimPassAmount !== null ? claim.claimPassAmount.toString() : "",
    claimReturnDate: claim.claimReturnDate || "",
  });
}

export async function addClaimsBatchToSheets(claims: ClaimData[]): Promise<void> {
  const sheet = await getSheet();
  if (!sheet) {
    throw new Error("Google Sheets is not available. Ensure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID are set in .env.local and the service account has access to the spreadsheet.");
  }

  const rows = claims.map(claim => ({
    id: claim.id,
    date: claim.date,
    partyName: claim.partyName,
    vehicleNumber: claim.vehicleNumber,
    tyreModel: claim.tyreModel,
    stencilNumber: claim.stencilNumber,
    claimDispatchDate: claim.claimDispatchDate || "",
    claimDispatchPlace: claim.claimDispatchPlace || "",
    claimPassAmount: claim.claimPassAmount !== null ? claim.claimPassAmount.toString() : "",
    claimReturnDate: claim.claimReturnDate || "",
  }));

  await sheet.addRows(rows);
}

export async function updateClaimInSheets(id: string, updateData: Partial<ClaimData>): Promise<void> {
  const sheet = await getSheet();
  if (!sheet) {
    throw new Error("Google Sheets is not available. Ensure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID are set in .env.local and the service account has access to the spreadsheet.");
  }

  const rows = await sheet.getRows();
  const rowIndex = rows.findIndex(r => r.get('id') === id);

  if (rowIndex !== -1) {
    const row = rows[rowIndex];
    
    if (updateData.date !== undefined) row.set('date', updateData.date);
    if (updateData.partyName !== undefined) row.set('partyName', updateData.partyName);
    if (updateData.vehicleNumber !== undefined) row.set('vehicleNumber', updateData.vehicleNumber);
    if (updateData.tyreModel !== undefined) row.set('tyreModel', updateData.tyreModel);
    if (updateData.stencilNumber !== undefined) row.set('stencilNumber', updateData.stencilNumber);
    if (updateData.claimDispatchDate !== undefined) row.set('claimDispatchDate', updateData.claimDispatchDate || "");
    if (updateData.claimDispatchPlace !== undefined) row.set('claimDispatchPlace', updateData.claimDispatchPlace || "");
    if (updateData.claimPassAmount !== undefined) {
      row.set('claimPassAmount', updateData.claimPassAmount !== null ? updateData.claimPassAmount.toString() : "");
    }
    if (updateData.claimReturnDate !== undefined) row.set('claimReturnDate', updateData.claimReturnDate || "");

    await row.save();
  }
}

export async function deleteClaimFromSheets(id: string): Promise<void> {
  const sheet = await getSheet();
  if (!sheet) {
    throw new Error("Google Sheets is not available. Ensure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID are set in .env.local and the service account has access to the spreadsheet.");
  }

  const rows = await sheet.getRows();
  const rowIndex = rows.findIndex(r => r.get('id') === id);

  if (rowIndex !== -1) {
    await rows[rowIndex].delete();
  }
}
