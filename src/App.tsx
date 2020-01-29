import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Layout } from './components/Layout';
import { Route } from 'react-router';
import { Home } from './components/Home';
import { Counter } from './components/Counter';
import { BrowserRouter } from 'react-router-dom';

const App: React.FC = () => {
  const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href') as string;

  return (
    <BrowserRouter basename={baseUrl}>
      <Layout>
        <Route exact path='/' component={Home} />
        <Route path='/counter' component={Counter} />
      </Layout>
    </BrowserRouter>
  );
}

export default App;
