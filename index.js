import React from 'react';
import AppViews from './views/AppViews.js';
import DeployerViews from './views/DeployerViews.js';
import AttacherViews from './views/AttacherViews.js';
import {renderDOM, renderView} from './views/render.js';
import './index.css';
import * as backend from './build/index.main.mjs';
import { loadStdlib } from '@reach-sh/stdlib';
const reach = loadStdlib(process.env);

import {ALGO_MyAlgoConnect as MyAlgoConnect} from '@reach-sh/stdlib';
reach.setWalletFallback(reach.walletFallback({
    providerEnv: 'TestNet', MyAlgoConnect
}));

const fortuneToInt ={ 'GOOD': 0, 'NORMAL':1, 'BAD': 2};
const intToFortune =['GOOD', 'NORMAL', 'BAD'];
const {standardUnit} = reach;
const defaults = {defaultFundAmt: '10', defaultWager: '3', standardUnit};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {view: 'ConnectAccount', ...defaults};
  }
  async componentDidMount() {
    const acc = await reach.getDefaultAccount();
    const balAtomic = await reach.balanceOf(acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({acc, bal});
    if (await reach.canFundFromFaucet()) {
      this.setState({view: 'FundAccount'});
    } else {
      this.setState({view: 'DeployerOrAttacher'});
    }
  }
  async fundAccount(fundAmount) {
    await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount));
    this.setState({view: 'DeployerOrAttacher'});
  }
  async skipFundAccount() { this.setState({view: 'DeployerOrAttacher'}); }
  selectAttacher() { this.setState({view: 'Wrapper', ContentView: Attacher}); }
  selectDeployer() { this.setState({view: 'Wrapper', ContentView: Deployer}); }
  render() { return renderView(this, AppViews); }
}

class Player extends React.Component {
  seeOutcome(i, j) { this.setState({view: 'Done', decision: i, outcome: intToFortune[j]}); }
  informTimeout() { this.setState({view: 'Timeout'}); }
}

class Deployer extends Player {
  constructor(props) {
    super(props);
    this.state = {view: 'SetWager'};
  }
  setWager(wager) { this.setState({view: 'Deploy', wager}); }
  async deploy() {
    const ctc = this.props.acc.contract(backend);
    this.setState({view: 'Deploying', ctc});
    this.wager = reach.parseCurrency(this.state.wager);
    this.deadline = {ETH: 10, ALGO: 100, CFX: 1000}[reach.connector]; 
    backend.Alice(ctc, this);
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
    this.setState({view: 'WaitingForAttacher', ctcInfoStr});
  }
  async getDecision(fortune) { 
    const decision = await new Promise(resolveDecisionP => {
      this.setState({view: 'GetDecision', playable: true, fortune: intToFortune[fortune], resolveDecisionP});
    });
    this.setState({view: 'WaitingForResults', decision});
    return decision;
  }
  playDecision(decision) { this.state.resolveDecisionP(decision); }
  render() { return renderView(this, DeployerViews); }
}

class Attacher extends Player {
  constructor(props) {
    super(props);
    this.state = {view: 'Attach'};
  }
  attach(ctcInfoStr) {
    const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
    this.setState({view: 'Attaching'});
    backend.Bob(ctc, this);
  }
  async acceptWager(wagerAtomic) { 
    const wager = reach.formatCurrency(wagerAtomic, 4);
    return await new Promise(resolveAcceptedP => {
      this.setState({view: 'AcceptTerms', wager, resolveAcceptedP});
    });
  }
  async tellFortune() { 
    const fortune = await new Promise(resolveFortuneP => {
      this.setState({view: 'TellFortune', playable: true, resolveFortuneP});
    });
    this.setState({view: 'WaitingForResults', fortune});
    return fortuneToInt[fortune];
  }
  termsAccepted() {
    this.state.resolveAcceptedP();
    this.setState({view: 'WaitingForTurn'});
  }
  playFortune(fortune) { this.state.resolveFortuneP(fortune); }
  render() { return renderView(this, AttacherViews); }
}

renderDOM(<App />);