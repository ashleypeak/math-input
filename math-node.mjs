/**
 * Virtual class, don't instantiate.
 *
 * MathNode and its children represent the equation as it appears in the
 * input field with only enough structure to render (e.g. it has a Division
 * node to render numerator/denominator, but doesn't distinguish between other
 * operators).
 *
 * Outputs semantic MathML through function ExpressionNode.value()
 */
class MathNode {
    /**
     * @constructs
     */
    constructor() {
        this._parent = null;
    }


    /** GETTERS AND SETTERS */

    /**
     * Get the parent node
     * 
     * @return {MathNode} The parent of the current node
     */
    get parent() {
        return this._parent;
    }

    /**
     * Set parent node
     * 
     * @param  {MathNode} parent The new parent node of this element
     */
    set parent(parent) {
        this._parent = parent;
    }

    /**
     * Get the DOM node of the MathNode. MathNodes maintain their own
     * DOM elements
     *
     * @return {HTMLElement} The DOM element representing the node value
     */
    get element() {
        return this._element;
    }

    /**
     * Get the element to the left of the current node. This may not be a
     * sibling - it should be whatever element a user would expect a left
     * keypress to move the cursor to.
     *
     * If the cursor can't move left, return self.
     *
     * @return {MathNode} The node to the left of this node
     */
     get nodeLeft() {
        if(this.parent !== null) {
            return this.parent.childLeft(this);
        } else {
            return this;
        }
     }

    /**
     * Get the element to the right of the current node.
     *
     * @see  nodeLeft()
     * @return {MathNode} The node to the right of this node
     */
     get nodeRight() {
        if(this.parent !== null) {
            return this.parent.childRight(this);
        } else {
            return this;
        }
     }
    

    /** MISCELLANEOUS FUNCTIONS */

    /**
     * Insert the node `node` after `this`.
     * 
     * @param  {MathNode} node The node to be inserted
     */
    insertAfter(node) {
        if(this.parent === null) {
            throw new Error("Cursor node has no parent.")
        }

        this.parent.childInsertAfter(this, node);
    }

    /**
     * Toggle the cursor class. Used by MathInput.constuctor to flash cursor.
     * 
     * @param  {Boolean} force If true, show cursor; if false, hide; if null, togggle
     */
    toggleCursor(force) {
        this._element.classList.toggle('cursor', force)
    }


    /** EXPORTED STATIC FUNCTIONS */

    /**
     * Take a character (from input, usually) and determine based on value
     * what MathNode class to return.
     * 
     * @param  {String} char The character to create a MathNode from
     * @return {MathNode} The resultant MathNode
     */
    static buildFromCharacter(char) {
        if(/^[0-9.+\-*]$/.test(char)) {
            return new AtomNode(char);
        } else {
            throw new Error('Not yet implemented: ' + char);
        }
    }
}


/**
 * ExpressionNode contains any string of nodes which doesn't need to
 * be distinguished for display purposes. Divisions, Exponents etc will have
 * other MathNode types, but anything else will be stored in the array
 * this._nodes.
 *
 * The numerator and denominator of a division, exponent of a power etc. are
 * all ExpressionNodes, as is the root node of the MathInput.
 */
class ExpressionNode extends MathNode {
    /**
     * @constructs
     */
    constructor() {
        super();

        this._nodes = new Array();
        this._element = document.createElement('span');

        //every expression starts with a span, serves as the cursor location before
        //the first element
        //has to be inserted manually because there is no child in a new ExpressionNode
        //to insert it after
        var startNode = new StartNode();
        startNode.parent = this;
        this._nodes.push(startNode);
        this._element.appendChild(startNode.element);
    }


    /** GETTERS AND SETTERS */

    /**
     * Returns a MathML string representing the expression in the field. Used
     * to populate the 'value' attribute.
     * 
     * @return {String} The MathML string representing this element
     */
    get value() {
        var precis = this._nodes.reduce((acc, node) => acc + node.precis, '');
        return this._parse(precis);
    }

    /**
     * Given a precis of `_nodes` (or some subset thereof), return a MathML
     * string representing them. Recursive. `offset` keeps track of where the
     * subset is in `_nodes` to allow for referencing the nodes themselves.
     *
     * @see  UnitNode.precis()
     * @param  {String} precis A precis of a set of nodes
     * @param  {Number} offset The offset between start of `precis` and start of `_nodes`
     * @return {String}        A MathML string
     */
    _parse(precis, offset=0) {
        //matches last +/-. Needs to be done in reverse order: consider a-b+c
        var match = precis.match(/[+\-](?!.*[+\-])/);
        if(match !== null) {
            return this._parse_operator(precis, offset, match.index);
        }

        var match = precis.match(/\*/);
        if(match !== null) {
            return this._parse_operator(precis, offset, match.index);
        }

        if(/^[0-9]+(\.[0-9]+)?$/.test(precis)) {
            return '<cn>' + precis + '</cn>';
        } else {
            throw new Error('Cannot parse input.');
        }
    }

