import React, { useContext } from "react";
import { from } from "linq-to-typescript";
import { round } from "../common/math.helper";
import StatsContext from "./StatsContext";

const OtherUnits: React.FC = () => {
  const context = useContext(StatsContext);
  const data = from(context.listeningHistory);

  const totalListeningTime = data.sum(x => x.msPlayed) / 60000;

  return (
    <div style={{fontSize: "x-large", fontWeight: 300}}>
      <span className="section-header mb-4">In other words...</span>
      <p>{round(totalListeningTime, 0)} minutes is a lot. In this time</p>
      <ul>
        <li>you can listen {round(totalListeningTime / 47, 1)} times to The Beatles's <i>Abbey Road</i> album</li>
        <li>you can watch <i>The Lord of the Rings</i> trilogy {round(totalListeningTime / 725, 1)} times</li>
        <li>light travels {round(totalListeningTime * 17987547.48, 0)} kilometers</li>
        <li>on average {round(totalListeningTime * 250, 0)} babies are born</li>
      </ul>
      <p>If you have a healthy 8 hours of sleep a day you've spent {round(totalListeningTime / 3504, 2)}% of last year's awake time listening to music.</p>
    </div>
  );
}

export default OtherUnits;