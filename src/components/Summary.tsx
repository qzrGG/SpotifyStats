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
      <span className="section-header mb-3">Summary</span>

      <p className="text-center" style={{fontSize: "large"}}>
        In the last year you've listened to <br />
        <span className="display-4">{summary.totalPlayCount} tracks</span>  <br />
        for a total of <br /><span className="display-4">{summary.totalListeningTimeMinutes} minutes</span>  <br />
        or <span className="display-4"> {summary.totalListeningTimeSummary}</span>.
      </p>
    </React.Fragment >
  );
}

export default Summary;