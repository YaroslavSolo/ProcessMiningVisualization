import React, {Component} from 'react';
import TraceItem from "./TraceItem";

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
        term: ''
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

    changeNumber = (id) => {
        this.setState(({ traces }) => {
            const index = traces.findIndex((el) => el.key === id);
            const targetTrace = traces[index]
            targetTrace.number = targetTrace.number + 1;

            const res = [...traces.slice(0, index), targetTrace, ...traces.slice(index + 1)];

            return {
                traces: res
            };
        });
    }

    render() {
        const items = this.state.traces.map((item) => {
            const { key: id, ...other } = item;

            return (
                <li key={id} className="list-group-item">
                    <TraceItem { ...other }
                               onNumberChange={() => this.changeNumber(id)}
                               onDeletion={() => this.deleteItem(id)}/>
                </li>
            );
        });

        return (
            <div>
                <ul className="list-group">
                    {items}
                </ul>
                <button className="" type="button" onClick={() => this.addItem('')}>
                    Add new trace
                </button>
            </div>
        );
    }
}

export default CaseTracesList;
