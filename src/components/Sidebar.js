import React, {Component} from 'react';
import {Layout} from 'antd';
import CreateBoxContainer from '../containers/CreateBoxContainer';
import PetriNetMenuContainer from '../containers/PetriNetMenuContainer';
import CaseTracesListContainer from "../containers/CaseTracesListContainer";

const {Sider} = Layout;

class Sidebar extends Component {
    render() {
        // <CreateBoxContainer/>
        // <PetriNetMenuContainer/>
        return (
            <Sider>
                <CaseTracesListContainer/>
            </Sider>
        );
    }
}

export default Sidebar;
