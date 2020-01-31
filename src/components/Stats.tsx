import React, { Component } from 'react';
import Dropzone from 'react-dropzone';

import { ListeningEntry } from '../models/listeningEntry';
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import { from } from "linq-to-typescript"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ButtonGroup, Button } from 'reactstrap';

export interface StatsProps {
}

export interface StatsState {
  listeningEntries: ListeningEntry[];
  chartFuncId: number;
  tableFuncId: number;
}

export class Stats extends Component<StatsProps, StatsState> {
  static displayName = Stats.name;
  chartFuncs = [(x: Date) => x.getHours(), (x: Date) => x.getDay() + 1, (x: Date) => x.getMonth() + 1]
  tableFuncs = [(x: ListeningEntry) => x.trackName + x.artistName, (x: ListeningEntry) => x.artistName]

  constructor(props: Readonly<StatsProps>) {
    super(props);
    this.state = { listeningEntries: [], chartFuncId: 0, tableFuncId: 0 };
  }

  loadFiles = (files: File[]) => {
    this.setState({ ...this.state, listeningEntries: [] }, () => {
      files.forEach(f => {
        if (!f.name.startsWith("StreamingHistory")) return;

        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          let ls = JSON.parse(fileReader.result as string);
          this.setState({ ...this.state, listeningEntries: [...this.state.listeningEntries, ...ls] });
        }

        fileReader.readAsText(f);
      });
    });
  }

  tableData = () => from(this.state.listeningEntries).groupBy(this.tableFuncs[this.state.tableFuncId]).select(x => {
    return {
      trackName: x.first().trackName,
      artistName: x.first().artistName,
      playedTimes: x.count(),
      totalListeningTime: Math.round(x.sum(x => x.msPlayed) / 60000)
    }
  }).toArray();

  chartData = () => from(this.state.listeningEntries)
    .groupBy(x => this.chartFuncs[this.state.chartFuncId](new Date(x.endTime)))
    .select(g => {
      return {
        name: g.key,
        totalTime: Math.round(g.sum(x => x.msPlayed) / 60000),
        totalPlaybacks: g.count(),
        mostPlayedTrack: g.groupBy(x => x.trackName).orderByDescending(x => x.count()).first().key,
        mostPlayedArtist: g.groupBy(x => x.artistName).orderByDescending(x => x.count()).first().key,
      };
    })
    .toArray();

  render() {
    return (
      <div>
        <h1>Stats</h1>
        {this.state.listeningEntries.length === 0
          ?
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

          :
          <React.Fragment>
            <ButtonGroup className="d-flex">
              <Button active={this.state.chartFuncId === 0} color="primary" onClick={() => this.setState({ ... this.state, chartFuncId:0 })} >Hours</Button>
              <Button active={this.state.chartFuncId === 1} color="primary" onClick={() => this.setState({ ... this.state, chartFuncId: 1 })}>Days of week</Button>
              <Button active={this.state.chartFuncId === 2} color="primary" onClick={() => this.setState({ ... this.state, chartFuncId: 2 })}>Months</Button>
            </ButtonGroup>

            <LineChart
              width={1100}
              height={500}
              data={this.chartData()}
              margin={{
                top: 25, right: 20, left: 20, bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={CustomTooltip} />
              <Line type="monotone" dataKey="totalTime" stroke="#8884d8" />
            </LineChart>

            <ButtonGroup className="d-flex">
              <Button active={this.state.tableFuncId === 0} color="primary" onClick={() => this.setState({ ... this.state, tableFuncId:0 })} >Favourite tracks</Button>
              <Button active={this.state.tableFuncId === 1} color="primary" onClick={() => this.setState({ ... this.state, tableFuncId: 1 })}>Favourite artists</Button>
            </ButtonGroup>

            <ReactTable
              data={this.tableData()}
              columns={[
                {
                  Header: "Artist Name",
                  accessor: "artistName"
                },
                {
                  Header: "Track Name",
                  accessor: "trackName"
                },
                {
                  Header: "Play Count",
                  accessor: "playedTimes"
                },
                {
                  Header: "Listening Time (minutes)",
                  accessor: "totalListeningTime"
                }
              ].filter(x => this.state.tableFuncId === 0 ? true : x.accessor !== "trackName")}
              defaultSorted={[
                {
                  id: "playedTimes",
                  desc: true
                }
              ]}
              defaultPageSize={20}
              className="-striped -highlight"
            />
          </React.Fragment>}
      </div>
    );
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload) {
    console.log(payload);
    return (
      <div className="custom-tooltip">
        <p className="label">{`Total listening time: ${payload[0].payload.totalTime} minutes`}</p>
        <p className="desc">Total tracks played: {payload[0].payload.totalPlaybacks}<br />
          Favourite track: {payload[0].payload.mostPlayedTrack}<br />
          Favourite artist: {payload[0].payload.mostPlayedArtist}<br />
        </p>
      </div>
    );
  }

  return null;
};

