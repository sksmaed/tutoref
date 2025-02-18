import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const hashTeam = (team: string) => {
  return crypto.createHash('sha256').update(team).digest('hex').slice(0, 8);
};