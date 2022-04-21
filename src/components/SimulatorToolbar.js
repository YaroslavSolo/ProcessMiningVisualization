import React, {Component} from 'react';
import {Button} from 'antd';
import Toolbar from './Toolbar';
import './css/HorizontalToolbar.css';

class SimulatorToolbar extends Component {
    render() {
        return (
            <Toolbar backgroundColor="#008B27">
                <Button id="run" icon="play-circle" onClick={this.props.onRun}>Run</Button>
                <Button id="runStep" icon="play-circle" className="btn-margin" onClick={this.props.onRunStep}>Run step</Button>
                <Button id="reset" icon="reload" className="btn-margin" onClick={this.props.onReset}>Reset</Button>
            </Toolbar>
        )
    }
}

export default SimulatorToolbar;
