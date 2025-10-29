import type { Sheet } from "./sheet";

interface Progress {
    type: string;
    start: number;
    end: number;
}

export interface Record {
    id: string;
    sheet_detail: Sheet;
    created_at: string;
    progress: Progress;
    note: string;
}