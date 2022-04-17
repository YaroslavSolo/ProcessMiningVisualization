import React, {Component} from 'react';
import {Layout} from 'antd';
import CreateBoxContainer from '../containers/CreateBoxContainer';
import PetriNetMenuContainer from '../containers/PetriNetMenuContainer';
import CaseTracesList from "./CaseTracesList";

const {Sider} = Layout;

class Sidebar extends Component {
    render() {
        return (
            <Sider>
                <CaseTracesList/>
                <CreateBoxContainer/>
                <PetriNetMenuContainer/>
            </Sider>
        );
    }
}

export default Sidebar;
