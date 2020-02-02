import { Component, useCallback } from "react";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import { FixedSizeList } from 'react-window'
import { Scrollbars } from "react-custom-scrollbars";
import "./Table.css";
import Comparer from "../models/Comparer";

interface TabProps {
  listeningHistory: ListeningEntry[];
}

interface StatRow {
  trackName: string;
  artistName: string;
  playedTimes: number;
  totalListeningTime: number;
  id: number;
}

interface TabState {
  tableFuncId: number;
  searchPhrase: string;
  orderByColumn: number;
  descendingOrder: boolean;
}

export class Table extends Component<TabProps, TabState> {
  tableFuncs: ((x: ListeningEntry) => string)[] = [x => x.trackName + x.artistName, x => x.artistName]

  constructor(props: Readonly<TabProps>) {
    super(props);
    this.state = { tableFuncId: 0, searchPhrase: "", orderByColumn: 0, descendingOrder: false };
  }

  tableData = (): StatRow[] => {
    let result = from(this.props.listeningHistory)
      .groupBy(this.tableFuncs[this.state.tableFuncId])
      .select(x => ({ x, count: x.count(), sum: x.sum(t => t.msPlayed) }))
      .orderByDescending(x => x.count, Comparer)
      .thenByDescending(x => x.sum)
      .select(({ x, count, sum }, i) => {
        return {
          id: i + 1,
          trackName: x.first().trackName,
          artistName: x.first().artistName,
          playedTimes: count,
          totalListeningTime: Math.round(sum / 60000)
        }
      })
      .where(x => x.artistName.toLowerCase().indexOf(this.state.searchPhrase) > -1
        || (this.state.tableFuncId === 0 && x.trackName.toLowerCase().indexOf(this.state.searchPhrase) > -1)
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

  typeChanged = (type: number) => this.setState({ ...this.state, tableFuncId: type, orderByColumn: 0, descendingOrder: false });

  render() {
    const data = this.tableData();

    const columns = [{
      header: "#",
      selector: (x: StatRow) => x.id,
      style: { width: 60 }
    }, {
      header: "Track",
      selector: (x: StatRow) => x.trackName,
      style: { flex: 1, display: this.state.tableFuncId === 0 ? "table-cell " : "none" },
    }, {
      header: "Artist",
      selector: (x: StatRow) => x.artistName,
      style: { flex: 1 }
    }, {
      header: "Play Count",
      selector: (x: StatRow) => x.playedTimes,
      style: { width: 150 }
    }, {
      header: "Listening Time",
      selector: (x: StatRow) => x.totalListeningTime,
      style: { width: 150 }
    }];

    const Row = ({ index, style }: any) => (
      <div className="d-flex" style={style}>
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
      }, []);

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
        <h2 className="display-4 mb-4">Your favourites</h2>

        <ButtonGroup className="d-flex mb-3" size="lg">
          <Button active={this.state.tableFuncId === 0} color="primary" onClick={() => this.typeChanged(0)}>Favourite tracks</Button>
          <Button active={this.state.tableFuncId === 1} color="primary" onClick={() => this.typeChanged(1)}>Favourite artists</Button>
        </ButtonGroup>

        <input type="text" className="form-control mb-3" placeholder="Search" style={{ borderRadius: 50 }}
          onChange={e => this.setState({ ...this.state, searchPhrase: e.target.value })}
        />

        <div className="data-header">
          {columns.map((x, i) => (
            <div key={i} className={this.state.orderByColumn === i ? "order-by" : ""} style={x.style} onClick={() => this.orderByChanged(i)}>{x.header}</div>
          ))}
        </div>

        <div className="data-items mb-2">
          <FixedSizeList
            height={490}
            itemCount={data.length}
            itemSize={49}
            width="100%"
            outerElementType={CustomScrollbarsVirtualList}
          >
            {Row}
          </FixedSizeList>
        </div>
        <p>Items in total: {data.length}</p>

      </React.Fragment>
    );
  }
}
