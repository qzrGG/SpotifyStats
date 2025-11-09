import React, { useEffect, useState, useCallback } from 'react';
import Dropzone from 'react-dropzone';
import Table from './Table';
import Chart from './Chart';
import Summary from './Summary';
import "./Stats.css";
import OtherUnits from './OtherUnits';
import Attachment from './Attachment';
import { from } from 'linq-to-typescript';
import { ListeningEntry, ExtendedListeningEntry } from '../models/listeningEntry';
import { StatsData, StatsProvider } from './StatsContext';
import { convertUtcToLocalTime } from '../utils/timezoneUtils';

interface StatsProps {
}

interface StatsState {
  progress: number;
  files: File[];
  data: StatsData;
}

const Stats: React.FC<StatsProps> = (props) => {

  const [state, setState] = useState<StatsState>({
    progress: 0,
    files: [],
    data: {
      listeningHistory: [],
      allListeningHistory: [],
      since: new Date(),
      to: new Date(),
      dataSince: new Date(),
      dataTo: new Date(),
      isCalculating: false,
      setTimePeriod: () => {}
    }
  });

  const normalizeExtendedEntry = (entry: ExtendedListeningEntry): ListeningEntry | null => {
    // Skip entries without track metadata (podcasts, audiobooks, etc.)
    if (!entry.master_metadata_track_name || !entry.master_metadata_album_artist_name) {
      return null;
    }

    // Convert UTC timestamp to local time based on country (handles DST automatically)
    const { date, formatted } = convertUtcToLocalTime(entry.ts, entry.conn_country);

    return {
      endTime: formatted,
      date: date,
      artistName: entry.master_metadata_album_artist_name,
      trackName: entry.master_metadata_track_name,
      msPlayed: entry.ms_played
    };
  };

  const isExtendedFormat = (entry: any): entry is ExtendedListeningEntry => {
    return 'ts' in entry && 'ms_played' in entry && 'master_metadata_track_name' in entry;
  };

  const setTimePeriod = useCallback((since: Date, to: Date) => {
    setState(s => {
      // Check if we're selecting "All" - if so, reuse the same array reference
      const isSelectingAll = since.getTime() === s.data.dataSince.getTime() &&
                             to.getTime() === s.data.dataTo.getTime();

      // If selecting "All", just update immediately with no calculation
      if (isSelectingAll) {
        // If we're already showing all data, no need to update
        if (s.data.listeningHistory === s.data.allListeningHistory) {
          return s;
        }

        return {
          ...s,
          data: {
            ...s.data,
            listeningHistory: s.data.allListeningHistory,
            since: s.data.dataSince,
            to: s.data.dataTo,
            isCalculating: false
          }
        };
      }

      // For filtered views, we need to calculate
      // First set calculating flag
      const stateWithCalculating = {
        ...s,
        data: {
          ...s.data,
          isCalculating: true
        }
      };

      // Defer the filtering to next tick
      setTimeout(() => {
        setState(currentState => {
          const filteredHistory = currentState.data.allListeningHistory.filter(
            entry => entry.date >= since && entry.date <= to
          );

          return {
            ...currentState,
            data: {
              ...currentState.data,
              listeningHistory: filteredHistory,
              since: filteredHistory.length > 0 ? filteredHistory[0].date : since,
              to: filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].date : to,
              isCalculating: false
            }
          };
        });
      }, 0);

      return stateWithCalculating;
    });
  }, []);

  useEffect(() => {
    if (state.files.length === 0) return;

    Promise.all(state.files.map(loadFile)).then(results => {
      let entries: ListeningEntry[] = [];

      results.forEach(r => {
        const parsed = JSON.parse(r as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (isExtendedFormat(parsed[0])) {
            // Extended format - transform and filter
            const normalized = (parsed as ExtendedListeningEntry[])
              .map(normalizeExtendedEntry)
              .filter((x): x is ListeningEntry => x !== null);
            entries.push(...normalized);
          } else {
            // Standard format
            const standardEntries = parsed as ListeningEntry[];
            standardEntries.forEach(x => x.date = new Date(x.endTime.replace(" ", "T") + ":00.000Z"));
            entries.push(...standardEntries);
          }
        }
      });

      let ordered = from(entries).orderBy(x => x.date.getTime()).groupBy(x => x.endTime + x.trackName).select(x => x.first());
      entries = ordered.toArray();

      const dataSince = ordered.first().date;
      const dataTo = ordered.last().date;

      setState(s => ({
        ...s,
        progress: 2,
        data: {
          listeningHistory: entries,
          allListeningHistory: entries,
          since: dataSince,
          to: dataTo,
          dataSince: dataSince,
          dataTo: dataTo,
          isCalculating: false,
          setTimePeriod: setTimePeriod
        }
      }));
      let summary = document.getElementById('summary');
      if (summary)
        summary!.scrollIntoView()
    })
  }, [state.files, setTimePeriod]);

  const loadFiles = (files: File[]) => {
    const filesToLoad = files.filter(x => x.name.startsWith("StreamingHistory") || x.name.startsWith("Streaming_History_Audio"));
    setState({ ...state, progress: 1, files: filesToLoad });
  }

  const loadFile = (file: File) => new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      resolve(e.target?.result);
    }
    fileReader.onerror = fileReader.onabort = reject;
    fileReader.readAsText(file);
  });

  return state.progress === 0
    ? (
      <section>
        <Dropzone onDrop={loadFiles}>
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              <p>Drag and drop your StreamingHistory#.json files here, or click to select files</p>
            </div>
          )}
        </Dropzone>
      </section>
    ) : state.progress === 1 ? (
      <section id="otherUnits">
        <h2 className="text-center display-4">Loading...</h2>
      </section>
    ) :
      (
        <React.Fragment>
          <StatsProvider value={state.data}>
            <div style={{ position: 'relative', opacity: state.data.isCalculating ? 0.5 : 1, pointerEvents: state.data.isCalculating ? 'none' : 'auto' }}>
              {state.data.isCalculating && (
                <div style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '20px 40px',
                  borderRadius: '8px',
                  fontSize: '1.2rem'
                }}>
                  Calculating...
                </div>
              )}
              <section id="summary">
                <Summary />
              </section>
              <section id="otherUnits">
                <OtherUnits />
              </section>
              <section id="chart">
                <Chart description="Music over time" compact={false} />
              </section>
              <section id="table">
                <Table />
              </section>
              <section id="attachment">
                <Attachment />
              </section>
            </div>
          </StatsProvider>
        </React.Fragment>
      );
}

Stats.displayName = Stats.name;

export default Stats;
