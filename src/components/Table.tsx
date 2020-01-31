import { Component } from "react";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import ReactTable from "react-table-6";
import "react-table-6/react-table.css";

export interface TabProps {
  listeningHistory: ListeningEntry[];
}

interface TabState {
  tableFuncId: number;
}

export class Table extends Component<TabProps, TabState> {
  tableFuncs = [(x: ListeningEntry) => x.trackName + x.artistName, (x: ListeningEntry) => x.artistName]

  constructor(props: Readonly<TabProps>) {
    super(props);
    this.state = { tableFuncId: 0 };
  }

  tableData = () => from(this.props.listeningHistory).groupBy(this.tableFuncs[this.state.tableFuncId]).select(x => {
    return {
      trackName: x.first().trackName,
      artistName: x.first().artistName,
      playedTimes: x.count(),
      totalListeningTime: Math.round(x.sum(x => x.msPlayed) / 60000)
    }
  }).toArray();

  render() {
    return (
      <React.Fragment>

        <ButtonGroup className="d-flex">
          <Button active={this.state.tableFuncId === 0} color="primary" onClick={() => this.setState({ ... this.state, tableFuncId: 0 })}>Favourite tracks</Button>
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
      </React.Fragment>
    )
  }

}