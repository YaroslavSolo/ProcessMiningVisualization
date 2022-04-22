import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import CaseTracesList from '../components/CaseTracesList';
import {getCurrentPetriNet} from '../selectors';

const mapStateToProps = (state, ownProps) => ({
    petriNet: getCurrentPetriNet(state, ownProps)
});

const mapDispatchToProps = (_, ownProps) => ({
});

export default withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
)(CaseTracesList));