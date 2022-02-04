import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import { ListeningEntry } from '../models/listeningEntry';
import { Table } from './Table';
import { Chart } from './Chart';
import Summary from './Summary';
import "./Stats.css";
import OtherUnits from './OtherUnits';
import Attachment from './Attachment';
import { from } from 'linq-to-typescript';

export interface StatsProps {
}

export interface StatsState {
  listeningHistory: ListeningEntry[];
  listeningHistorySubset: ListeningEntry[];
  since: Date;
  to: Date;
  subsetDescription: string;
  progress: number;
}

export class Stats extends Component<StatsProps, StatsState> {
  static displayName = Stats.name;

  constructor(props: Readonly<StatsProps>) {
    super(props);
    this.state = { listeningHistory: [], listeningHistorySubset: [], progress: 0, subsetDescription: "", since: new Date(), to: new Date() };
  }

  loadFiles = (files: File[]) => {
    const filesToLoad = files.filter(x => x.name.startsWith("StreamingHistory"));
    this.setState({ ...this.state, progress: 1 }, () =>
      Promise.all(filesToLoad.map(this.loadFile)).then(results => {
        let entries = results.map(r => JSON.parse(r as string) as ListeningEntry[]).flat();
        entries.forEach(x => x.date = new Date(x.endTime.replace(" ", "T") + ":00.000Z"));
        let ordered = from(entries).orderBy(x => x.date.getTime())
        entries = ordered.toArray();

        this.setState({ ...this.state, listeningHistory: entries, progress: 2, since: ordered.first().date, to: ordered.last().date });
            let summary = document.getElementById('summary');
            if (summary)
              summary!.scrollIntoView()
      }));
  }

  loadFile = (file: File) => new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        resolve(e.target?.result);
      }
      fileReader.onerror = fileReader.onabort = reject;
      fileReader.readAsText(file);
    });

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
              <Summary listeningHistory={this.state.listeningHistory} since={this.state.since} to={this.state.to} />
            </section>
            <section id="otherUnits">
              <OtherUnits listeningHistory={this.state.listeningHistory} />
            </section>
            <section id="chart">
              <Chart listeningHistory={this.state.listeningHistory} description="Music over time" since={this.state.since} to={this.state.to} />
            </section>
            <section id="table">
              <Table listeningHistory={this.state.listeningHistory} onSubsetChanged={(subset, desctiption) => this.setState({ ...this.state, listeningHistorySubset: subset, subsetDescription: desctiption })}/>
              <Chart listeningHistory={this.state.listeningHistorySubset} description={`Details for ${this.state.subsetDescription}`} since={this.state.since} to={this.state.to} />
            </section>
            <section id="attachment">
              <Attachment listeningHistory={this.state.listeningHistory} />
            </section>
          </React.Fragment>
        );
  }
}
