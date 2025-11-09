import React, { useContext } from "react";
import { from } from "linq-to-typescript";
import Comparer from "../models/Comparer";
import StatsContext from "./StatsContext";
import { useStatsCache } from "../hooks/useStatsCache";
import TimePeriodSelector from "./TimePeriodSelector";
import CountUp from 'react-countup';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faClock, faHeadphones, faCompactDisc } from "@fortawesome/free-solid-svg-icons";
import styles from './Summary.module.css';

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  decimals?: number;
  duration?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, suffix = "", subtext, decimals = 0, duration = 2 }) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.iconWrapper}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>
        <CountUp
          end={value}
          duration={duration}
          separator=","
          decimals={decimals}
          suffix={suffix}
        />
      </div>
      {subtext && <div className={styles.statSubtext}>{subtext}</div>}
    </div>
  );
};

const Summary: React.FC = () => {
  const context = useContext(StatsContext);

  const summary = useStatsCache((entries) => {
    const data = from(entries);

    const totalListeningTime = Math.round(data.sum(x => x.msPlayed) / 60000);
    const totalPlayCount = data.count();

    const differentTracks = data.select(x => x.artistName + x.trackName).distinct().count();
    const differentArtists = data.select(x => x.artistName).distinct().count();

    const top10TracksPlayCount = data.groupBy(x => x.trackName + x.artistName)
      .select(x => x.count())
      .orderByDescending(x => x, Comparer)
      .take(Math.round(differentTracks / 10))
      .sum();

    const top10ArtistsPlayCount = data.groupBy(x => x.artistName)
      .select(x => x.count())
      .orderByDescending(x => x)
      .take(Math.round(differentArtists / 10))
      .sum();

    // Get top track and artist
    const topTrack = data.groupBy(x => x.trackName + " - " + x.artistName)
      .select(group => ({ name: group.key, count: group.count() }))
      .orderByDescending(x => x.count, Comparer)
      .firstOrDefault();

    const topArtist = data.groupBy(x => x.artistName)
      .select(group => ({ name: group.key, count: group.count() }))
      .orderByDescending(x => x.count, Comparer)
      .firstOrDefault();

    // Calculate additional insights
    const daysBetween = Math.ceil((context.to.getTime() - context.since.getTime()) / (1000 * 60 * 60 * 24));
    const averageTracksPerDay = Math.round(totalPlayCount / daysBetween);
    const averageMinutesPerDay = Math.round(totalListeningTime / daysBetween);
    const daysInPeriod = daysBetween;
    const percentOfDayListening = ((totalListeningTime / (daysBetween * 1440)) * 100).toFixed(1);

    return {
      totalListeningTimeMinutes: totalListeningTime,
      totalListeningTimeHours: Math.round(totalListeningTime / 60),
      totalListeningTimeDays: Math.floor(totalListeningTime / 1440),
      remainingHours: Math.floor(totalListeningTime / 60 % 24),
      remainingMinutes: Math.floor(totalListeningTime % 60),
      totalListeningTimeSummary: `${Math.floor(totalListeningTime / 1440)} days, ${Math.floor(totalListeningTime / 60 % 24)} hours and ${Math.floor(totalListeningTime % 60)} minutes`,
      totalPlayCount: totalPlayCount,
      differentTracks: differentTracks,
      differentArtists: differentArtists,
      top10tracksShare: top10TracksPlayCount / totalPlayCount,
      top10artistsShare: top10ArtistsPlayCount / totalPlayCount,
      averageTracksPerDay,
      averageMinutesPerDay,
      daysInPeriod,
      percentOfDayListening: parseFloat(percentOfDayListening),
      topTrack: topTrack?.name || "N/A",
      topTrackCount: topTrack?.count || 0,
      topArtist: topArtist?.name || "N/A",
      topArtistCount: topArtist?.count || 0,
    };
  }, context.listeningHistory, context.since, context.to);

  return (
    <React.Fragment>
      <span className="section-header mb-3">Summary</span>

      <TimePeriodSelector />

      <div className={styles.summaryContainer}>
        <div className={styles.intro}>
          Your listening journey from {context.since.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} to {context.to.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            icon={faMusic}
            label="Total Tracks"
            value={summary.totalPlayCount}
            subtext="songs played"
            duration={2.5}
          />

          <StatCard
            icon={faClock}
            label="Total Time"
            value={summary.totalListeningTimeMinutes}
            subtext="minutes of music"
            duration={2.5}
          />

          <StatCard
            icon={faCompactDisc}
            label="Unique Tracks"
            value={summary.differentTracks}
            subtext="different songs"
            duration={2}
          />

          <StatCard
            icon={faHeadphones}
            label="Unique Artists"
            value={summary.differentArtists}
            subtext="different artists"
            duration={2}
          />
        </div>

        <div className={styles.insightsSection}>
          <div className={styles.insightsTitle}>📊 Daily Insights</div>

          <div className={styles.insightsGrid}>
            <div className={styles.insightItem}>
              <div className={styles.insightValue}>
                <CountUp end={summary.averageTracksPerDay} duration={2} separator="," />
              </div>
              <div className={styles.insightLabel}>tracks per day</div>
            </div>

            <div className={styles.insightItem}>
              <div className={styles.insightValue}>
                <CountUp end={summary.averageMinutesPerDay} duration={2} separator="," />
              </div>
              <div className={styles.insightLabel}>minutes per day</div>
            </div>

            <div className={styles.insightItem}>
              <div className={styles.insightValue}>
                <CountUp end={summary.daysInPeriod} duration={2} separator="," />
              </div>
              <div className={styles.insightLabel}>days in period</div>
            </div>

            <div className={styles.insightItem}>
              <div className={styles.insightValue}>
                <CountUp end={summary.percentOfDayListening} duration={2} decimals={1} suffix="%" />
              </div>
              <div className={styles.insightLabel}>of each day listening</div>
            </div>
          </div>
        </div>

        <div className={styles.topItemsSection}>
          <div className={styles.topItem}>
            <div className={styles.topItemIcon}>🎵</div>
            <div className={styles.topItemContent}>
              <div className={styles.topItemLabel}>Top Track</div>
              <div className={styles.topItemName}>{summary.topTrack}</div>
              <div className={styles.topItemCount}>
                <CountUp end={summary.topTrackCount} duration={2} separator="," /> plays
              </div>
            </div>
          </div>

          <div className={styles.topItem}>
            <div className={styles.topItemIcon}>🎤</div>
            <div className={styles.topItemContent}>
              <div className={styles.topItemLabel}>Top Artist</div>
              <div className={styles.topItemName}>{summary.topArtist}</div>
              <div className={styles.topItemCount}>
                <CountUp end={summary.topArtistCount} duration={2} separator="," /> plays
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dateRange}>
          <div className={styles.dateRangeText}>
            That's <span className={styles.dateRangeValue}>{summary.totalListeningTimeDays} days, {summary.remainingHours} hours, and {summary.remainingMinutes} minutes</span> of pure music!
          </div>
        </div>
      </div>
    </React.Fragment >
  );
}

export default Summary;