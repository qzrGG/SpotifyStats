import { Component, useCallback } from "react";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import { FixedSizeList } from 'react-window'
import { Scrollbars } from "react-custom-scrollbars";
import "./Table.css";
import Comparer from "../models/Comparer";
import { round } from "../common/math.helper";

interface TabProps {
  listeningHistory: ListeningEntry[];
  onSubsetChanged: (subset: ListeningEntry[], description: string) => void;
}

interface StatRow {
  trackName: string;
  artistName: string;
  playedTimes: number;
  totalListeningTime: number;
  id: number;
  entries: ListeningEntry[];
}

interface TabState {
  tableType: TableType;
  searchPhrase: string;
  orderByColumn: number;
  descendingOrder: boolean;
}

enum TableType {
  trackAndArtist = 0,
  artistOnly = 1
}

export class Table extends Component<TabProps, TabState> {
  
  constructor(props: Readonly<TabProps>) {
    super(props);
    this.state = { tableType: TableType.trackAndArtist, searchPhrase: "", orderByColumn: 0, descendingOrder: false };
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
          totalListeningTime: Math.round(sum / 60000),
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
      this.setState({ ...this.state, descendingOrder: !this.state.descendingOrder });
    else
      this.setState({ ...this.state, descendingOrder: false, orderByColumn: column });
  }

  typeChanged = (type: TableType) => this.setState({ ...this.state, tableType: type, orderByColumn: 0, descendingOrder: false });

  onRowSelected = (row: StatRow) => {
    const description = this.state.tableType === TableType.artistOnly ? row.artistName : `${row.trackName} by ${row.artistName}`;
    this.props.onSubsetChanged(row.entries, description);
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
      selector: (x: StatRow) => x.totalListeningTime,
      style: { flex: 2 }
    }, {
      header: "Earnings ($)",
      selector: (x: StatRow) => round(x.playedTimes * 0.004, 2),
      style: { flex: 2, display: this.state.tableType === TableType.artistOnly ? "table-cell " : "none" }
    }];

    const Row = ({ index, style }: any) => (
      <div className="d-flex stats-row" style={style} onClick={_ => this.onRowSelected(data[index])}>
        {columns.map((x) => (
          <div key={x.header} style={x.style} className="data-cell">{x.selector(data[index])}</div>
        ))}
      </div>
    );

    const CustomScrollbars = ({ onScroll, forwardedRef, style, children }: any) => {
      const refSetter = useCallback(scrollbarsRef => {
        if (scrollbarsRef) {
          forwardedRef(scrollbarsRef.view);
        } else {
          forwardedRef(null);
        }
      }, [forwardedRef]);

      return (
        <Scrollbars
          ref={refSetter}
          style={{ ...style, overflow: "hidden" }}
          onScroll={onScroll}
        >
          {children}
        </Scrollbars>
      );
    };

    const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => (
      <CustomScrollbars {...props} forwardedRef={ref} />
    ));

    return (
      <React.Fragment>
        <div className="d-flex align-items-center mb-2">
          <div style={{flex: 1}}>
            <span className="section-header">Your favourites</span>
          </div>
          <div style={{flex: 1}}>
            <input type="text" className="form-control" placeholder="Search" style={{ borderRadius: 50 }}
              onChange={e => this.setState({ ...this.state, searchPhrase: e.target.value.toLowerCase() })}
            />
            <span>Items in total: {data.length}</span>
          </div>
        </div>

        <ButtonGroup className="d-flex mb-3" size="lg">
          <Button active={this.state.tableType === TableType.trackAndArtist} color="primary" onClick={() => this.typeChanged(TableType.trackAndArtist)}>Favourite tracks</Button>
          <Button active={this.state.tableType === TableType.artistOnly} color="primary" onClick={() => this.typeChanged(TableType.artistOnly)}>Favourite artists</Button>
        </ButtonGroup>

        <div className="data-header">
          {columns.map((x, i) => (
            <div key={i} className={"data-cell" + (this.state.orderByColumn === i ? " order-by" : "")} style={x.style} onClick={() => this.orderByChanged(i)}>{x.header}</div>
          ))}
        </div>

        <div className="data-items mb-2">
          <FixedSizeList
            height={480}
            itemCount={data.length}
            itemSize={40}
            width="100%"
            outerElementType={CustomScrollbarsVirtualList}
          >
            {Row}
          </FixedSizeList>
        </div>


      </React.Fragment>
    );
  }
}
