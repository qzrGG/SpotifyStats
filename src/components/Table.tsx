import { from } from "linq-to-typescript";
import React, { useState, useEffect, useContext } from "react";
import { ButtonGroup, Button } from "reactstrap";
import "./Table.css";
import Comparer from "../models/Comparer";
import { minutes, round } from "../common/math.helper";
import { StatRow } from "../models/StatRow";
import Ranking from "./Ranking";
import { ListeningEntry } from "../models/listeningEntry";
import Chart from "./Chart";
import StatsContext from "./StatsContext";

interface TabProps {
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

const Table: React.FC<TabProps> = (props) => {
  const [state, setState] = useState<TabState>({
    tableType: TableType.trackAndArtist,
    searchPhrase: "",
    orderByColumn: 0,
    descendingOrder: false,
    scrollPosition: 0,
    data: [],
    listeningHistorySubset: [],
    subsetDescription: ""
  });

  const groupByProperty = (type: TableType): ((x: ListeningEntry) => string) => {
    switch (type) {
      case TableType.trackAndArtist:
        return x => `${x.trackName}|${x.artistName}`;
      case TableType.artistOnly:
        return x => x.artistName;
    }
  }

  const context = useContext(StatsContext);

  useEffect(() => {
    let result = from(context.listeningHistory)
      .groupBy(groupByProperty(state.tableType))
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
      .where(x => x.artistName.toLowerCase().indexOf(state.searchPhrase) > -1
        || (state.tableType === TableType.trackAndArtist && x.trackName.toLowerCase().indexOf(state.searchPhrase) > -1)
      );

    switch (state.orderByColumn) {
      case 0: result = result.orderBy(x => x.id, Comparer); break;
      case 1: result = result.orderBy(x => x.trackName); break;
      case 2: result = result.orderBy(x => x.artistName); break;
      case 3: result = result.orderBy(x => x.id, Comparer); break;
      case 4: result = result.orderBy(x => x.totalListeningTime, Comparer); break;
    }

    if (state.descendingOrder)
      result = result.reverse();

    setState(s => ({ ...s, data: result.toArray() }));
  }, [context.listeningHistory, state.descendingOrder, state.orderByColumn, state.searchPhrase, state.tableType]);

  const orderByChanged = (column: number) => {
    if (state.orderByColumn === column)
      setState({ ...state, descendingOrder: !state.descendingOrder });
    else
      setState({ ...state, descendingOrder: false, orderByColumn: column });
  }

  const typeChanged = (type: TableType) => setState({ ...state, tableType: type, orderByColumn: 0, descendingOrder: false });

  const onRowSelected = (row: StatRow) => {
    const description = state.tableType === TableType.artistOnly ? row.artistName : `${row.trackName} by ${row.artistName}`;
    setState({ ...state, listeningHistorySubset: row.entries, subsetDescription: description });
  }

  const onSearchedTextChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, searchPhrase: e.target.value.toLowerCase() });
  }

  const columns = [{
    header: "#",
    selector: (x: StatRow) => x.id,
    style: { flex: 1 }
  }, {
    header: "Track",
    selector: (x: StatRow) => x.trackName,
    style: { flex: 10, display: state.tableType === TableType.trackAndArtist ? "table-cell " : "none" },
  }, {
    header: "Artist",
    selector: (x: StatRow) => x.artistName,
    style: { flex: 10 }
  }, {
    header: "Streams",
    selector: (x: StatRow) => x.playedTimes,
    style: { flex: 2 }
  }, {
    header: "Time",
    selector: (x: StatRow) => minutes(x.totalListeningTime),
    style: { flex: 3 }
  }, {
    header: "Earnings ($)",
    selector: (x: StatRow) => round(x.playedTimes * 0.004, 2),
    style: { flex: 2, display: state.tableType === TableType.artistOnly ? "table-cell " : "none" }
  }];

  return (
    <React.Fragment>
      <div className="d-flex align-items-center mb-2">
        <div style={{ flex: 1 }}>
          <span className="section-header">Your favourites</span>
        </div>
        <div style={{ flex: 1 }}>
          <input type="text" className="form-control" placeholder="Search" style={{ borderRadius: 50 }}
            onChange={onSearchedTextChanged}
          />
          <span>Items in total: {state.data.length}</span>
        </div>
      </div>

      <ButtonGroup className="d-flex mb-3" size="md">
        <Button active={state.tableType === TableType.trackAndArtist} color="primary" onClick={() => typeChanged(TableType.trackAndArtist)}>Favourite tracks</Button>
        <Button active={state.tableType === TableType.artistOnly} color="primary" onClick={() => typeChanged(TableType.artistOnly)}>Favourite artists</Button>
      </ButtonGroup>

      <div className="data-header">
        {columns.map((x, i) => (
          <div key={i} className={"data-cell" + (state.orderByColumn === i ? " order-by" : "")} style={x.style} onClick={() => orderByChanged(i)}>{x.header}</div>
        ))}
      </div>

      <Ranking data={state.data} columns={columns} onSubsetChanged={onRowSelected} />
      <Chart description={`Details for ${state.subsetDescription}`} subset={state.listeningHistorySubset} />

    </React.Fragment>
  );
}

export default Table;