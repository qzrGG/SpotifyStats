import { Component } from "react";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip } from "recharts";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";

export interface ChartProps {
  listeningHistory: ListeningEntry[];
}

interface ChartState {
  chartFuncId: number;
}

export class Chart extends Component<ChartProps, ChartState> {
  chartFuncs = [(x: Date) => x.getHours(), (x: Date) => x.getDay() + 1, (x: Date) => x.getMonth() + 1]

  constructor(props: Readonly<ChartProps>) {
    super(props);
    this.state = { chartFuncId: 0 };
  }

  chartData = () => from(this.props.listeningHistory)
    .groupBy(x => this.chartFuncs[this.state.chartFuncId](new Date(x.endTime)))
    .select(g => {
      return {
        name: g.key,
        totalTime: Math.round(g.sum(x => x.msPlayed) / 60000),
        totalPlaybacks: g.count(),
        mostPlayedTrack: g.groupBy(x => x.trackName).orderByDescending(x => x.count()).first().key,
        mostPlayedArtist: g.groupBy(x => x.artistName).orderByDescending(x => x.count()).first().key,
      };
    })
    .toArray();

  render() {
    return (
      <React.Fragment>
        <ButtonGroup className="d-flex">
          <Button active={this.state.chartFuncId === 0} color="primary" onClick={() => this.setState({ ...this.state, chartFuncId: 0 })} >Hours</Button>
          <Button active={this.state.chartFuncId === 1} color="primary" onClick={() => this.setState({ ...this.state, chartFuncId: 1 })}>Days of week</Button>
          <Button active={this.state.chartFuncId === 2} color="primary" onClick={() => this.setState({ ...this.state, chartFuncId: 2 })}>Months</Button>
        </ButtonGroup>

        <LineChart
          width={1100}
          height={500}
          data={this.chartData()}
          margin={{
            top: 25, right: 20, left: 20, bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="5 5" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={CustomTooltip} />
          <Line type="monotone" dataKey="totalTime" stroke="#8884d8" />
        </LineChart>
      </React.Fragment >);
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`Total listening time: ${payload[0].payload.totalTime} minutes`}</p>
        <p className="desc">Total tracks played: {payload[0].payload.totalPlaybacks}<br />
          Favourite track: {payload[0].payload.mostPlayedTrack}<br />
          Favourite artist: {payload[0].payload.mostPlayedArtist}<br />
        </p>
      </div>
    );
  }

  return null;
};
