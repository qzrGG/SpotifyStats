# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpotifyStats is a React application that visualizes Spotify listening history. Users upload their Spotify data files (obtained from https://www.spotify.com/account/privacy/) and the app generates statistics, charts, and rankings.

## Package Manager

This project uses **yarn** as the package manager. Always use `yarn` commands instead of `npm`.

## Commands

### Development
- `yarn start` - Start development server
- `yarn build` - Build production bundle
- `yarn test` - Run tests

## Architecture

### Data Flow

1. **File Upload** (`Stats.tsx`): Users drop Spotify JSON files via react-dropzone
2. **File Detection**: App accepts two file formats:
   - Standard: `StreamingHistory*.json` files
   - Extended: `Streaming_History_Audio*.json` files (new extended format from Spotify)
3. **Data Transformation**: Files are parsed and normalized to a unified `ListeningEntry` format
4. **Context Distribution**: Data is provided via `StatsContext` to all child components
5. **Visualization**: Components consume the context and render stats/charts

### Key Data Models

**`ListeningEntry`** (src/models/listeningEntry.ts) - Unified format for all data:
```typescript
{
  endTime: string;      // "YYYY-MM-DD HH:mm"
  date: Date;
  artistName: string;
  trackName: string;
  msPlayed: number;
}
```

**`ExtendedListeningEntry`** - Raw format from Spotify's extended history files with additional metadata (platform, country, IP, shuffle state, etc.). Gets normalized to `ListeningEntry`.

**`StatRow`** - Aggregated statistics for table display (play counts, listening time per track/artist)

### Component Architecture

**Stats.tsx** - Entry point component:
- Handles file upload and parsing
- Detects file format (standard vs extended) by checking for `ts`, `ms_played`, and `master_metadata_track_name` fields
- Normalizes extended format entries (filters out podcasts/audiobooks that lack track metadata)
- Parses standard format and adjusts date format
- Deduplicates entries and provides data via StatsContext

**StatsContext** - React Context providing:
- `listeningHistory`: Array of all listening entries
- `since`/`to`: Date range of data

**Consumer Components**:
- `Summary.tsx` - Overall stats (total time, play count, date range)
- `Table.tsx` - Sortable/searchable rankings with track/artist grouping
- `Chart.tsx` - Recharts line chart showing listening over time
- `Attachment.tsx` - Music variety analysis with top-X percentage calculations
- `OtherUnits.tsx` - Additional statistics

### Data Processing Patterns

The app heavily uses `linq-to-typescript` for data transformation:
```typescript
from(entries)
  .groupBy(x => x.artistName)
  .select(x => x.count())
  .orderByDescending(x => x, Comparer)
```

**Comparer** (src/models/Comparer.ts) - Custom numeric comparator for sorting

### File Format Support

**Standard Format** (`StreamingHistory*.json`):
```json
{
  "endTime": "2024-11-06 00:08",
  "artistName": "Flume",
  "trackName": "Drop The Game",
  "msPlayed": 219767
}
```

**Extended Format** (`Streaming_History_Audio*.json`):
```json
{
  "ts": "2017-01-10T01:22:29Z",
  "ms_played": 1761,
  "master_metadata_track_name": "Buraki",
  "master_metadata_album_artist_name": "Kabanos",
  // ... additional fields (platform, country, shuffle, etc.)
}
```

The extended format includes entries for podcasts and audiobooks (where `master_metadata_track_name` or `master_metadata_album_artist_name` are null). These are filtered out during normalization since the app focuses on music statistics.

## Deployment

The app is deployed to GitHub Pages at https://qzrgg.github.io/SpotifyStats/ (configured via `homepage` in package.json).
