export function round(x: number, precision: number): number {
    return (Math.round(x * Math.pow(10, precision)) / Math.pow(10, precision));
}

export function minutes(time: number): string {
    const min = Math.floor(time);
    const sec = Math.round((time - min) * 60);
    return `${min}:${sec}`;
}