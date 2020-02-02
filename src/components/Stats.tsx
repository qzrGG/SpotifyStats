import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { ListeningEntry } from '../models/listeningEntry';
import { Table } from './Table';
import { Chart } from './Chart';
import Summary from './Summary';
import "./Stats.css";

export interface StatsProps {
}

export interface StatsState {
  listeningHistory: ListeningEntry[];
  progress: number;
}

export class Stats extends Component<StatsProps, StatsState> {
  static displayName = Stats.name;

  constructor(props: Readonly<StatsProps>) {
    super(props);
    this.state = { listeningHistory: [], progress: 0 };
  }

  loadFiles = (files: File[]) => {
    let result: ListeningEntry[] = [];
    let loadedFiles = 0;
    const filesToLoad = files.filter(x => x.name.startsWith("StreamingHistory"));
    this.setState({ ...this.state, progress: 1 }, () =>
      filesToLoad.forEach(f => {
        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          let ls: ListeningEntry[] = JSON.parse(fileReader.result as string);
          ls = ls.filter((x: ListeningEntry) => x.msPlayed > 60000 && x.msPlayed < 600000);
          ls.forEach(x => x.date = new Date(x.endTime.replace(" ", "T") + ":00.000Z"));
          result = [...result, ...ls];
          loadedFiles = loadedFiles + 1;
          if (loadedFiles === filesToLoad.length) 
            this.setState({ ...this.state, listeningHistory: result, progress: 2 });
        }

        fileReader.readAsText(f);
      })
    );
  }

  render() {
    return this.state.progress === 0
      ? (
        <Dropzone onDrop={this.loadFiles}>
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps()} />
              <p>Drag and drop your StreamingHistory#.json files here, or click to select files</p>
            </div>
          )}
        </Dropzone>
      ) : this.state.progress === 1 ? (
        <h2 className="text-center display-4">Loading...</h2>
      ) :     
      (
        <React.Fragment>
          <section id="summary">
            <Summary listeningHistory={this.state.listeningHistory} />
          </section>
          <section id="chart">
            <Chart listeningHistory={this.state.listeningHistory} />
          </section>
          <section id="table">
            <Table listeningHistory={this.state.listeningHistory} />
          </section>
        </React.Fragment>
      );
  }
}
