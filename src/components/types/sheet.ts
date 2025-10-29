import type { Student } from "./student";
import type { TextBook } from "./textbook";

export interface Sheet {
    id: number;
    student_detail: Student;
    textbook_detail: TextBook;
    pace: number;
    is_finished: boolean;
}