import React, { useContext, useState } from "react";
import { from } from "linq-to-typescript";
import { round } from "../common/math.helper";
import StatsContext from "./StatsContext";
import { useStatsCache } from "../hooks/useStatsCache";
import CountUp from 'react-countup';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import styles from './OtherUnits.module.css';

enum ComparisonCategory {
  RealWorld = 'Real-world Activities',
  Time = 'Time Equivalents',
  Distance = 'Physical Distances',
  Culture = 'Cultural References'
}

enum DistanceUnit {
  Metric = 'metric',
  Imperial = 'imperial'
}

interface ComparisonData {
  icon: string;
  value: number;
  label: string;
  subtext: string;
  tooltip: string;
  decimals: number;
  suffix?: string;
}

interface ComparisonCardProps {
  icon: string;
  value: number;
  label: string;
  subtext?: string;
  tooltip: string;
  decimals?: number;
  duration?: number;
  suffix?: string;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({
  icon,
  value,
  label,
  subtext,
  tooltip,
  decimals = 1,
  duration = 2,
  suffix = ""
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={styles.comparisonCard}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div style={{ position: 'relative' }}>
          <FontAwesomeIcon
            icon={faQuestionCircle}
            className={styles.tooltipIcon}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
          {showTooltip && <div className={styles.tooltip}>{tooltip}</div>}
        </div>
      </div>
      <div className={styles.comparisonValue}>
        <CountUp
          end={value}
          duration={duration}
          separator=","
          decimals={decimals}
          suffix={suffix}
        />
      </div>
      <div className={styles.comparisonLabel}>{label}</div>
      {subtext && <div className={styles.comparisonSubtext}>{subtext}</div>}
    </div>
  );
};

const OtherUnits: React.FC = () => {
  const context = useContext(StatsContext);
  const [activeCategory, setActiveCategory] = useState<ComparisonCategory>(ComparisonCategory.RealWorld);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(DistanceUnit.Metric);

  const stats = useStatsCache((entries) => {
    const data = from(entries);
    const totalMinutes = data.sum(x => x.msPlayed) / 60000;
    const totalHours = totalMinutes / 60;
    const totalDays = totalHours / 24;

    return { totalMinutes, totalHours, totalDays };
  }, context.listeningHistory, context.since, context.to);

  // Calculate days in period
  const daysBetween = Math.ceil((context.to.getTime() - context.since.getTime()) / (1000 * 60 * 60 * 24));
  const awakeMinutesInPeriod = daysBetween * 16 * 60; // 16 hours awake per day

  // Real-world Activities comparisons
  const realWorldComparisons: ComparisonData[] = [
    {
      icon: '👶',
      value: round(stats.totalMinutes * 250, 0),
      label: 'babies born worldwide',
      subtext: 'on average',
      tooltip: 'Global birth rate: ~250 babies/minute',
      decimals: 0
    },
    {
      icon: '💓',
      value: round(stats.totalMinutes * 75, 0),
      label: 'heartbeats',
      subtext: 'at average resting heart rate',
      tooltip: 'Average resting heart rate: 75 bpm',
      decimals: 0
    },
    {
      icon: '🫁',
      value: round(stats.totalMinutes * 16, 0),
      label: 'breaths taken',
      subtext: 'at average breathing rate',
      tooltip: 'Average breathing rate: 16 breaths/minute',
      decimals: 0
    },
    {
      icon: '☕',
      value: round(stats.totalMinutes / 15, 1),
      label: 'cups of coffee consumed',
      subtext: 'if drinking at average pace',
      tooltip: '~15 minutes per coffee cup',
      decimals: 1
    },
    {
      icon: '🚶',
      value: round(stats.totalMinutes * 100, 0),
      label: 'steps while walking',
      subtext: 'at average walking pace',
      tooltip: 'Average walking pace: 100 steps/minute',
      decimals: 0
    },
    {
      icon: '🔋',
      value: round(stats.totalMinutes * 0.1, 1),
      label: 'calories burned',
      subtext: 'while sitting and listening',
      tooltip: 'Sedentary activity: ~0.1 cal/minute',
      decimals: 1
    }
  ];

  // Time Equivalents comparisons
  const timeComparisons: ComparisonData[] = [
    {
      icon: '📅',
      value: round(stats.totalDays, 1),
      label: 'days of continuous music',
      subtext: 'non-stop playback',
      tooltip: `${round(stats.totalMinutes, 0)} minutes ÷ 1,440 minutes/day`,
      decimals: 1
    },
    {
      icon: '📆',
      value: round(stats.totalDays / 7, 2),
      label: 'weeks of continuous music',
      subtext: 'playing 24/7',
      tooltip: `${round(stats.totalDays, 1)} days ÷ 7 days/week`,
      decimals: 2
    },
    {
      icon: '⏰',
      value: round((stats.totalMinutes / awakeMinutesInPeriod) * 100, 2),
      label: 'of your awake time',
      subtext: 'in this period',
      tooltip: `Assuming 16 hours awake/day over ${daysBetween} days`,
      decimals: 2,
      suffix: '%'
    },
    {
      icon: '🌅',
      value: round((stats.totalMinutes / (daysBetween * 1440)) * 100, 2),
      label: 'of each day listening',
      subtext: 'including sleep',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ ${daysBetween * 1440} min total`,
      decimals: 2,
      suffix: '%'
    },
    {
      icon: '⏱️',
      value: round(stats.totalMinutes / daysBetween, 1),
      label: 'minutes per day',
      subtext: 'average listening time',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ ${daysBetween} days`,
      decimals: 1
    },
    {
      icon: '🕐',
      value: round(stats.totalHours / daysBetween, 2),
      label: 'hours per day',
      subtext: 'average listening time',
      tooltip: `${round(stats.totalHours, 1)} hours ÷ ${daysBetween} days`,
      decimals: 2
    }
  ];

  // Physical Distances comparisons
  const lightDistanceKm = round(stats.totalMinutes * 17987547.48, 0);
  const lightDistanceMiles = round(lightDistanceKm * 0.621371, 0);
  const walkingDistanceKm = round(stats.totalMinutes * 0.08, 1); // ~5 km/h
  const walkingDistanceMiles = round(walkingDistanceKm * 0.621371, 1);
  const drivingDistanceKm = round(stats.totalMinutes * 1, 0); // 60 km/h
  const drivingDistanceMiles = round(drivingDistanceKm * 0.621371, 0);
  const flyingDistanceKm = round(stats.totalMinutes * 13.33, 0); // 800 km/h
  const flyingDistanceMiles = round(flyingDistanceKm * 0.621371, 0);
  const earthCircumKm = 40075;
  const earthCircumMiles = 24901;

  const distanceComparisons: ComparisonData[] = distanceUnit === DistanceUnit.Metric ? [
    {
      icon: '💡',
      value: lightDistanceKm,
      label: 'kilometers light travels',
      subtext: 'at 299,792 km/s',
      tooltip: `Light speed × ${round(stats.totalMinutes, 0)} minutes`,
      decimals: 0
    },
    {
      icon: '🌍',
      value: round(lightDistanceKm / earthCircumKm, 1),
      label: 'times around Earth',
      subtext: 'if light traveled along equator',
      tooltip: `${lightDistanceKm.toLocaleString()} km ÷ 40,075 km`,
      decimals: 1
    },
    {
      icon: '🚶‍♂️',
      value: walkingDistanceKm,
      label: 'kilometers walked',
      subtext: 'at 5 km/h pace',
      tooltip: `5 km/h × ${round(stats.totalHours, 1)} hours`,
      decimals: 1
    },
    {
      icon: '🚗',
      value: drivingDistanceKm,
      label: 'kilometers driven',
      subtext: 'at 60 km/h',
      tooltip: `60 km/h × ${round(stats.totalHours, 1)} hours`,
      decimals: 0
    },
    {
      icon: '✈️',
      value: flyingDistanceKm,
      label: 'kilometers flown',
      subtext: 'at cruising speed (800 km/h)',
      tooltip: `800 km/h × ${round(stats.totalHours, 1)} hours`,
      decimals: 0
    },
    {
      icon: '🗺️',
      value: round(walkingDistanceKm / earthCircumKm * 100, 3),
      label: 'of Earth\'s circumference',
      subtext: 'if you walked instead',
      tooltip: `${walkingDistanceKm} km ÷ 40,075 km × 100%`,
      decimals: 3,
      suffix: '%'
    }
  ] : [
    {
      icon: '💡',
      value: lightDistanceMiles,
      label: 'miles light travels',
      subtext: 'at 186,282 mi/s',
      tooltip: `Light speed × ${round(stats.totalMinutes, 0)} minutes`,
      decimals: 0
    },
    {
      icon: '🌍',
      value: round(lightDistanceMiles / earthCircumMiles, 1),
      label: 'times around Earth',
      subtext: 'if light traveled along equator',
      tooltip: `${lightDistanceMiles.toLocaleString()} mi ÷ 24,901 mi`,
      decimals: 1
    },
    {
      icon: '🚶‍♂️',
      value: walkingDistanceMiles,
      label: 'miles walked',
      subtext: 'at 3 mph pace',
      tooltip: `3 mph × ${round(stats.totalHours, 1)} hours`,
      decimals: 1
    },
    {
      icon: '🚗',
      value: drivingDistanceMiles,
      label: 'miles driven',
      subtext: 'at 37 mph',
      tooltip: `37 mph × ${round(stats.totalHours, 1)} hours`,
      decimals: 0
    },
    {
      icon: '✈️',
      value: flyingDistanceMiles,
      label: 'miles flown',
      subtext: 'at cruising speed (497 mph)',
      tooltip: `497 mph × ${round(stats.totalHours, 1)} hours`,
      decimals: 0
    },
    {
      icon: '🗺️',
      value: round(walkingDistanceMiles / earthCircumMiles * 100, 3),
      label: 'of Earth\'s circumference',
      subtext: 'if you walked instead',
      tooltip: `${walkingDistanceMiles} mi ÷ 24,901 mi × 100%`,
      decimals: 3,
      suffix: '%'
    }
  ];

  // Cultural References comparisons
  const cultureComparisons: ComparisonData[] = [
    {
      icon: '🎵',
      value: round(stats.totalMinutes / 47, 1),
      label: 'times listening to Abbey Road',
      subtext: 'The Beatles (47 minutes)',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ 47 min/album`,
      decimals: 1
    },
    {
      icon: '🌙',
      value: round(stats.totalMinutes / 42.5, 1),
      label: 'times listening to Dark Side of the Moon',
      subtext: 'Pink Floyd (42:30)',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ 42.5 min/album`,
      decimals: 1
    },
    {
      icon: '👑',
      value: round(stats.totalMinutes / 38.5, 1),
      label: 'times listening to Thriller',
      subtext: 'Michael Jackson (38:30)',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ 38.5 min/album`,
      decimals: 1
    },
    {
      icon: '🎬',
      value: round(stats.totalMinutes / 725, 1),
      label: 'Lord of the Rings marathons',
      subtext: 'extended trilogy (725 minutes)',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ 725 min/trilogy`,
      decimals: 1
    },
    {
      icon: '🦇',
      value: round(stats.totalMinutes / 152, 1),
      label: 'times watching The Dark Knight',
      subtext: 'Christopher Nolan (152 min)',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ 152 min/movie`,
      decimals: 1
    },
    {
      icon: '🎸',
      value: round(stats.totalMinutes / 33.5, 1),
      label: 'times listening to Nevermind',
      subtext: 'Nirvana (33:30)',
      tooltip: `${round(stats.totalMinutes, 0)} min ÷ 33.5 min/album`,
      decimals: 1
    }
  ];

  const getCategoryComparisons = (): ComparisonData[] => {
    switch (activeCategory) {
      case ComparisonCategory.RealWorld:
        return realWorldComparisons;
      case ComparisonCategory.Time:
        return timeComparisons;
      case ComparisonCategory.Distance:
        return distanceComparisons;
      case ComparisonCategory.Culture:
        return cultureComparisons;
      default:
        return realWorldComparisons;
    }
  };

  return (
    <React.Fragment>
      <span className="section-header mb-3">In Other Words...</span>

      <div className={styles.otherUnitsContainer}>
        <div className={styles.intro}>
          {round(stats.totalMinutes, 0).toLocaleString()} minutes is quite a lot! Here's what that means:
        </div>

        <div className={styles.categoryTabs}>
          {Object.values(ComparisonCategory).map((category) => (
            <button
              key={category}
              className={`${styles.categoryTab} ${activeCategory === category ? styles.active : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.comparisonGrid}>
          {getCategoryComparisons().map((comparison, index) => (
            <ComparisonCard
              key={index}
              icon={comparison.icon}
              value={comparison.value}
              label={comparison.label}
              subtext={comparison.subtext}
              tooltip={comparison.tooltip}
              decimals={comparison.decimals}
              suffix={comparison.suffix || ""}
            />
          ))}
        </div>

        {activeCategory === ComparisonCategory.Distance && (
          <div className={styles.controls}>
            <button
              className={`${styles.toggleButton} ${distanceUnit === DistanceUnit.Metric ? styles.active : ''}`}
              onClick={() => setDistanceUnit(DistanceUnit.Metric)}
            >
              🌍 Metric (km)
            </button>
            <button
              className={`${styles.toggleButton} ${distanceUnit === DistanceUnit.Imperial ? styles.active : ''}`}
              onClick={() => setDistanceUnit(DistanceUnit.Imperial)}
            >
              🦅 Imperial (mi)
            </button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

export default OtherUnits;