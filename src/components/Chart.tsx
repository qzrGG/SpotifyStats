import { Component } from "react";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip, ResponsiveContainer } from "recharts";
import { ListeningEntry } from "../models/listeningEntry";
import { from } from "linq-to-typescript";
import Comparer from "../models/Comparer";

export interface ChartProps {
  listeningHistory: ListeningEntry[];
}

interface ChartState {
  chartFuncId: number;
}

export class Chart extends Component<ChartProps, ChartState> {
  chartFuncs: ((x: Date) => number)[] = [
    x => x.getHours(),
    x => x.getDay() === 0 ? 7 : x.getDay(),
    x => x.getFullYear() * 100 + x.getMonth() + 1
  ];

  daysOfWeek: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  xAxisFuncs: ((x: { name: number }) => string)[] = [
    x => x.name + "",
    x => this.daysOfWeek[x.name],
    x => x.name % 100 + "-" + Math.floor(x.name / 100)
  ];

  constructor(props: Readonly<ChartProps>) {
    super(props);
    this.state = { chartFuncId: 0 };
  }


  chartData = () => from(this.props.listeningHistory)
    .groupBy(x => this.chartFuncs[this.state.chartFuncId](x.date))
    .select(g => ({
      name: g.key,
      totalTime: Math.round(g.sum(x => x.msPlayed) / 60000),
      totalPlaybacks: g.count(),
      mostPlayedTrack: g.groupBy(x => x.trackName).orderByDescending(x => x.count(), Comparer).first().key,
      mostPlayedArtist: g.groupBy(x => x.artistName).orderByDescending(x => x.count(), Comparer).first().key
    }))
    .toArray();

  render() {
    return (
      <React.Fragment>
        <ButtonGroup className="d-flex" size="lg">
          <Button active={this.state.chartFuncId === 0} color="primary" onClick={() => this.setState({ ...this.state, chartFuncId: 0 })}>Hours</Button>
          <Button active={this.state.chartFuncId === 1} color="primary" onClick={() => this.setState({ ...this.state, chartFuncId: 1 })}>Days of week</Button>
          <Button active={this.state.chartFuncId === 2} color="primary" onClick={() => this.setState({ ...this.state, chartFuncId: 2 })}>Months</Button>
        </ButtonGroup>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={this.chartData()}
            margin={{
              top: 25, right: 20, left: 20, bottom: 50,
            }}
          >
            <CartesianGrid strokeDasharray="5 5" />
            <XAxis dataKey={this.xAxisFuncs[this.state.chartFuncId]} />
            <YAxis />
            <Tooltip content={CustomTooltip} />
            <Line type="monotone" dataKey="totalTime" stroke="#00d76f" strokeWidth={5} />
          </LineChart>
        </ResponsiveContainer>
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
