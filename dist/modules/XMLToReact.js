import { DOMParser } from 'xmldom';
import { createElement } from 'react';

const ERR_INVALID_XML = 'XMLToReact: Unable to parse invalid XML input. Please input valid XML.';

const throwError = m => {
  throw new Error(m);
};

const parser = new DOMParser({
  errorHandler: throwError,
  fatalError: throwError,
  warning: throwError
});
/**
 * Parse an xml string
 *
 * @param {string} xml - xml to convert
 * @returns {object} - xml tree
 * @public
 */

function parse(xml) {
  if (typeof xml !== 'string') {
    return null;
  }

  try {
    return parser.parseFromString(xml, 'text/xml');
  } catch (e) {
    console.warn(ERR_INVALID_XML); // eslint-disable-line no-console
  }

  return null;
}

/**
 * Validates a given converters input
 *
 * @param {object} converters - an object, with functions as values
 * @returns {boolean} - true when converters is valid, and false when it is invalid
 * @private
 */

function validateConverters(converters) {
  if (typeof converters !== 'object' || !converters) {
    return false;
  }

  const keys = Object.keys(converters);
  const isEmpty = !keys.length;

  if (isEmpty) {
    return false;
  }

  const isFunction = key => typeof converters[key] === 'function';

  return keys.every(isFunction);
}
/**
 * Gets map of XML node attributes of a given node.
 *
 * @param {object} node - XML node
 * @returns {Array} - list of children XML nodes
 * @private
 */

function getAttributes(node) {
  if (!node) {
    return {};
  }

  const {
    attributes
  } = node;

  if (!attributes || !attributes.length) {
    return {};
  }

  const result = {};
  Array.from(attributes).forEach(({
    name,
    value
  }) => {
    result[name] = value;
  });
  return result;
}
/**
 * Gets list of XML nodes which are the child of a given node.
 *
 * @param {object} node - XML node
 * @returns {Array} - list of children XML nodes
 * @private
 */

function getChildren(node) {
  if (!node) {
    return [];
  }

  const {
    childNodes: children
  } = node;

  if (!children) {
    return [];
  }

  return children.length ? Array.from(children) : [];
}
/**
 * Visit XML nodes recursively and convert into React elements.
 *
 * @param {object} node - xml node
 * @param {number} index - Node index to be used as the key
 * @param {object} converters - Map of XML tag names to component generating functions
 * @param {object} [data] - Optional data to be passed to coverters
 * @returns {object} React element
 * @private
 */

function visitNode(node, index, converters, data) {
  if (!node) {
    return null;
  }

  const {
    tagName,
    nodeType
  } = node; // if this is a text node

  if (nodeType === 3) {
    return node.nodeValue;
  }

  if (!tagName) {
    return null;
  }

  const converter = converters[tagName];

  if (typeof converter !== 'function') {
    return null;
  }

  const attributes = getAttributes(node);
  const {
    type,
    props
  } = converter(attributes, data);
  const newProps = Object.assign({}, {
    key: index
  }, props);
  const children = getChildren(node);

  const visitChildren = (child, childIndex) => visitNode(child, childIndex, converters, data);

  const childElements = children.map(visitChildren);
  return createElement(type, newProps, ...childElements);
}

const ERR_INVALID_CONVERTERS = 'XMLToReact: Invalid value for converter map argument. Please use an object with functions as values.';
/**
 * Class representing an XML to React transformer.
 *
 * @public
 */

class XMLToReact {
  /**
   * Create a XML to React converter.
   *
   * @param {object} converters - a mapping of tag names to a function
   *                              returning the desired mapping.
   * @public
   */
  constructor(converters) {
    const isValid = validateConverters(converters);

    if (!isValid) {
      throw new Error(ERR_INVALID_CONVERTERS);
    }

    this.converters = converters;
  }
  /**
   * Create a XML to React converter.
   *
   * @param {string} xml - xml to convert
   * @param {object} [data] - optional data to assist in conversion
   * @returns {object} - React element tree
   * @public
   */


  convert(xml, data) {
    if (typeof xml !== 'string') {
      return null;
    }

    const tree = parse(xml);

    if (!tree) {
      return null;
    }

    return visitNode(tree.documentElement, 0, this.converters, data);
  }

}

export default XMLToReact;
