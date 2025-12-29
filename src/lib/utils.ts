import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert year of grade into human-readible form.
 * 
 * @param grade year of grade of student
 * @returns human-readible grade
 */
export function convertGrade(grade: number) {
  if (grade <= 6) return `초등 ${grade}학년`;
  if (grade <= 9) return `중등 ${grade - 6}학년`;
  if (grade <= 12) return `고등 ${grade - 9}학년`;

  return '졸업생';
}