    /**
     * Having found an operator to parse, split the precis in two around it,
     * process both sides, then return the resultant MathML string.
     * 
     * @param  {String} precis      A precis of a set of nodes
     * @param  {Number} offset      The offset between start of `precis` and start of `_nodes`
     * @param  {Number} operatorPos The position of the found operator
     * @return {String}             A MathML string
     */
    _parse_operator(precis, offset, operatorPos) {
        var op = precis[operatorPos];
        var lhs = this._parse(
            precis.substring(0, operatorPos),
            offset);
        var rhs = this._parse(
            precis.substring(operatorPos + 1),
            offset + operatorPos + 1);

        var op_tags = {'+': '<plus/>', '-': '<minus/>', '*': '<times/>'};

        return '<apply>' + op_tags[op] + lhs + rhs + '</apply>';
    }

    /**
     * Get the array of child nodes
     *
     * @return {Array} Array of child nodes
     */
    get nodes() {
        return this._nodes;
    }


    /** MISCELLANEOUS */

    /**
     * Insert a node `newNode` after the node `child`
     * 
     * @param  {MathNode} child   The child node after which newNode is being inserted
     * @param  {MathNode} newNode The node being inserted
     */
    childInsertAfter(child, newNode) {
        var index = this.nodes.findIndex((el) => el == child);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        newNode.parent = this;

        //use internal names because we're modifying
        this._nodes.splice(index+1, 0, newNode);

        var nextSibling = child.element.nextSibling;
        if(nextSibling !== null) {
            this._element.insertBefore(newNode.element, nextSibling);
        } else {
            this._element.appendChild(newNode.element);
        }
    }

    /**
     * If it exists, return the element left of `node` in this.nodes. If not,
     * continue searching up the tree. Finding nothing, return `node` i.e.
     * don't move the cursor
     * 
     * @param  {MathNode} node The node whose neighbour is being searched for
     * @return {MathNode}      The node to the left of `node`
     */
    childLeft(node) {
        var index = this.nodes.findIndex((el) => el == node);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        if(index !== 0) {
            return this.nodes[index - 1];
        } else {
            //search up the tree, when there is one
            return node;
        }
    }

    /**
     * If it exists, return the element right of `node` in this.nodes. If not,
     * continue searching up the tree. Finding nothing, return `node` i.e.
     * don't move the cursor
     * 
     * @param  {MathNode} node The node whose neighbour is being searched for
     * @return {MathNode}      The node to the right of `node`
     */
    childRight(node) {
        var index = this.nodes.findIndex((el) => el == node);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        if(index+1 < this.nodes.length) {
            return this.nodes[index + 1];
        } else {
            return node;
        }
    }

    /**
     * Delete `node` from `_nodes` and remove from `_element`
     * 
     * @param  {MathNode} node The node to be deleted
     */
    childDelete(node) {
        var index = this.nodes.findIndex((el) => el == node);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        this._nodes.splice(index, 1);
        this._element.removeChild(node.element);
    }
}


/**
 * Virtual class, don't instantiate.
 *
 * A UnitNode is every element that isn't an ExpressionNode. Unlike
 * ExpressionNodes which are a formless string of nodes, UnitNodes are
 * unitary: they can be thought of as a single object whose internal structure
 * is largely irrelevant to their parents.
 */
class UnitNode extends MathNode {
    /**
     * @constructs
     */
    constructor() {
        super();
    }

    /**
     * Get a single character representation of a UnitNode to allow for parsing.
     * AtomNodes return their character, ExpressionNodes return nothing,
     * everything else returns '*'.
     *
     * @abstract
     * @return {String} The string to go in the value attribute
     */
    get precis() {
        throw new Error('get precis() must be defined.');
    }

    /**
     * Delete this node
     */
    delete() {
        this.parent.childDelete(this);
    }
}


/**
 * A StartNode is present as the first node of every ExpressionNode and nowhere
 * else. Its purpose is to display the cursor if it is left of every other
 * element in the ExpressionNode, and to provide an anchor to click on /
 * interact with an empty expression.
 */
class StartNode extends UnitNode {
    /**
     * @constructs
     */
    constructor() {
        super();

        this._element = document.createElement('span');
        this._element.className = 'empty';
    }

    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return '';
    }
}


class AtomNode extends UnitNode {
    /**
     * @constructs
     */
    constructor(char) {
        super();
        this._char = char;

        this._element = document.createElement('span');
        this._element.innerHTML = this.displayChar;
    }


    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return this._char;
    }


    /**
     * Returns the character which should be displayed in the input field.
     * Usually the same as `_char`, but not always.
     * 
     * @return {String} The character to be displayed
     */
    get displayChar() {
        if(this._char == '*') {
            return '&times;';
        } else {
            return this._char;
        }
    }
}

export {ExpressionNode, MathNode};