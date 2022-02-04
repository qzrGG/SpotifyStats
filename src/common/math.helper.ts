export function round(x: number, precision: number): string {
    return (Math.round(x * Math.pow(10, precision)) / Math.pow(10, precision)).toLocaleString();
} 