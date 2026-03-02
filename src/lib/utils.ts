import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string contains only numbers, minus sign, and dot
 * Allows:
 * - Digits (0-9)
 * - Minus sign (-) only at the beginning
 * - Single dot (.) anywhere (but not multiple dots)
 * - Empty string (for clearing)
 * - Standalone dot (.) or minus (-) or combination (-.)
 * - Intermediate states like ".5", "5.", "-.5", "-5."
 */
export function isValidNumericInput(value: string): boolean {
  if (value === '') return true;
  
  // Check for multiple minus signs or minus not at the beginning
  if ((value.match(/-/g) || []).length > 1) return false;
  if (value.includes('-') && value.indexOf('-') !== 0) return false;
  
  // Check for multiple dots
  if ((value.match(/\./g) || []).length > 1) return false;
  
  // Check that all characters are allowed: digits, minus (at start), dot
  // Remove the minus sign for character validation since we already checked its position
  const withoutMinus = value.startsWith('-') ? value.substring(1) : value;
  
  // After removing optional leading minus, the rest should be:
  // - Empty (just "-" case)
  // - Only digits and at most one dot
  // This regex allows: empty string, digits, dot, or combination
  return /^\d*\.?\d*$/.test(withoutMinus);
}

/**
 * Formats a numeric value for display in input field
 * Handles intermediate string values like ".", "-", "-."
 */
export function formatNumericValue(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  
  // If value is a string that represents an intermediate state, return it as-is
  if (typeof value === 'string') {
    // Check if it's an intermediate state like ".", "-", "-.", ".5", "-.5", etc.
    if (value === '-' || value === '.' || value === '-.' ||
        value.startsWith('.') || value.startsWith('-.') ||
        value.endsWith('.')) {
      return value;
    }
    
    // Try to parse as number
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    // Remove trailing .0 or .00 if it's a whole number
    const str = num.toString();
    if (str.includes('.') && str.endsWith('0')) {
      // Check if it's a whole number when parsed as float
      if (num % 1 === 0) {
        return num.toString();
      }
    }
    
    return str;
  }
  
  // Value is a number
  const num = value;
  
  // Return empty string for 0 to allow typing "." or "-" from empty state
  if (num === 0) return '';
  
  const str = num.toString();
  if (str.includes('.') && str.endsWith('0')) {
    if (num % 1 === 0) {
      return num.toString();
    }
  }
  
  return str;
}
