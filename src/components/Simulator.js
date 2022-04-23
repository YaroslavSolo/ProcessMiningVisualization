import React, {Component} from 'react';
import TransitionAnimation from '../animations/TransitionAnimation';
import {
    getActiveTransitions,
    getNumConsumedTokens,
    getNumProducedTokens,
    getNumNetTokens,
    getTransitionByLabel, getNumMissingTokens,
} from '../selectors/petriNet';
import GraphArea from './GraphArea';
import GraphAnimation from './GraphAnimation';
import PetriNetGraph from './PetriNetGraph';
import SimulatorToolbar from './SimulatorToolbar'
import * as nodeTypes from "../constants/nodeTypes";
import {Notify} from 'notiflix/build/notiflix-notify-aio';
import Sider from "antd/es/layout/Sider";
import {Layout} from "antd";
import './css/Simulator.css';
import Logo from "./Logo";

class Simulator extends Component {
    constructor(props) {
        super(props);
        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
        this.handleClickOnElement = this.handleClickOnElement.bind(this);
        this.state = {traceIdx: 0, pos: 0, reset: true, isRunning: false,
            produced: 0, consumed: 0, missing: 0, remaining: 0,
            curProduced: 0, curConsumed: 0, curMissing: 0, curRemaining: 0};
        this.markings = JSON.parse(JSON.stringify(this.props.petriNet.markings));
        this.isStepReady = true;
    }

    activeTransitionIds() {
        if (this.props.petriNet === undefined) {
            return [];
        }

        return getActiveTransitions(this.props.petriNet).map(transition => transition.id);
    }

    componentWillUnmount() {
        this.onReset();
    }

    handleAnimationEnd() {
        this.props.onFireTransition(this.state.selected);
        this.setState({selected: undefined});
    }

    handleClickOnElement(type, id) {
        if (!this.isTransitionActive(id) || this.state.selected !== undefined) {
            return;
        }
        this.setState({selected: id});
    }

    highlightedIds() {
        return this.state.selected ? [] : this.activeTransitionIds();
    }

    isTransitionActive(id) {
        return this.activeTransitionIds().indexOf(id) !== -1;
    }

    async wait(time) {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        await sleep(time === undefined ? 1500 : time);
    }

    validateTransitionNames = () => {
        const transitionNames = new Set();
        const transitions = Object.values(this.props.petriNet.nodesById)
            .filter(node => node.type === nodeTypes.TRANSITION);

        transitions.forEach(trans => {
            if (trans.label !== null && trans.label !== undefined && trans.label !== '') {
                transitionNames.add(trans.label);
            }
        });

        return transitions.length === transitionNames.size;
    }

    onMissingToken = async () => {
        console.log("Missing token");
        const net = this.props.petriNet;
        const {traceIdx, pos} = this.state;
        const transition = getTransitionByLabel(net, net.traces[traceIdx].trace[pos]);
        const curMissing = this.state.curMissing + getNumMissingTokens(net, transition.id);
        this.props.onAddTokens(transition.id);
        this.setState({curMissing: curMissing});
    }

    isFinished = () => {
        const traces = this.props.petriNet.traces;
        const traceIdx = this.state.traceIdx;
        return traces.length <= traceIdx;
    }

    updateUiTokens = (currentTrace) => {
        const {produced, consumed, missing, remaining} = this.state;
        let {curProduced, curConsumed, curMissing, curRemaining} = this.state;
        if (currentTrace !== undefined) {
            curProduced *= currentTrace.number;
            curConsumed *= currentTrace.number;
            curMissing *= currentTrace.number;
            curRemaining *= currentTrace.number;
        }
        this.setState({produced: produced + curProduced, consumed: consumed + curConsumed,
                             missing: missing + curMissing, remaining: remaining + curRemaining,
                             curProduced: 0, curConsumed: 0, curMissing: 0, curRemaining: 0});
    }

    updateTransitionTokens = (transitionId) => {
        const net = this.props.petriNet;
        const curProduced = this.state.curProduced + getNumProducedTokens(net, transitionId);
        const curConsumed = this.state.curConsumed + getNumConsumedTokens(net, transitionId);
        this.setState({curProduced: curProduced, curConsumed: curConsumed});
    }

    updateState = () => {
        const {traceIdx, pos} = this.state;
        const currentTrace = this.props.petriNet.traces[traceIdx];

        if (currentTrace.trace.length === pos + 1) {
            this.setState({traceIdx: traceIdx + 1, pos: 0, reset: true});
        } else {
            this.setState({pos: pos + 1});
        }
    }

    onAlgorithmFinished = () => {
        const curRemaining = getNumNetTokens(this.props.petriNet);
        this.setState({curRemaining: curRemaining - 1});

        this.updateUiTokens();
        const {produced, consumed, missing, remaining} = this.state;
        const fitness = 0.5 * (1 - missing / consumed) + 0.5 * (1 - remaining / produced);
        this.setState({fitness: fitness});

        Notify.success("Algorithm has finished!");
    }

    onNextTrace = async () => {
        console.log("next trace");
        const traceIdx = this.state.traceIdx;
        const petriNet = this.props.petriNet;
        const currentTrace = petriNet.traces[traceIdx];

        currentTrace.active = true;
        if (traceIdx - 1 >= 0) {
            petriNet.traces[traceIdx - 1].active = false;
        }

        // todo: refactor
        let curRemaining = getNumNetTokens(petriNet);
        curRemaining = curRemaining === 0 ? 1 : curRemaining;
        const curProduced = this.state.curProduced;
        const curConsumed = this.state.curConsumed;
        this.setState({reset: false, curRemaining: curRemaining - 1,
            curProduced: curProduced, curConsumed: curConsumed});

        this.props.petriNet.markings = JSON.parse(JSON.stringify(this.markings));
        this.updateUiTokens(petriNet.traces[traceIdx - 1]);

        await this.props.onReset();
    }

