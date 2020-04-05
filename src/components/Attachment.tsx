import React from "react";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip } from "recharts";
import Comparer from "../models/Comparer";

const Attachment: React.FC<{ listeningHistory: ListeningEntry[] }> = (props) => {
  const data = from(props.listeningHistory);

  const totalPlayCount = data.count();

  const differentTracks = data.select(x => x.artistName + x.trackName).distinct().count();
  const differentArtists = data.select(x => x.artistName).distinct().count();

  const topTracksPlayCount = data.groupBy(x => x.trackName + x.artistName)
    .select(x => x.count())
    .orderByDescending(x => x, Comparer)
    .aggregate({ result: Array.from([0]), i: 0 }, (x, y) => {
      if (x.i * 100 >= x.result.length * differentTracks)
        x.result.push(y + x.result[x.result.length - 1]);
      else
        x.result[x.result.length - 1] += y;
      x.i++;
      return x;
    }).result;

  let topArtistsPlayCount = data.groupBy(x => x.artistName)
    .select(x => x.count())
    .orderByDescending(x => x, Comparer)
    .aggregate({ result: Array.from([0]), i: 0 }, (x, y) => {
      if (x.i * 100 >= x.result.length * differentArtists)
        x.result.push(y + x.result[x.result.length - 1]);
      else
        x.result[x.result.length - 1] += y;
      x.i++;
      return x;
    }).result;
    topArtistsPlayCount = [0, ...topArtistsPlayCount];
  const chartData = [0, ...topTracksPlayCount].map((x, i) => ({ top: i, Tracks: Math.round(x / totalPlayCount * 10000) / 100, Artists: Math.round(topArtistsPlayCount[i] / totalPlayCount * 10000) / 100}));



  return (
    <React.Fragment>
      <span className="section-header mb-4">Attachment</span>

      <p className="text-center" style={{ fontSize: "large" }}>
        There are <span className="display-4">{differentArtists}</span> different artists
        and <span className="display-4">{differentTracks}</span> different tracks in your streaming history.
        How many percents of all streams are your favourites responsible for?
      </p>
      <ResponsiveContainer width="100%" height="50%">
        <LineChart
          data={chartData}
        >
          <CartesianGrid strokeDasharray="5 5" />
          <XAxis dataKey="top" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="Tracks" stroke="#00d76f" strokeWidth={5}  dot={false} />
          <Line type="monotone" dataKey="Artists" stroke="#666666" strokeWidth={5}  dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </React.Fragment >
  );
}

export default Attachment;