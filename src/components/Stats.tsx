import React, { useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import Table from './Table';
import Chart from './Chart';
import Summary from './Summary';
import "./Stats.css";
import OtherUnits from './OtherUnits';
import Attachment from './Attachment';
import { from } from 'linq-to-typescript';
import { ListeningEntry } from '../models/listeningEntry';
import { StatsData, StatsProvider } from './StatsContext';

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
    data: { listeningHistory: [], since: new Date(), to: new Date() }
  });

  useEffect(() => {
    if (state.files.length === 0) return;

    Promise.all(state.files.map(loadFile)).then(results => {
      let entries = results.map(r => JSON.parse(r as string) as ListeningEntry[]).flat();
      entries.forEach(x => x.date = new Date(x.endTime.replace(" ", "T") + ":00.000Z"));
      let ordered = from(entries).orderBy(x => x.date.getTime()).groupBy(x => x.endTime + x.trackName).select(x => x.first());
      entries = ordered.toArray();

      setState(s => ({ ...s, progress: 2, data: { listeningHistory: entries, since: ordered.first().date, to: ordered.last().date } }));
      let summary = document.getElementById('summary');
      if (summary)
        summary!.scrollIntoView()
    })
  }, [state.files]);

  const loadFiles = (files: File[]) => {
    const filesToLoad = files.filter(x => x.name.startsWith("StreamingHistory"));
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
            <section id="summary">
              <Summary />
            </section>
            <section id="otherUnits">
              <OtherUnits />
            </section>
            <section id="chart">
              <Chart description="Music over time" />
            </section>
            <section id="table">
              <Table />
            </section>
            <section id="attachment">
              <Attachment />
            </section>
          </StatsProvider>
        </React.Fragment>
      );
}

Stats.displayName = Stats.name;

export default Stats;
