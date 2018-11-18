import flattenDeep from "lodash/flattenDeep";

/**
 * @private
 * unFlatten a node
 * @param {Object} node Node to unflatten
 * @param {Array} node Array of flattened nodes
 * @return {Array} Array of unflattened nodes
 */
const unFlattenNode = (node, flattenedNodes) => {
  const children = flattenedNodes.filter(_node => {
    if (_node.parentNode) {
      return _node.parentNode.id == node.id;
    } else {
      return false;
    }
  });

  if (children.length == 0) {
    Object.assign(node, {
      leaf: true,
      children: []
    });
  } else {
    Object.assign(node, {
      children: children,
      leaf: false
    });

    node.children.forEach(child => {
      unFlattenNode(child, flattenedNodes);
    });
  }

  return node;
};

/**
 * @private
 * Flatten a node to a single array
 * @param {Object} node Node being flattened
 * @param {Array} [children] Children of node
 * @return {Array} Array of flatten nodes
 */
const flattenNode = (node, children) => {
  children = children || [];

  if (node.children) {
    children = children.concat(node.children);
    node.children.forEach(child => {
      child.parentNode = node;
      children.splice(children.indexOf(child) + 1, 0, flattenNode(child));
    });
  }

  return flattenDeep(children);
};

/**
 * Flatten an array nested nodes
 * @param {Array} nodes Nodes to flatten
 * @return {Array} Array of flatten nodes
 */
const flattenNodes = nodes => {
  let flattenNodes = [];

  nodes.forEach(node => {
    flattenNodes.push(node);

    flattenNodes.push(flattenNode(node));
  });

  return flattenDeep(flattenNodes);
};

/**
 * unFlatten an array nested nodes
 * @param {Array} nodes Nodes to unflatten
 * @return {Array} Array of unflattened nodes
 */
const unFlattenNodes = nodes => {
  let unFlattenedNodes = [];

  nodes.forEach(node => {
    if (!node.parentNode) {
      unFlattenedNodes.push(node);
      unFlattenNode(node, nodes);
    }
  });

  return unFlattenedNodes;
};

/**
 * Moves a node to a new parent
 * @param {Object} node Node being moved
 * @param {Object} newParentNode new Parent Node
 */
const moveNode = (node, newParentNode) => {
  node.depth = newParentNode.depth + 1;
  node.parentNode = newParentNode;
};

/**
 * Find a node in the tree
 * @param {String | Number} nodeId Id of node to find
 * @param {Array} Array of nodes to look in
 */
const findNode = (nodeId, nodes) => {
  for (var i = 0; i < nodes.length; i++) {
    var _node = nodes[i];

    if (_node.id == nodeId) {
      return _node;
    }

    if (_node.children) {
      let foundNode = findNode(nodeId, _node.children);

      if (foundNode) {
        return foundNode;
      }
    }
  }
};

export default {
  moveNode,
  flattenNodes,
  unFlattenNodes,
  findNode
};
