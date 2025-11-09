import React from 'react';
import { ListeningEntry } from '../models/listeningEntry';

export interface StatsData {
    listeningHistory: ListeningEntry[];
    allListeningHistory: ListeningEntry[];
    since: Date;
    to: Date;
    dataSince: Date;
    dataTo: Date;
    isCalculating: boolean;
    setTimePeriod: (since: Date, to: Date) => void;
}
const StatsContext = React.createContext<StatsData>({
    listeningHistory: [],
    allListeningHistory: [],
    since: new Date(),
    to: new Date(),
    dataSince: new Date(),
    dataTo: new Date(),
    isCalculating: false,
    setTimePeriod: () => {}
});

export const StatsProvider = StatsContext.Provider
export default StatsContext