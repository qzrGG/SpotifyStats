import { Component, useCallback } from "react";
import React from "react";
import { FixedSizeList } from "react-window";
import "./Table.css";
import { StatColumn, StatRow } from "../models/StatRow";
import Scrollbars from "react-custom-scrollbars-2";

interface RankingProps {
  onSubsetChanged: (subset: StatRow) => void;
  data: StatRow[];
  columns: StatColumn[];
}

export class Ranking extends Component<RankingProps> {
  listRef = React.createRef<FixedSizeList>();
  pos = 0;

  constructor(props: Readonly<RankingProps>) {
    super(props);
  }

  shouldComponentUpdate(nextProps: RankingProps) {
      if (nextProps.data.length === this.props.data.length)
          return false;

      return true;
  }

  componentDidUpdate(prevProps: RankingProps) {
      if (prevProps.data.length !== this.props.data.length) {
          this.listRef.current?.scrollTo(0);
      }
  }

  onRowSelected = (row: StatRow) => {
    this.props.onSubsetChanged(row);
  }
  
  render() {
    const Row = ({ index, style }: any) => (
      <div className="d-flex stats-row" style={style} onClick={_ => this.onRowSelected(this.props.data[index])}>
        {this.props.columns.map((x) => (
          <div key={x.header} style={x.style} className="data-cell">{x.selector(this.props.data[index])}</div>
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
        <div className="data-items mb-2">
          <FixedSizeList
            height={400}
            itemCount={this.props.data.length}
            itemSize={40}
            width="100%"
            outerElementType={CustomScrollbarsVirtualList}
            ref={this.listRef}
          >
            {Row}
          </FixedSizeList>
        </div>
    );
  }
}
