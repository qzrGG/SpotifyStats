import { Component } from "react";
import { from } from "linq-to-typescript";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import "./Table.css";
import Comparer from "../models/Comparer";
import { minutes, round } from "../common/math.helper";
import { StatRow } from "../models/StatRow";
import { Ranking } from "./Ranking";
import { ListeningEntry } from "../models/listeningEntry";
import { Chart } from "./Chart";

interface TabProps {
  listeningHistory: ListeningEntry[];
  since: Date;
  to: Date;
}

interface TabState {
  tableType: TableType;
  searchPhrase: string;
  orderByColumn: number;
  descendingOrder: boolean;
  scrollPosition: number;
  data: StatRow[];
  listeningHistorySubset: ListeningEntry[];
  subsetDescription: string;
}

enum TableType {
  trackAndArtist = 0,
  artistOnly = 1
}

export class Table extends Component<TabProps, TabState> {
  constructor(props: Readonly<TabProps>) {
    super(props);
    this.state = {
      tableType: TableType.trackAndArtist,
      searchPhrase: "",
      orderByColumn: 0,
      descendingOrder: false,
      scrollPosition: 0,
      data: [],
      listeningHistorySubset: [],
      subsetDescription: ""
    };
  }

  groupByProperty = (type: TableType): ((x: ListeningEntry) => string) => {
    switch (type) {
      case TableType.trackAndArtist:
        return x => `${x.trackName}|${x.artistName}`;
      case TableType.artistOnly:
        return x => x.artistName;
    }
  }

  tableData = (): StatRow[] => {
    let result = from(this.props.listeningHistory)
      .groupBy(this.groupByProperty(this.state.tableType))
      .select(x => ({ x, count: x.count(), sum: x.sum(t => t.msPlayed) }))
      .orderByDescending(x => x.count, Comparer)
      .thenByDescending(x => x.sum)
      .select(({ x, count, sum }, i) => {
        return {
          id: i + 1,
          trackName: x.first().trackName,
          artistName: x.first().artistName,
          playedTimes: count,
          totalListeningTime: round(sum / 60000, 2),
          entries: x.toArray()
        }
      })
      .where(x => x.artistName.toLowerCase().indexOf(this.state.searchPhrase) > -1
        || (this.state.tableType === TableType.trackAndArtist && x.trackName.toLowerCase().indexOf(this.state.searchPhrase) > -1)
      );

    switch (this.state.orderByColumn) {
      case 0: result = result.orderBy(x => x.id, Comparer); break;
      case 1: result = result.orderBy(x => x.trackName); break;
      case 2: result = result.orderBy(x => x.artistName); break;
      case 3: result = result.orderBy(x => x.id, Comparer); break;
      case 4: result = result.orderBy(x => x.totalListeningTime, Comparer); break;
    }

    if (this.state.descendingOrder)
      result = result.reverse();

    return result.toArray();
  }

  orderByChanged = (column: number) => {
    if (this.state.orderByColumn === column)
      this.setState({ descendingOrder: !this.state.descendingOrder });
    else
      this.setState({ descendingOrder: false, orderByColumn: column });
  }

  typeChanged = (type: TableType) => this.setState({ tableType: type, orderByColumn: 0, descendingOrder: false });

  onRowSelected = (row: StatRow) => {
    const description = this.state.tableType === TableType.artistOnly ? row.artistName : `${row.trackName} by ${row.artistName}`;
    this.setState({ listeningHistorySubset: row.entries, subsetDescription: description });
  }

  onSearchedTextChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchPhrase: e.target.value.toLowerCase() });
  }

  render() {
    const data = this.tableData();

    const columns = [{
      header: "#",
      selector: (x: StatRow) => x.id,
      style: { flex: 1 }
    }, {
      header: "Track",
      selector: (x: StatRow) => x.trackName,
      style: { flex: 10, display: this.state.tableType === TableType.trackAndArtist ? "table-cell " : "none" },
    }, {
      header: "Artist",
      selector: (x: StatRow) => x.artistName,
      style: { flex: 10 }
    }, {
      header: "Streams",
      selector: (x: StatRow) => x.playedTimes,
      style: { flex: 2 }
    }, {
      header: "Minutes",
      selector: (x: StatRow) => minutes(x.totalListeningTime),
      style: { flex: 2 }
    }, {
      header: "Earnings ($)",
      selector: (x: StatRow) => round(x.playedTimes * 0.004, 2),
      style: { flex: 2, display: this.state.tableType === TableType.artistOnly ? "table-cell " : "none" }
    }];

    return (
      <React.Fragment>
        <div className="d-flex align-items-center mb-2">
          <div style={{ flex: 1 }}>
            <span className="section-header">Your favourites</span>
          </div>
          <div style={{ flex: 1 }}>
            <input type="text" className="form-control" placeholder="Search" style={{ borderRadius: 50 }}
              onChange={this.onSearchedTextChanged}
            />
            <span>Items in total: {data.length}</span>
          </div>
        </div>

        <ButtonGroup className="d-flex mb-3" size="md">
          <Button active={this.state.tableType === TableType.trackAndArtist} color="primary" onClick={() => this.typeChanged(TableType.trackAndArtist)}>Favourite tracks</Button>
          <Button active={this.state.tableType === TableType.artistOnly} color="primary" onClick={() => this.typeChanged(TableType.artistOnly)}>Favourite artists</Button>
        </ButtonGroup>

        <div className="data-header">
          {columns.map((x, i) => (
            <div key={i} className={"data-cell" + (this.state.orderByColumn === i ? " order-by" : "")} style={x.style} onClick={() => this.orderByChanged(i)}>{x.header}</div>
          ))}
        </div>

        <Ranking data={data} columns={columns} onSubsetChanged={this.onRowSelected} />
        <Chart listeningHistory={this.state.listeningHistorySubset} description={`Details for ${this.state.subsetDescription}`} since={this.props.since} to={this.props.to} />

      </React.Fragment>
    );
  }
}
