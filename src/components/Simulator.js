import React, {Component} from 'react';
import TransitionAnimation from '../animations/TransitionAnimation';
import {getActiveTransitions} from '../selectors/petriNet';
import GraphArea from './GraphArea';
import GraphAnimation from './GraphAnimation';
import PetriNetGraph from './PetriNetGraph';
import SimulatorToolbar from './SimulatorToolbar'

class Simulator extends Component {
    constructor(props) {
        super(props);

        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
        this.handleClickOnElement = this.handleClickOnElement.bind(this);
        this.state = {traceIdx: 0, pos: 0};
    }

    activeTransitionIds() {
        if (this.props.petriNet === undefined) {
            return [];
        }

        return getActiveTransitions(this.props.petriNet).map(transition => transition.id);
    }

    componentWillUnmount() {
        this.props.onReset();
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

    async wait() {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        await sleep(1500);
    }

    isFinished = () => {
        const traces = this.props.petriNet.traces;
        const traceIdx = this.state.traceIdx;
        return traces.length <= traceIdx;
    }

    updateState = () => {
        const traceIdx = this.state.traceIdx;
        const currentTrace = this.props.petriNet.traces[traceIdx];
        const pos = this.state.pos;

        if (currentTrace.trace.length === pos + 1) {
            this.props.onReset();
            currentTrace.active = false;
            if (traceIdx + 1 < this.props.petriNet.traces.length) {
                this.props.petriNet.traces[traceIdx + 1].active = true;
            }
            this.setState({traceIdx: traceIdx + 1, pos: 0});
        } else {
            this.setState({pos: pos + 1});
        }
    }

    onRunStep = () => {
        console.log(this.state.traceIdx, "pos: ", this.state.pos);
        if (this.isFinished()) {
            return;
        }

        const petriNet = this.props.petriNet;
        const trace = petriNet.traces[this.state.traceIdx];
        trace.active = true;
        const pos = this.state.pos;
        const activeTransitions = getActiveTransitions(petriNet)
            .filter((t) => t.label === trace.trace[pos]);

        if (activeTransitions.length === 1) {
            this.handleClickOnElement(null, activeTransitions[0].id);
            this.updateState();
        }
    }

    onRun = async () => {
        while (!this.isFinished()) {
            this.onRunStep();
            await this.wait();
        }
    }

    onReset = () => {
        this.setState({traceIdx: 0, pos: 0});
        this.props.petriNet.traces[0].active = true;
        this.props.onReset();
    }

    render() {
        return (
            <>
                <SimulatorToolbar onRun={this.onRun} onRunStep={this.onRunStep} onReset={this.onReset}/>
                <GraphArea>
                    <PetriNetGraph petriNet={this.props.petriNet}
                                   locked={true}
                                   maxZoom={1}
                                   highlightedIds={this.highlightedIds()}
                                   onClickOnElement={this.handleClickOnElement}>
                        {this.renderAnimation()}
                    </PetriNetGraph>
                </GraphArea>
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
