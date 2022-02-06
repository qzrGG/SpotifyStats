import React from 'react';
import './App.css';
import { Layout } from './components/Layout';
import { Route } from 'react-router';
import { Home } from './components/Home';
import Stats from './components/Stats';
import { HashRouter } from 'react-router-dom';
import About from './components/About';

const App: React.FC = () => {
  const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href') as string;

  return (
    <HashRouter basename={baseUrl}>
      <Layout>
        <Route exact path='/' component={Home} />
        <Route path='/stats' component={Stats} />
        <Route path='/about' component={About} />
      </Layout>
    </HashRouter>
  );
}

export default App;
