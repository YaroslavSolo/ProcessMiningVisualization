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
        this.state = {trace: "abcd", pos: 0};
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
        await sleep(2000);
    }

    onRunStep = () => {
        const pos = this.state.pos;
        const activeTransitions = getActiveTransitions(this.props.petriNet)
            .filter((t) => t.label === this.state.trace[pos]);

        if (activeTransitions.length === 1) {
            this.handleClickOnElement(null, activeTransitions[0].id);
        }
        this.setState({pos: pos + 1})
    }

    onRun = async () => {
        const trace = this.state.trace;
        for (let i = 0; i < trace.length; i++) {
            const activeTransitions = getActiveTransitions(this.props.petriNet).filter((t) => t.label === trace[i]);
            if (activeTransitions.length === 1) {
                this.handleClickOnElement(null, activeTransitions[0].id);
            }
            await this.wait();
        }
    }

    onReset = () => {
        this.setState({pos: 0})
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
