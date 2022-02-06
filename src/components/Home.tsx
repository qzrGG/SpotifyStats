import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export class Home extends Component {
  static displayName = Home.name;

  render () {
    return (
      <div>
        <h1>How to use it</h1>
        <ol className="instructions">
          <li>Go to <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer">Spotify privacy settings</a> and scroll down</li>
          <li>Request a copy of your data</li>
          <li>Wait a couple of days</li>
          <li>Check your inbox and download the data</li>
          <li>Unzip and add your <i>StreamingHistory#.json</i> files <Link to="/stats">HERE</Link></li>
        </ol>
      </div>
    );
  }
}
