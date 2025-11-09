import { useCallback, useEffect } from "react";
import React from "react";
import { FixedSizeList } from "react-window";
import styles from "./Table.module.css";
import { StatColumn, StatRow } from "../models/StatRow";
import Scrollbars from "react-custom-scrollbars-2";

interface RankingProps {
  onSubsetChanged: (subset: StatRow) => void;
  data: StatRow[];
  columns: StatColumn[];
  selectedRowId: number | null;
}

const Ranking: React.FC<RankingProps> = (props) => {
  const listRef = React.createRef<FixedSizeList>();

  useEffect(() => {
    listRef.current?.scrollTo(0);
  }, [props.data, listRef]);

  const onRowSelected = (row: StatRow) => {
    props.onSubsetChanged(row);
  }

  // Create itemData to pass to Row component
  const itemData = {
    data: props.data,
    columns: props.columns,
    selectedRowId: props.selectedRowId,
    onRowSelected: onRowSelected
  };

  const Row = ({ index, style, data }: any) => {
    const row = data.data[index];
    const isSelected = row.id === data.selectedRowId;

    return (
      <div
        className={`${styles.tableRow} ${isSelected ? styles.selected : ''}`}
        style={style}
        onClick={_ => data.onRowSelected(row)}
      >
        {data.columns.map((x: any) => (
          <div
            key={x.header}
            style={x.style}
            className={`${styles.tableCell} ${x.alignRight ? styles.rightAlign : ''}`}
          >
            {x.selector(row)}
          </div>
        ))}
      </div>
    );
  };

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
    <div className={styles.tableBody}>
      <FixedSizeList
        height={400}
        itemCount={props.data.length}
        itemSize={48}
        width="100%"
        outerElementType={CustomScrollbarsVirtualList}
        ref={listRef}
        itemData={itemData}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

const areEqual = (prevProps: RankingProps, nextProps: RankingProps): boolean => {
  return prevProps.data === nextProps.data && prevProps.selectedRowId === nextProps.selectedRowId;
}

export default React.memo(Ranking, areEqual);