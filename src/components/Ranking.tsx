import { useCallback, useEffect } from "react";
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

const Ranking: React.FC<RankingProps> = (props) => {
  const listRef = React.createRef<FixedSizeList>();

  useEffect(() => {
    listRef.current?.scrollTo(0);
  }, [props.data, listRef]);

  const onRowSelected = (row: StatRow) => {
    props.onSubsetChanged(row);
  }

  const Row = ({ index, style }: any) => (
    <div className="d-flex stats-row" style={style} onClick={_ => onRowSelected(props.data[index])}>
      {props.columns.map((x) => (
        <div key={x.header} style={x.style} className="data-cell">{x.selector(props.data[index])}</div>
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
        itemCount={props.data.length}
        itemSize={40}
        width="100%"
        outerElementType={CustomScrollbarsVirtualList}
        ref={listRef}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

const areEqual = (prevProps: RankingProps, nextProps: RankingProps): boolean => {
  return prevProps.data === nextProps.data;
 }

export default React.memo(Ranking, areEqual);