import { CSSProperties } from "react";
import { ListeningEntry } from "./listeningEntry";

export interface StatRow {
    trackName: string;
    artistName: string;
    playedTimes: number;
    totalListeningTime: number;
    id: number;
    entries: ListeningEntry[];
}

export interface StatColumn {
    header: string,
    selector: (x: StatRow) => any,
    style: CSSProperties
}