import React, {Component} from 'react';
import TransitionAnimation from '../animations/TransitionAnimation';
import {
    getActiveTransitions,
    getNumConsumedTokens,
    getNumProducedTokens,
    getNumNetTokens,
    getTransitionByLabel,
    getNumMissingTokens,
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
import {FAST, SLOW} from "../constants/speedTypes";
import {simulatorInitialState} from "../utils/initialState";

class Simulator extends Component {
    constructor(props) {
        super(props);
        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
        this.handleClickOnElement = this.handleClickOnElement.bind(this);
        this.state = {reset: true, animationSpeed: 550, waitTime: 1650, speed: SLOW, ...simulatorInitialState};
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
        this.reset();
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

    validatePetriNet = () => {
        const net = this.props.petriNet;
        return Object.values(net.edgesById).length >= Object.values(net.nodesById).length - 1;
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

        const namesFromTraces = new Set();
        const traces = this.props.petriNet.traces.map(t => t.trace);
        traces.forEach(trace => {
            trace.split('').forEach(name => {
                namesFromTraces.add(name);
            })
        });

        const areSetsEqual = (a, b) => a.size === b.size && [...a].every(value => b.has(value));

        return transitions.length === transitionNames.size && areSetsEqual(namesFromTraces, transitionNames);
    }

    changeSpeed = (newSpeed) => {
        switch (newSpeed) {
            case FAST: {
                this.setState({speed: FAST, animationSpeed: 100, waitTime: 350});
                return;
            }
            default: {
                this.setState({speed: SLOW, animationSpeed: 550, waitTime: 1650});
            }
        }
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
        this.setState({fitness: Number(fitness).toFixed(6)});

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
            this.runStep();
            setTimeout(() => this.isStepReady = true, this.state.waitTime + 30);
        }
    }

    validateBeforeRun = () => {
        if (!this.validatePetriNet()) {
            Notify.failure("Process model is not consistent");
            return false;
        }
        if (this.props.petriNet.traces.length === 0) {
            Notify.failure("There are no case traces to run");
            return false;
        }
        if (!this.validateTransitionNames()) {
            Notify.failure("Transition names are incorrect");
            return false;
        }
        return true;
    }

    runStep = async () => {
        console.log("idx: ", this.state.traceIdx, "pos: ", this.state.pos);
        if (!this.validateBeforeRun()) {
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

    run = async () => {
        if (this.state.isRunning) {
            return;
        }
        if (!this.validateBeforeRun()) {
            return;
        }

        this.setState({isRunning: true});
        while (!this.isFinished()) {
            await this.runStep();

            await this.wait(this.state.waitTime);
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

    reset = async () => {
        if (this.state.isRunning) {
            await this.wait(50);
        }

        this.setState({reset: true, ...simulatorInitialState});
        const traceIdx = this.state.traceIdx;
        if (traceIdx < this.props.petriNet.traces.length && traceIdx >= 0) {
            this.props.petriNet.traces[traceIdx].active = false;
        }
        if (this.props.petriNet.traces.length !== 0) {
            this.props.petriNet.traces[this.props.petriNet.traces.length - 1].active = false;
        }

        this.props.petriNet.markings = JSON.parse(JSON.stringify(this.markings));
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
                <SimulatorToolbar onRun={this.run}
                                  onRunStep={this.tryRunStep}
                                  onReset={this.reset}
                                  onPause={this.pause}
                                  onSpeedChange={this.changeSpeed}
                                  speed={this.state.speed}/>
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
                               speed={this.state.animationSpeed}
                               onEnd={this.handleAnimationEnd}/>
    }
}

export default Simulator;
