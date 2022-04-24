import React, {Component} from 'react';
import {Button, Radio} from 'antd';
import Toolbar from './Toolbar';
import './css/HorizontalToolbar.css';
import * as speedType from "../constants/speedTypes";

class SimulatorToolbar extends Component {

    handleChange = (event) => {
        this.props.onSpeedChange(event.target.value);
    }

    render() {
        const speed = this.props.speed;

        return (
            <Toolbar backgroundColor="#008B27">
                <Radio.Group value={speed} onChange={this.handleChange} buttonStyle="solid">
                    <Radio.Button value={speedType.SLOW}>
                        {speedType.SLOW}
                    </Radio.Button>
                    <Radio.Button value={speedType.FAST}>
                        {speedType.FAST}
                    </Radio.Button>
                </Radio.Group>
                <Button id="run" icon="play-circle" className="btn-margin" onClick={this.props.onRun}>Run</Button>
                <Button id="runStep" icon="play-circle" className="btn-margin" onClick={this.props.onRunStep}>Run step</Button>
                <Button id="pause" icon="pause" className="btn-margin" onClick={this.props.onPause}>Pause</Button>
                <Button id="reset" icon="reload" className="btn-margin" onClick={this.props.onReset}>Reset</Button>
            </Toolbar>
        )
    }
}

export default SimulatorToolbar;
