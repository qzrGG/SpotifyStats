import { Component } from "react";
import React from "react";
import { ButtonGroup, Button } from "reactstrap";
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip, ResponsiveContainer } from "recharts";
import { ListeningEntry } from "../models/listeningEntry";
import { from, range } from "linq-to-typescript";
import Comparer from "../models/Comparer";
import { minutes, round } from "../common/math.helper";

export interface ChartProps {
  listeningHistory: ListeningEntry[];
  description: string;
  since: Date;
  to: Date;
}

interface ChartState {
  chartFuncId: number;
}

export class Chart extends Component<ChartProps, ChartState> {
  chartFuncs: ((x: Date) => number)[] = [
    x => x.getHours(),
    x => x.getDay() === 0 ? 7 : x.getDay(),
    x => this.monthValue(x)
  ];

  daysOfWeek: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  xAxisFuncs: ((x: { name: number }) => string)[] = [
    x => x.name.toString().padStart(2, '0'),
    x => this.daysOfWeek[x.name],
    x => `${(x.name % 100).toString().padStart(2, '0')}.${Math.floor(x.name / 100)-2000}`
  ];

  constructor(props: Readonly<ChartProps>) {
    super(props);
    this.state = { chartFuncId: 0 };
  }

  monthValue = (date: Date): number => date.getFullYear() * 100 + date.getMonth() + 1;

  monthDiff = (d1: Date, d2: Date) => {
    let months = 0;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

  nthMonth = (n: number): number => {
    const firstDate = new Date(this.props.since);
    const nthDate = new Date(firstDate.setMonth(firstDate.getMonth() + n));
    return this.monthValue(nthDate);
  }

  emptyData: {name: number, totalTime: number, totalPlaybacks: number, mostPlayedTrack: string, mostPlayedArtist: string}[][] = [
    range(0, 24).select(x => ({name: x, totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: ""})).toArray(),
    range(1, 7).select(x => ({name: x, totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: ""})).toArray(),
    range(0, this.monthDiff(this.props.since, this.props.to)).select(x => ({name: this.nthMonth(x), totalTime: 0, totalPlaybacks: 0, mostPlayedTrack: "", mostPlayedArtist: ""})).toArray()
  ];


  chartData = () => from(this.props.listeningHistory)
    .groupBy(x => this.chartFuncs[this.state.chartFuncId](x.date))
    .select(g => ({
      name: g.key,
      totalTime: round(g.sum(x => x.msPlayed) / 60000, 2),
      totalPlaybacks: g.count(),
      mostPlayedTrack: g.groupBy(x => x.trackName).orderByDescending(x => x.count(), Comparer).first().take(1).select(x => `${x.trackName} by ${x.artistName}`).first(),
      mostPlayedArtist: g.groupBy(x => x.artistName).orderByDescending(x => x.count(), Comparer).first().key
    }))
    .union(this.emptyData[this.state.chartFuncId])
    .groupBy(x => x.name)
    .select(x => x.first())
    .toArray();

  render() {
    if (this.props.listeningHistory == null || this.props.listeningHistory.length === 0) {
      return (<p>Select a track or an artist in the table to see it's details</p>);
    } 
    return (
      <React.Fragment>
        <span className="section-header mb-3">{this.props.description}</span>
        
        <ButtonGroup className="d-flex mb-3" size="md">
          <Button active={this.state.chartFuncId === 0} color="primary" onClick={() => this.setState({ chartFuncId: 0 })}>Hours</Button>
          <Button active={this.state.chartFuncId === 1} color="primary" onClick={() => this.setState({ chartFuncId: 1 })}>Days of week</Button>
          <Button active={this.state.chartFuncId === 2} color="primary" onClick={() => this.setState({ chartFuncId: 2 })}>Months</Button>
        </ButtonGroup>
        <ResponsiveContainer width="100%" height="70%">
          <LineChart
            data={this.chartData()}
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
  if (active && payload && payload[0].payload.totalTime > 0) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`Total listening time: ${minutes(payload[0].payload.totalTime)}`}</p>
        <p className="desc">Total tracks played: {payload[0].payload.totalPlaybacks}<br />
          Favourite track: {payload[0].payload.mostPlayedTrack}<br />
          Favourite artist: {payload[0].payload.mostPlayedArtist}<br />
        </p>
      </div>
    );
  }

  return null;
};
