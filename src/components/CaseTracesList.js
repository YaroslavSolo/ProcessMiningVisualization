import React, {Component} from 'react';
import TraceItem from "./TraceItem";
import { Notify } from 'notiflix/build/notiflix-notify-aio';

class CaseTracesList extends Component {

    traceId = 0;

    createTrace = (traceStr) => {
        return {
            key: this.traceId++,
            trace: traceStr,
            number: 1,
        };
    }

    state = {
        traces: [
            this.createTrace('abcdg'),
            this.createTrace('abdcg'),
            this.createTrace('abcg')
        ],
        text : ''
    };

    addItem = (traceStr) => {
        this.setState(({ traces }) => {
            return { traces: [...traces, this.createTrace(traceStr)] };
        });
    }

    deleteItem = (id) => {
        this.setState(({ traces }) => {
            const index = traces.findIndex((el) => el.key === id);
            const res = [...traces.slice(0, index), ...traces.slice(index + 1)];

            return {
                traces: res
            };
        });
    }

    changeNumber = (id, number) => {
        this.setState(({ traces }) => {
            const index = traces.findIndex((el) => el.key === id);
            const targetTrace = traces[index]
            targetTrace.number = Number(number);

            const res = [...traces.slice(0, index), targetTrace, ...traces.slice(index + 1)];

            return {
                traces: res
            };
        });
    }

    onLabelChange = (event) => {
        this.setState({ text: event.target.value });
    };

    onSubmit = (event) => {
        event.preventDefault();
        const length = this.state.text.length;

        if (length === 0) {
            return;
        } else if (length > 25) {
            Notify.failure("Case trace is too long");
            return;
        }

        this.addItem(this.state.text);
        this.setState({ text: '' });
    };

    render() {
        const items = this.state.traces.map((item) => {
            const { key: id, ...other } = item;

            return (
                <li key={id} className="list-group-item">
                    <TraceItem { ...other }
                               onNumberChange={(number) => this.changeNumber(id, number)}
                               onDeletion={() => this.deleteItem(id)}/>
                </li>
            );
        });

        return (
            <div>
                <h5>Case traces</h5>
                <ul className="list-group">
                    {items}
                </ul>
                <form className='d-flex' onSubmit={this.onSubmit}>
                    <input type='text' className='form-control'
                           placeholder='Enter trace' onChange={this.onLabelChange}
                           pattern='[a-zA-Z]*' value={this.state.text}/>

                    <button className="btn btn-light">
                        Add
                    </button>
                </form>
            </div>
        );
    }
}

export default CaseTracesList;
