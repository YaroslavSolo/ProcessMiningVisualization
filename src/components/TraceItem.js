import React from "react";
import {Button} from "antd";
import './css/TraceItem.css';

class TraceItem extends React.Component {

    render() {
        const { trace = 'abcd', number = '1', onDeletion, onNumberChange } = this.props;

        return (
            <div className="trace-item parent">
                <Button type="danger" icon="delete" className="inline-right" onClick={onDeletion}/>

                <input type='text' className="inline-right trace-item-number form-control"
                       placeholder='1' pattern='[0-9]*'
                       onChange={onNumberChange}
                       value={number}/>

                <span className="inline-left">
                    {trace}
                </span>
            </div>
        );
    }
}

export default TraceItem;
