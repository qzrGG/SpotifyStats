import React from "react";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";
import Comparer from "../models/Comparer";

const Summary: React.FC<{ listeningHistory: ListeningEntry[] }> = (props) => {
  const data = from(props.listeningHistory);

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

  const summary = {
    totalListeningTimeMinutes: totalListeningTime,
    totalListeningTimeSummary: `${Math.floor(totalListeningTime / 1440)} days, ${Math.floor(totalListeningTime / 60 % 24)} hours and ${Math.floor(totalListeningTime % 60)} minutes`,
    totalPlayCount: totalPlayCount,
    differentTracks: differentTracks,
    differentArtists: differentArtists,
    top10tracksShare: top10TracksPlayCount / totalPlayCount,
    top10artistsShare: top10ArtistsPlayCount / totalPlayCount
  };

  return (
    <React.Fragment>
      <p className="text-center" style={{ fontSize: "x-large", marginBottom: 100 }}>
        In the last year you've listened to <br />
        <span className="display-2">{summary.totalPlayCount} tracks</span>  <br />
        for a total of <br /><span className="display-2">{summary.totalListeningTimeMinutes} minutes</span>  <br />
        or <span className="display-3"> {summary.totalListeningTimeSummary}</span>. <br />
        <br />
        There are <span className="display-4">{summary.differentTracks}</span> different tracks<br />
        and <span className="display-4">{summary.differentArtists}</span> different artists in your streaming history. <br />
        <br />
        Your top 10% artists and tracks are responsible respectively for <span className="display-3">{Math.round(summary.top10artistsShare * 1000) / 10}% </span> <br />
        and <span className="display-3">{Math.round(summary.top10tracksShare * 1000) / 10}% </span> of all your streams.
      </p>
    </React.Fragment >
  );
}

export default Summary;