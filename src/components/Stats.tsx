import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { ListeningEntry } from '../models/listeningEntry';
import { Table } from './Table';
import { Chart } from './Chart';
import Summary from './Summary';

export interface StatsProps {
}

export interface StatsState {
  listeningHistory: ListeningEntry[];
}

export class Stats extends Component<StatsProps, StatsState> {
  static displayName = Stats.name;

  constructor(props: Readonly<StatsProps>) {
    super(props);
    this.state = { listeningHistory: [] };
  }

  loadFiles = (files: File[]) => {
    this.setState({ ...this.state, listeningHistory: [] }, () => {
      files.forEach(f => {
        if (!f.name.startsWith("StreamingHistory")) return;

        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          let ls: ListeningEntry[] = JSON.parse(fileReader.result as string);
          ls = ls.filter((x: ListeningEntry) => x.msPlayed > 60000 && x.msPlayed < 600000);
          ls.forEach(x => x.date = new Date(x.endTime.replace(" ", "T") + ":00.000Z"));
          this.setState({ ...this.state, listeningHistory: [...this.state.listeningHistory, ...ls] });
        }

        fileReader.readAsText(f);
      });
    });
  }

  render() {
    return this.state.listeningHistory.length === 0
      ? (
        <Dropzone onDrop={this.loadFiles}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag and drop your StreamingHistory#.json files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>
      ) : (
        <React.Fragment>
          <Summary listeningHistory={this.state.listeningHistory} />
          <Chart listeningHistory={this.state.listeningHistory} />
          <Table listeningHistory={this.state.listeningHistory} />
        </React.Fragment>
      );
  }
}