import React, {Component} from 'react';
import TraceItem from "./TraceItem";
import { Notify } from 'notiflix/build/notiflix-notify-aio';

class CaseTracesList extends Component {

    constructor(props) {
        super(props);
        this.props.petriNet.traces = this.state.traces;
    }

    traceId = 0;

    createTrace = (traceStr) => {
        return {
            key: this.traceId++,
            trace: traceStr,
            number: 1,
            active: false,
        };
    }

    state = {
        traces: [
            //this.createTrace('abcdg'),
            //this.createTrace('abdcg'),
            //this.createTrace('abcg')
        ],
        text : ''
    };

    addItem = (traceStr) => {
        const res = [...this.state.traces, this.createTrace(traceStr)];
        this.setState({traces: res});
        this.props.petriNet.traces = res;
    }

    deleteItem = (id) => {
        const traces = this.state.traces;
        const index = traces.findIndex((el) => el.key === id);
        const res = [...traces.slice(0, index), ...traces.slice(index + 1)];

        this.setState({traces: res});
        this.props.petriNet.traces = res;
    }

    changeNumber = (id, number) => {
        const traces = this.state.traces;
        const index = traces.findIndex((el) => el.key === id);
        const targetTrace = traces[index]
        targetTrace.number = Number(number);
        const res = [...traces.slice(0, index), targetTrace, ...traces.slice(index + 1)];

        this.setState({traces: res});
        this.props.petriNet.traces = res;
    }

    onLabelChange = (event) => {
        const newValue = event.target.value;
        const regexp = new RegExp("^[a-zA-Z]{0,15}$");

        if (regexp.test(newValue)) {
            this.setState({ text: event.target.value });
        }
    };

    onSubmit = (event) => {
        event.preventDefault();
        const length = this.state.text.length;

        if (length === 0) {
            return;
        } else if (length > 15) {
            Notify.failure("Case trace is too long, max: 15");
            return;
        } else if (this.state.traces.length > 25) {
            Notify.failure("Too many case traces, max: 25");
            return;
        }

        this.addItem(this.state.text);
        this.setState({text: '' });
    };

    render() {
        const items = this.state.traces.map((item) => {
            const { key: id, active, ...other } = item;
            const color = active ? "#90EE90" : "whitesmoke";

            return (
                <li key={id} className="list-group-item" style={{background: color}}>
                    <TraceItem { ...other }
                               onNumberChange={(number) => this.changeNumber(id, number)}
                               onDeletion={() => this.deleteItem(id)}/>
                </li>
            );
        });

        return (
            <div>
                <h4 style={{color: "whitesmoke", marginTop: "15px",
                            marginBottom: "21px", marginLeft: "38px",
                            fontSize: 23}}>
                    Case traces
                </h4>
                <form className='d-flex' onSubmit={this.onSubmit}>
                    <input type='text' className='form-control'
                           style={{height: "48px"}}
                           placeholder='Enter trace' onChange={this.onLabelChange}
                           pattern='[a-zA-Z]*' value={this.state.text}/>

                    <button className="btn btn-light" style={{height: "48px"}}>
                        Add
                    </button>
                </form>
                <ul className="list-group">
                    {items}
                </ul>
            </div>
        );
    }
}

export default CaseTracesList;
