declare module '*/csv-validator.mjs' {
  export function validateDonationCSV(
    csvText: string,
    options?: { reconciledAt?: string; requireReconciledDate?: boolean }
  ): {
    isValid: boolean;
    rows: any[];
    errors: any[];
    warnings: any[];
    stats: { totalRows: number; validRows: number; totalAmount: number; anonymousCount: number };
  };
  export function parseCSVRFC4180(text: string): { rows: string[][]; error: string | null };
  export function sanitizeDonationEntry(entry: any): {
    date: string;
    amount: number;
    donor: string;
    reference: string | null;
  } | null;
  export function validateDonationProjection(payload: any): {
    isValid: boolean;
    errors: string[];
  };
}
