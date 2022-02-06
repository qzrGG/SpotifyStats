export function round(x: number, precision: number): number {
    return (Math.round(x * Math.pow(10, precision)) / Math.pow(10, precision));
}

export function minutes(timeInMinutes: number): string {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = Math.floor(timeInMinutes) - hours * 60;
    const seconds = Math.round((timeInMinutes - hours * 60 - minutes) * 60);
    if (hours > 0)
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    else
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    
}