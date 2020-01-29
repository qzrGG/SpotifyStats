import React, { Component } from 'react';
import ReactDropzone from 'react-dropzone';

import { ListeningEntry } from '../models/listeningEntry';
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";
import { from } from "linq-to-typescript"

export interface CounterProps {

}

export interface CounterState {
  currentCount: number;
  listeningEntries: ListeningEntry[];
}

export class Counter extends Component<CounterProps, CounterState> {
  static displayName = Counter.name;

  constructor(props: Readonly<CounterProps>) {
    super(props);
    this.state = { currentCount: 0, listeningEntries: [] };
    this.incrementCounter = this.incrementCounter.bind(this);
  }

  incrementCounter() {
    this.setState({
      currentCount: this.state.currentCount + 1
    });
  }

  loadFiles = (files: File[]) => {
    this.setState({ ...this.state, listeningEntries: [] }, () => {
      files.forEach(f => {
        if (!f.name.startsWith("StreamingHistory")) return;

        let fileReader = new FileReader();
        fileReader.onloadend = (e) => {
          let ls = JSON.parse(fileReader.result as string);
          this.setState({ ...this.state, listeningEntries: [...this.state.listeningEntries, ...ls] }, () => console.log(this.state.listeningEntries));
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
  
  render() {
    return (
      <div>
        <h1>Counter</h1>

        <p>This is a simple example of a React component.</p>

        <p aria-live="polite">Current count: <strong>{this.state.currentCount}</strong></p>

        <button className="btn btn-primary" onClick={this.incrementCounter}>Increment</button>

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
