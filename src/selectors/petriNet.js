import * as nodeTypes from '../constants/nodeTypes';

export const getIncomingEdges = (state, nodeId) => (
    Object.values(state.edgesById).filter(edge => edge.to === nodeId)
);

export const getOutgoingEdges = (state, nodeId) => (
    Object.values(state.edgesById).filter(edge => edge.from === nodeId)
);

export const getNumberOfTokens = (state, placeId) => (
    state.markings[state.markings.length - 1][placeId]
);

const canTakeTokens = (state, placeId, numberOfTokens) => {
    const place = state.nodesById[placeId];
    if (place.capacityLimit === undefined) {
        return true;
    }
    const leftCapacity = place.capacityLimit - getNumberOfTokens(state, placeId);
    return leftCapacity >= numberOfTokens;
};

export const getNumMissingTokens = (net, transitionId) => {
    const edges = getIncomingEdges(net, transitionId);
    let numTokens = 0;
    let numRequired = 0;
    edges.forEach(edge => {
        numTokens += getNumberOfTokens(net, edge.from);
        numRequired += edge.weight;
    });

    return numRequired - numTokens;
}

export const getActiveTransitions = (state) => {
    const all = Object.values(state.nodesById)
        .filter(node => node.type === nodeTypes.TRANSITION);

    return all.filter(transition => {
        const incoming = getIncomingEdges(state, transition.id);
        if (incoming.some((edge) => edge.weight > getNumberOfTokens(state, edge.from))) {
            return false;
        }

        let outgoing = getOutgoingEdges(state, transition.id);
        return !outgoing.some((edge) => !canTakeTokens(state, edge.to, edge.weight));
    });
};

export const getNumNetTokens = (net) => {
    return Object.values(net.markings[net.markings.length - 1]).reduce((w1, w2) => w1 + w2);
};

export const getNumConsumedTokens = (net, transitionId) => {
    return getIncomingEdges(net, transitionId).map(e => e.weight).reduce((w1, w2) => w1 + w2);
};

export const getNumProducedTokens = (net, transitionId) => {
    return getOutgoingEdges(net, transitionId).map(e => e.weight).reduce((w1, w2) => w1 + w2);
};

export const getTransitionByLabel = (net, label) => {
    return Object.values(net.nodesById)
        .filter(node => node.type === nodeTypes.TRANSITION && node.label === label)[0];
}
