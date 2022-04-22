import React, {Component} from 'react';
import {Button, Form, Input, InputNumber} from 'antd';

class PlaceForm extends Component {
    constructor(props) {
        super(props);

        this.handleLabelChange = this.handleLabelChange.bind(this);
    }

    handleLabelChange(event) {
        this.props.onLabelChange(event.target.value);
    }

    onChange = (newValue) => {
        const regexp = new RegExp("^[1-9]?[0-9]{0,3}$");

        if (regexp.test(newValue)) {
            console.log(newValue);
            this.setState({number: newValue});
            this.props.onNumberOfTokensChange(newValue);
        }
    }

    render() {
        return (
            <>
                <h2>Place</h2>
                <Form layout="vertical">
                    <Form.Item label="">
                        <Input id="label" placeholder="Enter name"
                               value={this.props.label}
                               onChange={this.handleLabelChange}/>
                    </Form.Item>
                    <Form.Item label="Initial number of tokens">
                        <InputNumber id="numberOfTokens"
                                     min={0}
                                     value={this.props.numberOfTokens}
                                     onChange={this.onChange}/>
                    </Form.Item>
                    <Form.Item>
                        <Button id="delete"
                                type="danger"
                                icon="delete"
                                block
                                onClick={this.props.onDelete}>
                            Delete
                        </Button>
                    </Form.Item>
                </Form>
            </>
        );
    }
}

export default PlaceForm;
