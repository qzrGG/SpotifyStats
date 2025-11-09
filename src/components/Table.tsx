import { from } from "linq-to-typescript";
import React, { useState, useEffect, useContext, useMemo } from "react";
import styles from "./Table.module.css";
import Comparer from "../models/Comparer";
import { minutes, round } from "../common/math.helper";
import { StatRow } from "../models/StatRow";
import Ranking from "./Ranking";
import { ListeningEntry } from "../models/listeningEntry";
import Chart from "./Chart";
import StatsContext from "./StatsContext";
import { useStatsCache } from "../hooks/useStatsCache";

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
  selectedRowId: number | null;
  showFilters: boolean;
  playCountMin: string;
  playCountMax: string;
  timeMin: string;
  timeMax: string;
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
    subsetDescription: "",
    selectedRowId: null,
    showFilters: false,
    playCountMin: "",
    playCountMax: "",
    timeMin: "",
    timeMax: ""
  });

  const formatTime = (totalMinutes: number) => {
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = Math.floor(totalMinutes % 60);
    const secs = Math.round((totalMinutes % 1) * 60);

    // Build array of non-zero units
    const units: { value: number; label: string; shortLabel: string }[] = [];
    if (days > 0) units.push({ value: days, label: days === 1 ? 'day' : 'days', shortLabel: 'd' });
    if (hours > 0) units.push({ value: hours, label: hours === 1 ? 'hour' : 'hours', shortLabel: 'h' });
    if (mins > 0) units.push({ value: mins, label: mins === 1 ? 'minute' : 'minutes', shortLabel: 'min' });
    if (secs > 0) units.push({ value: secs, label: secs === 1 ? 'second' : 'seconds', shortLabel: 's' });

    // If no units, show "0s"
    if (units.length === 0) {
      return { short: '0s', full: '0 seconds' };
    }

    // Take top 2 units for short display
    const shortUnits = units.slice(0, 2);
    const shortFormat = shortUnits.map(u => `${u.value}${u.shortLabel}`).join(' ');

    // Full format with all units
    const fullFormat = units.map(u => `${u.value} ${u.label}`).join(', ');

    return { short: shortFormat, full: fullFormat };
  };

  const groupByProperty = (type: TableType): ((x: ListeningEntry) => string) => {
    switch (type) {
      case TableType.trackAndArtist:
        return x => `${x.trackName}|${x.artistName}`;
      case TableType.artistOnly:
        return x => x.artistName;
    }
  }

  const context = useContext(StatsContext);

  // Memoize the base grouped data - this is the most expensive operation
  const groupedData = useStatsCache((entries) => {
    return from(entries)
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
      .toArray();
  }, context.listeningHistory, context.since, context.to, [state.tableType]);

  // Apply filtering and sorting to the grouped data
  useEffect(() => {
    let result = from(groupedData)
      .where(x => x.artistName.toLowerCase().indexOf(state.searchPhrase) > -1
        || (state.tableType === TableType.trackAndArtist && x.trackName.toLowerCase().indexOf(state.searchPhrase) > -1)
      );

    // Apply advanced filters
    if (state.playCountMin !== "") {
      const min = parseInt(state.playCountMin);
      if (!isNaN(min)) {
        result = result.where(x => x.playedTimes >= min);
      }
    }
    if (state.playCountMax !== "") {
      const max = parseInt(state.playCountMax);
      if (!isNaN(max)) {
        result = result.where(x => x.playedTimes <= max);
      }
    }
    if (state.timeMin !== "") {
      const min = parseFloat(state.timeMin);
      if (!isNaN(min)) {
        result = result.where(x => x.totalListeningTime >= min);
      }
    }
    if (state.timeMax !== "") {
      const max = parseFloat(state.timeMax);
      if (!isNaN(max)) {
        result = result.where(x => x.totalListeningTime <= max);
      }
    }

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
  }, [groupedData, state.descendingOrder, state.orderByColumn, state.searchPhrase, state.tableType, state.playCountMin, state.playCountMax, state.timeMin, state.timeMax]);

  const orderByChanged = (column: number) => {
    if (state.orderByColumn === column)
      setState({ ...state, descendingOrder: !state.descendingOrder });
    else
      setState({ ...state, descendingOrder: false, orderByColumn: column });
  }

  const typeChanged = (type: TableType) => setState({
    ...state,
    tableType: type,
    orderByColumn: 0,
    descendingOrder: false,
    selectedRowId: null,
    listeningHistorySubset: [],
    subsetDescription: ""
  });

  const onRowSelected = (row: StatRow) => {
    const description = state.tableType === TableType.artistOnly ? row.artistName : `${row.trackName} by ${row.artistName}`;
    setState({ ...state, listeningHistorySubset: row.entries, subsetDescription: description, selectedRowId: row.id });
  }

  const onSearchedTextChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, searchPhrase: e.target.value.toLowerCase() });
  }

  const clearSearch = () => {
    setState({ ...state, searchPhrase: "" });
  }

  const toggleFilters = () => {
    setState({ ...state, showFilters: !state.showFilters });
  }

  const exportData = (format: 'csv' | 'json') => {
    const data = state.data;

    if (format === 'csv') {
      const headers = state.tableType === TableType.trackAndArtist
        ? ['Rank', 'Track', 'Artist', 'Streams', 'Time (minutes)', 'Earnings (USD)']
        : ['Rank', 'Artist', 'Streams', 'Time (minutes)', 'Earnings (USD)'];

      const rows = data.map(row => {
        const earnings = (row.playedTimes * 0.004).toFixed(2);
        return state.tableType === TableType.trackAndArtist
          ? [row.id, row.trackName, row.artistName, row.playedTimes, row.totalListeningTime, earnings]
          : [row.id, row.artistName, row.playedTimes, row.totalListeningTime, earnings];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `spotify-stats-${state.tableType === TableType.trackAndArtist ? 'tracks' : 'artists'}.csv`;
      link.click();
    } else {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `spotify-stats-${state.tableType === TableType.trackAndArtist ? 'tracks' : 'artists'}.json`;
      link.click();
    }
  }

  const activeFilterCount = [
    state.playCountMin,
    state.playCountMax,
    state.timeMin,
    state.timeMax
  ].filter(x => x !== "").length;

  const columns = [{
    header: "#",
    selector: (x: StatRow) => x.id,
    style: { flex: 1 },
    alignRight: false
  }, {
    header: "Track",
    selector: (x: StatRow) => x.trackName,
    style: state.tableType === TableType.trackAndArtist ? { flex: 10 } : { flex: 10, display: "none" },
    alignRight: false
  }, {
    header: "Artist",
    selector: (x: StatRow) => x.artistName,
    style: { flex: 10 },
    alignRight: false
  }, {
    header: "Streams",
    selector: (x: StatRow) => x.playedTimes,
    style: { flex: 2 },
    alignRight: true
  }, {
    header: "Time",
    selector: (x: StatRow) => {
      const formatted = formatTime(x.totalListeningTime);
      return <span title={formatted.full}>{formatted.short}</span>;
    },
    style: { flex: 3 },
    alignRight: true
  }, {
    header: "Earnings",
    selector: (x: StatRow) => {
      const earnings = x.playedTimes * 0.004;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(earnings);
    },
    style: state.tableType === TableType.artistOnly ? { flex: 2 } : { flex: 2, display: "none" },
    alignRight: true
  }];

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div className={styles.title}>Your favourites</div>

        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search tracks or artists..."
              value={state.searchPhrase}
              onChange={onSearchedTextChanged}
            />
            {state.searchPhrase && (
              <button className={styles.clearButton} onClick={clearSearch}>×</button>
            )}
          </div>

          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${state.tableType === TableType.trackAndArtist ? styles.active : ''}`}
              onClick={() => typeChanged(TableType.trackAndArtist)}
            >
              Favourite tracks
            </button>
            <button
              className={`${styles.modeButton} ${state.tableType === TableType.artistOnly ? styles.active : ''}`}
              onClick={() => typeChanged(TableType.artistOnly)}
            >
              Favourite artists
            </button>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.actionButton} onClick={toggleFilters}>
              Filters
              {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
            </button>
            <button className={styles.actionButton} onClick={() => exportData('csv')}>
              💾 Export CSV
            </button>
          </div>
        </div>
      </div>

      <span className={styles.itemCount}>Items: {state.data.length}</span>

      {state.showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filtersTitle}>Advanced Filters</div>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Play Count Range</label>
              <div className={styles.filterInputGroup}>
                <input
                  type="number"
                  className={styles.filterInput}
                  placeholder="Min"
                  value={state.playCountMin}
                  onChange={(e) => setState({ ...state, playCountMin: e.target.value })}
                />
                <span className={styles.filterSeparator}>—</span>
                <input
                  type="number"
                  className={styles.filterInput}
                  placeholder="Max"
                  value={state.playCountMax}
                  onChange={(e) => setState({ ...state, playCountMax: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Listening Time Range (minutes)</label>
              <div className={styles.filterInputGroup}>
                <input
                  type="number"
                  className={styles.filterInput}
                  placeholder="Min"
                  value={state.timeMin}
                  onChange={(e) => setState({ ...state, timeMin: e.target.value })}
                />
                <span className={styles.filterSeparator}>—</span>
                <input
                  type="number"
                  className={styles.filterInput}
                  placeholder="Max"
                  value={state.timeMax}
                  onChange={(e) => setState({ ...state, timeMax: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {state.data.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyText}>No tracks match your search or filters</div>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.tableHeader}>
              {columns.map((x, i) => (
                <div
                  key={i}
                  className={`${styles.headerCell} ${state.orderByColumn === i ? styles.sorted : ''} ${x.alignRight ? styles.rightAlign : ''}`}
                  style={x.style}
                  onClick={() => orderByChanged(i)}
                >
                  {x.header}
                  {state.orderByColumn === i && (
                    <span className={`${styles.sortIcon} ${state.descendingOrder ? styles.descending : ''}`}>
                      ▲
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Ranking data={state.data} columns={columns} onSubsetChanged={onRowSelected} selectedRowId={state.selectedRowId} />
          </div>

          <Chart description={`Details for ${state.subsetDescription}`} subset={state.listeningHistorySubset} compact={true} />
        </>
      )}
    </div>
  );
}

export default Table;