    tryRunStep = () => {
        if (this.state.isRunning) {
            return;
        }
        if (this.isStepReady) {
            this.isStepReady = false;
            this.onRunStep();
            setTimeout(() => this.isStepReady = true, 1550);
        }
    }

    onRunStep = async () => {
        console.log("idx: ", this.state.traceIdx, "pos: ", this.state.pos);
        if (!this.validateTransitionNames()) {
            Notify.failure("Transition names are incorrect");
            return;
        }
        if (this.props.petriNet.traces.length === 0) {
            Notify.failure("There are no case traces to run");
            return;
        }
        if (this.isFinished()) {
            this.onAlgorithmFinished();
            return;
        }

        const {traceIdx, pos, reset} = this.state;
        const petriNet = this.props.petriNet;
        const currentTrace = petriNet.traces[traceIdx];

        if (pos === 0 && reset) {
            await this.onNextTrace();
            return;
        }

        const activeTransitions = getActiveTransitions(petriNet)
            .filter((t) => t.label === currentTrace.trace[pos]);

        if (activeTransitions.length === 1) {
            await this.handleClickOnElement(null, activeTransitions[0].id);
            this.updateTransitionTokens(activeTransitions[0].id);
            this.updateState();
        } else {
            await this.onMissingToken();
        }
    }

    onRun = async () => {
        if (this.state.isRunning) {
            return;
        }
        this.setState({isRunning: true});
        while (!this.isFinished()) {
            await this.onRunStep();
            await this.wait(1500);
            if (!this.state.isRunning) {
                return;
            }
        }
        this.onAlgorithmFinished();
        this.setState({isRunning: false});
    }

    pause = () => {
        if (this.state.isRunning) {
            this.setState({isRunning: false});
            Notify.info("Algorithm paused")
        }
    }

    onReset = async () => {
        if (this.state.isRunning) {
            await this.wait(50);
        }
        const traceIdx = this.state.traceIdx;
        if (traceIdx < this.props.petriNet.traces.length && traceIdx >= 0) {
            this.props.petriNet.traces[traceIdx].active = false;
        }
        if (this.props.petriNet.traces.length !== 0) {
            this.props.petriNet.traces[this.props.petriNet.traces.length - 1].active = false;
        }
        this.props.petriNet.markings = JSON.parse(JSON.stringify(this.markings));
        this.setState({traceIdx: 0, pos: 0, reset: true, isRunning: false,
            produced: 0, consumed: 0, missing: 0, remaining: 0,
            curProduced: 0, curConsumed: 0, curMissing: 0, curRemaining: 0});
        this.props.onReset();
    }

    renderResult = () => {
        if (this.isFinished() && this.props.petriNet.traces.length !== 0) {
            return (
                <div className="wrapper">
                    <br/>
                    <h6 className="center">Result</h6>
                    <Logo/>
                    <br/>
                    <h6>Fitness = {this.state.fitness}</h6>
                </div>
            )
        }
    }

    render() {
        return (
            <>
                <SimulatorToolbar onRun={this.onRun} onRunStep={this.tryRunStep} onReset={this.onReset} onPause={this.pause}/>
                <Layout>
                    <GraphArea>
                        <PetriNetGraph petriNet={this.props.petriNet}
                                       locked={true}
                                       maxZoom={1}
                                       highlightedIds={this.highlightedIds()}
                                       onClickOnElement={this.handleClickOnElement}>
                            {this.renderAnimation()}
                        </PetriNetGraph>
                    </GraphArea>
                    <Sider className="editor__sidebar" width={300}>
                        <div>
                            <h5>Token based replay</h5>
                            <div className="wrapper">
                                <br/>
                                <h6 className="center">Total</h6>
                                <div className="parent">
                                    <p className="inline-left">Produced:</p>
                                    <p className="inline-right">{this.state.produced}</p>
                                </div>
                                <div className="parent">
                                    <p className="inline-left">Consumed:</p>
                                    <p className="inline-right">{this.state.consumed}</p>
                                </div>
                                <div className="parent">
                                    <p className="inline-left">Missing: </p>
                                    <p className="inline-right">{this.state.missing}</p>
                                </div>
                                <div className="parent">
                                    <p className="inline-left">Remaining: </p>
                                    <p className="inline-right">{this.state.remaining}</p>
                                </div>
                            </div>
                            <div className="wrapper">
                                <br/>
                                <h6 className="center">Current trace</h6>
                                <div className="parent">
                                    <p className="inline-left">Produced:</p>
                                    <p className="inline-right">{this.state.curProduced}</p>
                                </div>
                                <div className="parent">
                                    <p className="inline-left">Consumed:</p>
                                    <p className="inline-right">{this.state.curConsumed}</p>
                                </div>
                                <div className="parent">
                                    <p className="inline-left">Missing: </p>
                                    <p className="inline-right">{this.state.curMissing}</p>
                                </div>
                                <div className="parent">
                                    <p className="inline-left">Remaining: </p>
                                    <p className="inline-right">{this.state.curRemaining}</p>
                                </div>
                            </div>
                            {this.renderResult()}
                        </div>
                    </Sider>
                </Layout>
            </>
        );
    }

    renderAnimation() {
        if (this.state.selected === undefined) {
            return null;
        }

        return <GraphAnimation elementId={this.state.selected}
                               animation={TransitionAnimation}
                               onEnd={this.handleAnimationEnd}/>
    }
}

export default Simulator;
