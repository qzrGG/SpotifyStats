import React, { Component } from 'react';
import ReactDropzone from 'react-dropzone';

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
  chartFunc: (date: Date) => number | string;
}

export class Stats extends Component<StatsProps, StatsState> {
  static displayName = Stats.name;

  constructor(props: Readonly<StatsProps>) {
    super(props);
    this.state = { listeningEntries: [], chartFunc: x => x.getHours() };
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

  songsData = () => from(this.state.listeningEntries).groupBy(x => x.trackName + x.artistName).select(x => {
    return {
      trackName: x.first().trackName,
      artistName: x.first().artistName,
      playedTimes: x.count(),
      totalListeningTime: Math.round(x.sum(x => x.msPlayed) / 60000)
    }
  }).toArray();

  artistsData = () => from(this.state.listeningEntries).groupBy(x => x.artistName).select(x => {
    return {
      artistName: x.first().artistName,
      playedTimes: x.count(),
      totalListeningTime: Math.round(x.sum(x => x.msPlayed) / 60000)
    }
  }).toArray();

  chartData = () => from(this.state.listeningEntries)
    .groupBy(x => this.state.chartFunc(new Date(x.endTime)))
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

  changeChartFunc = (x: any) => {
    const type = x.target.value;
    switch (type) {
      case "Hours": this.setState({ ... this.state, chartFunc: x => x.getHours() }); break;
      case "Days of week": this.setState({ ... this.state, chartFunc: x => x.getDay() }); break;
      case "Weeks": this.setState({ ... this.state, chartFunc: x => x.getDate() }); break;//todo
      case "Months": this.setState({ ... this.state, chartFunc: x => x.getMonth() }); break;
    }
  }
  render() {
    return (
      <div>
        <h1>Stats</h1>

        <ReactDropzone onDrop={this.loadFiles}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </ReactDropzone>

        <ButtonGroup>
          <Button color="primary" onClick={() => this.setState({ ... this.state, chartFunc: x => x.getHours() })} >Hours</Button>
          <Button color="primary" onClick={() => this.setState({ ... this.state, chartFunc: x => x.getDay() + 1 })}>Days of week</Button>
          <Button color="primary" onClick={() => this.setState({ ... this.state, chartFunc: x => x.getMonth() + 1 })}>Months</Button>
        </ButtonGroup>
        {/* <div onChange={this.changeChartFunc}>
                <input type="radio" value="Hours" name="type" /> Hours
          <input type="radio" value="Days of week" name="type" />
                <input type="radio" value="Weeks" name="type" />
                <input type="radio" value="Months" name="type" />

              </div> */}
        <LineChart
          width={1100}
          height={500}
          data={this.chartData()}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="5 5" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={CustomTooltip} />
          <Legend />
          <Line type="monotone" dataKey="totalTime" stroke="#8884d8" />
        </LineChart>
        <ReactTable
          data={this.songsData()}
          columns={[

            {
              Header: "artistName",
              accessor: "artistName"
            },
            {
              Header: "trackName",
              accessor: "trackName"
            },
            {
              Header: "playedTimes",
              accessor: "playedTimes"
            },
            {
              Header: "totalListeningTime minutes",
              accessor: "totalListeningTime"
            }


          ]}
          defaultSorted={[
            {
              id: "playedTimes",
              desc: true
            }
          ]}
          defaultPageSize={20}
          className="-striped -highlight table"
        />

        <ReactTable
          data={this.artistsData()}
          columns={[

            {
              Header: "artistName",
              accessor: "artistName"
            },
            {
              Header: "playedTimes",
              accessor: "playedTimes"
            },
            {
              Header: "totalListeningTime minutes",
              accessor: "totalListeningTime"
            }


          ]}
          defaultSorted={[
            {
              id: "playedTimes",
              desc: true
            }
          ]}
          defaultPageSize={20}
          className="-striped -highlight table"
        />

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

