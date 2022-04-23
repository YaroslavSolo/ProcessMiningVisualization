import React, {Component} from 'react';
import {Button, Radio} from 'antd';
import * as nodeType from '../constants/nodeTypes';
import Toolbar from './Toolbar';
import './css/HorizontalToolbar.css';

class EditorToolbar extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange = (event) => {
        this.props.onNodeTypeChange(event.target.value);
    }

    render() {
        let activeNodeType = this.props.activeNodeType;
        return (
            <Toolbar backgroundColor="#008B27">
                <Radio.Group value={activeNodeType} onChange={this.handleChange} buttonStyle="solid">
                    <Radio.Button value={nodeType.TRANSITION}>
                        Transition
                    </Radio.Button>
                    <Radio.Button value={nodeType.PLACE}>
                        Place
                    </Radio.Button>
                </Radio.Group>
                <Button id="clear" icon="delete" className="btn-margin" onClick={this.props.onClear}>Clear</Button>
            </Toolbar>
        )
    }
}

export default EditorToolbar;
