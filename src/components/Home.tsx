import React, { Component } from 'react';
import { NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';

export class Home extends Component {
  static displayName = Home.name;

  render () {
    return (
      <div>
        <h1>How to use it</h1>
        <ol className="instructions">
          <li>Go to <a href="https://www.spotify.com/en/account/privacy/" target="_blank">Spotify privacy settings</a> and scrlil down</li>
          <li>Request a copy of your data</li>
          <li>Wait a couple of days</li>
          <li>Check your inbox and download the data</li>
          <li>Unzip and upload your <i>StreamingHistory#.json</i> files <a href="/stats">HERE</a></li>
        </ol>
      </div>
    );
  }
}
