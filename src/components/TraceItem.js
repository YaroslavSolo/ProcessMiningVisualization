import React from "react";
import {Button} from "antd";
import './css/TraceItem.css';

class TraceItem extends React.Component {

    state = {
        number: "1"
    };

    onNumberChange = (event) => {
        const newValue = event.target.value;
        const regexp = new RegExp("^[1-9]?[0-9]{0,9}$");

        if (regexp.test(newValue)) {
            this.setState({number: newValue});
            this.props.onNumberChange(newValue);
        }
    };

    onLostFocus = () => {
        if (this.state.number === '') {
            this.setState({number: '1'});
        }
    }

    render() {
        const {trace = 'abcd', onDeletion} = this.props;

        return (
            <div>
                <span>
                    {trace}
                </span>
                <div className="trace-item parent">
                    <Button type="danger" icon="delete" className="inline-right" onClick={onDeletion}/>

                    <input name="numberInput" type='text' className="inline-right trace-item-number form-control"
                           placeholder='1' required
                           onChange={this.onNumberChange}
                           onBlur={this.onLostFocus}
                           value={this.state.number}/>
                </div>
            </div>
        );
    }
}

export default TraceItem;
