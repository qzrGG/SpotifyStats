import React from 'react';
import { ListeningEntry } from '../models/listeningEntry';

export interface StatsData {
    listeningHistory: ListeningEntry[];
    since: Date;
    to: Date;
}
const StatsContext = React.createContext<StatsData>({listeningHistory: [], since: new Date(), to: new Date()});

export const StatsProvider = StatsContext.Provider
export default StatsContext