import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Table from './Table';
import { Chart } from './Chart';
import Summary from './Summary';
import "./Stats.css";
import OtherUnits from './OtherUnits';
import Attachment from './Attachment';
import { from } from 'linq-to-typescript';
import { ListeningEntry } from '../models/listeningEntry';

export interface StatsProps {
}

export interface StatsState {
  listeningHistory: ListeningEntry[];
  since: Date;
  to: Date;
  progress: number;
}

export class Stats extends Component<StatsProps, StatsState> {
  static displayName = Stats.name;

  constructor(props: Readonly<StatsProps>) {
    super(props);
    this.state = {
      listeningHistory: [],
      progress: 0, 
      since: new Date(), 
      to: new Date()
    };
  }

  loadFiles = (files: File[]) => {
    const filesToLoad = files.filter(x => x.name.startsWith("StreamingHistory"));
    this.setState({ progress: 1 }, () =>
      Promise.all(filesToLoad.map(this.loadFile)).then(results => {
        let entries = results.map(r => JSON.parse(r as string) as ListeningEntry[]).flat();
        entries.forEach(x => x.date = new Date(x.endTime.replace(" ", "T") + ":00.000Z"));
        let ordered = from(entries).orderBy(x => x.date.getTime()).groupBy(x => x.endTime + x.trackName).select(x => x.first());
        entries = ordered.toArray();

        this.setState({ listeningHistory: entries, progress: 2, since: ordered.first().date, to: ordered.last().date });
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
        <section>
          <Dropzone onDrop={this.loadFiles}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag and drop your StreamingHistory#.json files here, or click to select files</p>
              </div>
            )}
          </Dropzone>
        </section>
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
              <Table listeningHistory={this.state.listeningHistory} since={this.state.since} to={this.state.to} />
            </section>
            <section id="attachment">
              <Attachment listeningHistory={this.state.listeningHistory} />
            </section>
          </React.Fragment>
        );
  }
}
