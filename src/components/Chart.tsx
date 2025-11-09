import { useContext, useState, useMemo } from "react";
import React from "react";
import { LineChart, BarChart, AreaChart, CartesianGrid, XAxis, YAxis, Line, Bar, Area, Tooltip, ResponsiveContainer } from "recharts";
import { from, range } from "linq-to-typescript";
import Comparer from "../models/Comparer";
import { minutes, round } from "../common/math.helper";
import StatsContext from "./StatsContext";
import { ListeningEntry } from "../models/listeningEntry";
import { useStatsCache } from "../hooks/useStatsCache";
import styles from './Chart.module.css';

export interface ChartProps {
  description: string;
  subset?: ListeningEntry[];
  compact?: boolean;
}

interface ChartState {
  chartFuncId: number;
  metricType: 'time' | 'playbacks';
}

const Chart: React.FC<ChartProps> = (props) => {
  const [state, setState] = useState<ChartState>({ chartFuncId: 0, metricType: 'time' });
  const context = useContext(StatsContext);
  const isCompact = props.compact || false;

  // Calculate if data span is more than 1 year
  const dataSpanDays = Math.ceil((context.to.getTime() - context.since.getTime()) / (1000 * 60 * 60 * 24));
  const showYearButton = dataSpanDays > 365;

  // Helper functions - must be defined before chartFuncs
  const monthValue = (date: Date): number => date.getFullYear() * 100 + date.getMonth() + 1;

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getQuarterValue = (date: Date): number => {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return date.getFullYear() * 10 + quarter;
  };

  const chartFuncs: ((x: Date) => number)[] = [
    x => x.getHours(),                                      // 0: Hours
    x => x.getDay() === 0 || x.getDay() === 6 ? 1 : 0,    // 1: Weekdays/Weekends
    x => x.getDay() === 0 ? 7 : x.getDay(),                // 2: Days of week
    x => getWeekNumber(x),                                  // 3: Weeks
    x => monthValue(x),                                     // 4: Months
    x => getQuarterValue(x),                                // 5: Quarters
    x => x.getFullYear()                                    // 6: Years
  ];

  const daysOfWeek: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const xAxisFuncs: ((x: { name: number }) => string)[] = [
    x => x.name.toString().padStart(2, '0'),                                      // Hours: "00"-"23"
    x => x.name === 0 ? "Weekdays" : "Weekends",                                  // Weekdays/Weekends
    x => daysOfWeek[x.name],                                                      // Days: "Mon", "Tue"...
    x => `W${x.name}`,                                                            // Weeks: "W1", "W2"...
    x => {                                                                        // Months: "Jan '25"
      const month = x.name % 100;
      const year = Math.floor(x.name / 100);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[month - 1]} '${(year % 100).toString().padStart(2, '0')}`;
    },
    x => {                                                                        // Quarters: "Q1 '25"
      const quarter = x.name % 10;
      const year = Math.floor(x.name / 10);
      return `Q${quarter} '${(year % 100).toString().padStart(2, '0')}`;
    },
    x => x.name.toString()                                                        // Years: "2025"
  ];

  const monthDiff = (d1: Date, d2: Date) => {
    let months = 0;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
  }

  const weekDiff = (d1: Date, d2: Date) => {
    const diff = d2.getTime() - d1.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  }

  const quarterDiff = (d1: Date, d2: Date) => {
    const yearDiff = d2.getFullYear() - d1.getFullYear();
    const quarterDiff = Math.floor(d2.getMonth() / 3) - Math.floor(d1.getMonth() / 3);
    return yearDiff * 4 + quarterDiff;
  }

  const yearDiff = (d1: Date, d2: Date) => {
    return d2.getFullYear() - d1.getFullYear() + 1;
  }

  const nthMonth = (n: number): number => {
    const firstDate = new Date(context.since);
    const nthDate = new Date(firstDate.setMonth(firstDate.getMonth() + n));
    return monthValue(nthDate);
  }

  const nthWeek = (n: number): number => {
    const firstDate = new Date(context.since);
    const nthDate = new Date(firstDate.getTime() + n * 7 * 24 * 60 * 60 * 1000);
    return getWeekNumber(nthDate);
  }

  const nthQuarter = (n: number): number => {
    const firstDate = new Date(context.since);
    const firstQuarter = Math.floor(firstDate.getMonth() / 3);
    const firstYear = firstDate.getFullYear();
    const totalQuarters = firstYear * 4 + firstQuarter + n;
    return Math.floor(totalQuarters / 4) * 10 + (totalQuarters % 4) + 1;
  }

  const nthYear = (n: number): number => {
    return context.since.getFullYear() + n;
  }

  const emptyData = useMemo(() => [
    range(0, 24).select(x => ({ name: x, totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" })).toArray(),                                    // Hours
    [{ name: 0, totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" }, { name: 1, totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" }],  // Weekdays/Weekends
    range(1, 7).select(x => ({ name: x, totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" })).toArray(),                                    // Days
    range(0, weekDiff(context.since, context.to)).select(x => ({ name: nthWeek(x), totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" })).toArray(),  // Weeks
    range(0, monthDiff(context.since, context.to)).select(x => ({ name: nthMonth(x), totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" })).toArray(),  // Months
    range(0, quarterDiff(context.since, context.to) + 1).select(x => ({ name: nthQuarter(x), totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" })).toArray(),  // Quarters
    range(0, yearDiff(context.since, context.to)).select(x => ({ name: nthYear(x), totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: "" })).toArray()  // Years
  ], [context.since, context.to]);


  const dataToUse = props.subset !== undefined ? props.subset : context.listeningHistory;
  const chartData = useStatsCache((entries) => {
    return from(entries)
      .groupBy(x => chartFuncs[state.chartFuncId](x.date))
      .select(g => ({
        name: g.key,
        totalTime: round(g.sum(x => x.msPlayed) / 60000, 2),
        totalPlaybacks: g.count(),
        mostPlayedTrack: g.groupBy(x => x.trackName).orderByDescending(x => x.count(), Comparer).first().take(1).select(x => `${x.trackName} by ${x.artistName}`).first(),
        mostPlayedArtist: g.groupBy(x => x.artistName).orderByDescending(x => x.count(), Comparer).first().key
      }))
      .union(emptyData[state.chartFuncId])
      .groupBy(x => x.name)
      .select(x => x.first())
      .toArray();
  }, dataToUse, context.since, context.to, [state.chartFuncId, emptyData[state.chartFuncId]]);

  if (props.subset !== undefined && props.subset.length === 0) {
    return (
      <div className={isCompact ? styles.chartContainerCompact : styles.chartContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>Select a track or an artist in the table to see its details</div>
        </div>
      </div>
    );
  }

  const periods = [
    { id: 0, label: 'Hours' },
    { id: 2, label: 'Days of week' },
    { id: 4, label: 'Months' },
    { id: 5, label: 'Quarters' }
  ];

  if (showYearButton) {
    periods.push({ id: 6, label: 'Years' });
  }

  // Filter periods for compact mode
  const displayPeriods = isCompact
    ? [periods[0], periods[1], periods[2]] // Hours, Days of week, Months only
    : periods;

  const chartHeight = isCompact ? 300 : 400;
  const dataKey = state.metricType === 'time' ? 'totalTime' : 'totalPlaybacks';
  const yAxisLabel = state.metricType === 'time' ? 'Minutes' : 'Playbacks';

  return (
    <div className={isCompact ? styles.chartContainerCompact : styles.chartContainer}>
      <div className={`${styles.header} ${isCompact ? styles.headerCompact : ''}`}>
        <div className={isCompact ? styles.titleCompact : styles.title}>
          {props.description}
        </div>

        <div className={`${styles.controls} ${isCompact ? styles.controlsCompact : ''}`}>
          {!isCompact && (
            <div className={styles.metricToggle}>
              <button
                className={`${styles.metricButton} ${state.metricType === 'time' ? styles.active : ''} ${isCompact ? styles.metricButtonCompact : ''}`}
                onClick={() => setState({ ...state, metricType: 'time' })}
              >
                Listening Time
              </button>
              <button
                className={`${styles.metricButton} ${state.metricType === 'playbacks' ? styles.active : ''} ${isCompact ? styles.metricButtonCompact : ''}`}
                onClick={() => setState({ ...state, metricType: 'playbacks' })}
              >
                Playback Count
              </button>
            </div>
          )}

          <div className={styles.periodSelector}>
            {displayPeriods.map(period => (
              <button
                key={period.id}
                className={`${styles.periodButton} ${state.chartFuncId === period.id ? styles.active : ''} ${isCompact ? styles.periodButtonCompact : ''}`}
                onClick={() => setState({ ...state, chartFuncId: period.id })}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${styles.chartWrapper} ${isCompact ? styles.chartWrapperCompact : ''}`}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="5 5" stroke="rgba(0, 0, 0, 0.1)" />
            <XAxis
              dataKey={xAxisFuncs[state.chartFuncId]}
              stroke="#666"
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <YAxis
              stroke="#666"
              tick={{ fill: '#666', fontSize: 12 }}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#666', fontSize: 12 } }}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} metricType={state.metricType} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#00d76f"
              strokeWidth={3}
              dot={{ fill: '#00d76f', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricType: 'time' | 'playbacks';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, metricType }) => {
  if (!active || !payload || !payload[0] || payload[0].payload.totalTime === 0) {
    return null;
  }

  const data = payload[0].payload;
  const totalTime = data.totalTime;
  const totalPlaybacks = data.totalPlaybacks;
  const avgTimePerPlay = totalTime / totalPlaybacks;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>

      <div className={styles.tooltipContent}>
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipRowLabel}>Listening time:</span>
          <span className={styles.tooltipRowValue}>{minutes(totalTime)}</span>
        </div>

        <div className={styles.tooltipRow}>
          <span className={styles.tooltipRowLabel}>Playback count:</span>
          <span className={styles.tooltipRowValue}>{totalPlaybacks.toLocaleString()}</span>
        </div>

        <div className={styles.tooltipRow}>
          <span className={styles.tooltipRowLabel}>Avg per play:</span>
          <span className={styles.tooltipRowValue}>{minutes(avgTimePerPlay)}</span>
        </div>
      </div>

      {data.mostPlayedTrack && (
        <div className={styles.tooltipHighlight}>
          <div className={styles.tooltipHighlightText}>
            <strong>Top track:</strong> {data.mostPlayedTrack}
          </div>
          {data.mostPlayedArtist && (
            <div className={styles.tooltipHighlightText}>
              <strong>Top artist:</strong> {data.mostPlayedArtist}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chart;