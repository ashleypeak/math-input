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
    constructor(parent=null) {
        this._parent = parent;
        this._element = document.createElement('div');
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
    

    /** MISCELLANEOUS FUNCTIONS */

     /**
      * Get the node left of `node`, either among this node's children or else
      * by scanning further up the node tree. Specific behaviour depends on
      * node type.
      *
      * @abstract
      * @param  {MathNode} node        The node whose left neighbor we want
      * @param  {MathNode} defaultNode The node which originally called nodeLeft
      * @return {MathNode}             The node to the left
      */
     childLeft(node, defaultNode) {
        throw new Error("You must define childLeft().")
     }

     /**
      * Get the node right of `node`
      *
      * @see  childLeft
      * @abstract
      */
     childRight(node, defaultNode) {
        throw new Error("You must define childRight().")
     }

     /**
      * Get the node above `node`
      *
      * @see  childLeft
      * @abstract
      */
     childUp(node, defaultNode) {
        throw new Error("You must define childUp().")
     }

     /**
      * Get the node below `node`
      *
      * @see  childLeft
      * @abstract
      */
     childDown(node, defaultNode) {
        throw new Error("You must define childDown().")
     }

    /**
     * Insert the node `node` after `this`.
     * 
     * @param  {MathNode} node The node to be inserted
     */
    insertAfter(node) {
        if(this.parent === null) {
            throw new Error("Cursor node has no parent.")
        }

        //if the node has a parent, unlink it from its parent node
        if(node.parent !== null) {
            node.delete();
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
        if(/^[a-zA-Z0-9.+\-*]$/.test(char)) {
            return new AtomNode(char);
        } else if(/^\/$/.test(char)) {
            return new DivisionNode();
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
    constructor(parent=null) {
        super(parent);

        this._nodes = new Array();
        this._element.classList.add('expression');

        //every expression starts with a span, serves as the cursor location before
        //the first element
        //has to be inserted manually because there is no child in a new ExpressionNode
        //to insert it after
        var startNode = new StartNode(this);
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
     * Get the array of child nodes
     *
     * @return {Array} Array of child nodes
     */
    get nodes() {
        return this._nodes;
    }

    /**
     * Get the StartNode - the first node of the expression
     * 
     * @return {MathNode} The StartNode, first of the child nodes
     */
    get startNode() {
        return this.nodes[0];
    }

    /**
     * Get the last (rightmost) node amonst expression's children.
     * 
     * @return {MathNode} The rightmost node in `this.nodes`
     */
    get endNode() {
        return this.nodes[this.nodes.length - 1];
    }


    /** MISCELLANEOUS */

    /**
     * Given a precis of `_nodes` (or some subset thereof), return a MathML
     * string representing them. Recursive. `offset` keeps track of where the
     * subset is in `_nodes` to allow for referencing the nodes themselves.
     *
     * `offset` starts at 1 to accomodate the StartNode, which isn't
     * represented in the precis
     *
     * @see  UnitNode.precis()
     * @param  {String} precis A precis of a set of nodes
     * @param  {Number} offset The offset between `precis` and `_nodes`
     * @return {String}        A MathML string
     */
    _parse(precis, offset=1) {
        //TODO mask brackets/absolute

        //matches last +/-. Needs to be done in reverse order: consider a-b+c
        var match = precis.match(/[+\-](?!.*[+\-])/);
        if(match !== null) {
            return this._parseOperator(precis, offset, match.index);
        }

        //match a times symbol
        var match = precis.match(/\*/);
        if(match !== null) {
            return this._parseOperator(precis, offset, match.index);
        }

        //if it starts with a number
        if(/^[0-9]/.test(precis)) {
            var term = precis.match(/^[0-9]+(\.[0-9]+)?/)[0];
            var mathml = '<cn>' + term + '</cn>';

            return this._termOrImplicitTimes(term, mathml, precis, offset)
        }

        //if it starts with a letter
        if(/^[a-zA-Z]/.test(precis)) {
            //TODO add support for multicharacter terms like `sin`
            var term = precis[0];
            var mathml = '<ci>' + term + '</ci>';

            return this._termOrImplicitTimes(term, mathml, precis, offset)
        }

        //if it starts with a % i.e. is a non-Atom UnitNode
        if(/^%/.test(precis)) {
            var term = precis[0];
            var mathml = this.nodes[offset].value;

            return this._termOrImplicitTimes(term, mathml, precis, offset)
        }

        //if no match has been found
        throw new Error('Cannot parse input.');
    }

    /**
     * Utility function to save repitition. Given a `term`, a matched section
     * at the start of a precis:
     *  - if it comprises the entire precis, return it's calculated `mathml`
     *  - otherwise, parse the rest and multiply them together
     *  
     * @param  {String} term   The portion of the precis identified as a term
     * @param  {String} mathml The mathml rendering of `term`
     * @param  {String} precis The full precis being parsed
     * @param  {Number} offset The precis' offset within the expression
     * @return {String}        The resultant mathml term
     */
    _termOrImplicitTimes(term, mathml, precis, offset) {
        if(term.length == precis.length) {
            return mathml;
        } else {
            var newOffset = offset + term.length;
            var rest = this._parse(precis.substring(term.length), newOffset);

            return '<apply><times/>' + mathml + rest + '</apply>';
        }
    }

    /**
     * Having found an operator to parse, split the precis in two around it,
     * process both sides, then return the resultant MathML string.
     * 
     * @param  {String} precis      A precis of a set of nodes
     * @param  {Number} offset      The offset between `precis` and `_nodes`
     * @param  {Number} operatorPos The position of the found operator
     * @return {String}             A MathML string
     */
    _parseOperator(precis, offset, operatorPos) {
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
     * continue searching up the tree. Finding nothing, return `defaultNode`,
     * which was the original node on which moveLeft() was called i.e. don't
     * move the cursor.
     * 
     * @param  {MathNode} node The node whose neighbour is being searched for
     * @param  {MathNode} defaultNode The node returned if nothing else is
     * @return {MathNode}      The node to the left of `node`
     */
    childLeft(node, defaultNode) {
        var index = this.nodes.findIndex((el) => el == node);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        if(index !== 0) {
            return this.nodes[index - 1].cursorNodeFromRight;
        } else if(this.parent !== null) {
            return this.parent.childLeft(this, defaultNode);
        } else {
            return defaultNode;
        }
    }

    /**
     * Return the child right of `node`.
     *
     * @see  childLeft
     */
    childRight(node, defaultNode) {
        var index = this.nodes.findIndex((el) => el == node);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        if(index+1 < this.nodes.length) {
            return this.nodes[index + 1].cursorNodeFromLeft;
        } else if(this.parent !== null) {
            return this.parent.childRight(this, defaultNode);
        } else {
            return defaultNode;
        }
    }

    /**
     * Return the child above `node`. All nodes within an expression are the
     * same height, so pass it up to parent.
     *
     * @see  childLeft
     */
    childUp(node, defaultNode) {
        if(this.parent !== null) {
            return this.parent.childUp(this, defaultNode);
        } else {
            return defaultNode;
        }
    }

    /**
     * Return the child below `node`. All nodes within an expression are the
     * same height, so pass it up to parent.
     *
     * @see  childLeft
     */
    childDown(node, defaultNode) {
        if(this.parent !== null) {
            return this.parent.childDown(this, defaultNode);
        } else {
            return defaultNode;
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
    constructor(parent=null) {
        super(parent);
        this._element.classList.add('unit');
    }

    /**
     * Get a single character representation of a UnitNode to allow for parsing.
     * AtomNodes return their character, ExpressionNodes return nothing,
     * everything else returns '%', indicating that it will provide its own
     * value using UnitNode.value
     *
     * @abstract
     * @return {String} The string to go in the value attribute
     */
    get precis() {
        throw new Error('get precis() must be defined.');
    }

    /**
     * If the cursor is entering this node from the left, where should it go?
     * Default to returning the node itself, but if node has substructure may
     * want something else.
     * 
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromLeft() {
        return this;
    }

    /**
     * If the cursor is entering this node from the right, where should it go?
     * Default to returning the node itself, but if node has substructure may
     * want something else.
     * 
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromRight() {
        return this;
    }

    /**
     * If the cursor is entering this node from the above, where should it go?
     * Default to returning the node itself, but if node has substructure may
     * want something else.
     * 
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromAbove() {
        return this;
    }

    /**
     * If the cursor is entering this node from the below, where should it go?
     * Default to returning the node itself, but if node has substructure may
     * want something else.
     * 
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromBelow() {
        return this;
    }

    /**
     * Get the previous element in the parent Expression. Unlike nodeLeft, this
     * will not return a node outside the expression.
     * Returns null if `this` is first node.
     * 
     * @return {MathNode} The previous node
     */
    get previousSibling() {
        var index = this.parent.nodes.findIndex((el) => el == this);

        if(index == -1) {
            throw new Error("Node not found.");
        }

        if(index == 0) {
            return null;
        }

        return this.parent.nodes[index - 1];
    }


    /** MISCELLANEOUS FUNCTIONS */

    /**
     * Get the element to the left of the current node. This may not be a
     * sibling - it should be whatever element a user would expect a left
     * keypress to move the cursor to.
     *
     * If the cursor can't move left, return defaultNode. Since childLeft
     * bubbles up through the element tree, need to keep track of which node
     * nodeLeft was originall called on.
     *
     * @param {MathNode} defaultNode The node to return if no left node
     * @return {MathNode} The node to the left of this node
     */
     nodeLeft(defaultNode) {
        if(typeof defaultNode == 'undefined')
            defaultNode = this;

        return this.parent.childLeft(this, defaultNode);
     }

    /**
     * Get the element to the right of the current node.
     *
     * @see  nodeLeft()
     * @return {MathNode} The node to the right of this node
     */
     nodeRight(defaultNode) {
        if(typeof defaultNode == 'undefined')
            defaultNode = this;
        
        return this.parent.childRight(this, defaultNode);
     }

    /**
     * Get the element above the current node.
     *
     * @see  nodeLeft()
     * @return {MathNode} The node above this node
     */
     nodeUp(defaultNode) {
        if(typeof defaultNode == 'undefined')
            defaultNode = this;

        return this.parent.childUp(this, defaultNode);
     }

    /**
     * Get the element below the current node.
     *
     * @see  nodeLeft()
     * @return {MathNode} The node below this node
     */
     nodeDown(defaultNode) {
        if(typeof defaultNode == 'undefined')
            defaultNode = this;

        return this.parent.childDown(this, defaultNode);
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
    constructor(parent=null) {
        super(parent);
        this._element.classList.add('start');
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
    constructor(char, parent=null) {
        super(parent);
        this._char = char;
        this._element.classList.add('atom');
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


class DivisionNode extends UnitNode {
    /**
     * @constructs
     */
    constructor(parent=null) {
        super(parent);
        this._element.classList.add('division');

        this._numerator = new ExpressionNode(this);
        this._numerator.element.classList.add('numerator');

        this._denominator = new ExpressionNode(this);
        this._denominator.element.classList.add('denominator');

        this._element.appendChild(this._numerator.element);
        this._element.appendChild(this._denominator.element);
    }

    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return '%';
    }

    /**
     * Get numerator
     * @return {MathNode} Numerator
     */
    get numerator() {
        return this._numerator;
    }

    /**
     * Get denominator
     * @return {MathNode} Denominator
     */
    get denominator() {
        return this._denominator;
    }

    /**
     * If the cursor's coming in from the left, where should it go?
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromLeft() {
        return this.numerator.startNode;
    }

    get value() {
        return '<apply><divide/>' + this.numerator.value + this.denominator.value + '</apply>';
    }

    /**
     * When creating a DivisionNode, should any previously typed elements be
     * moved into the numerator? The decision is largely arbitrary, just trying
     * to match expected behaviour i.e. if I type '1/2' I expect to get a
     * fraction of one on two.
     *
     * Returns true if elements are collected, false otherwise. Used to
     * determine where to put the cursor.
     * 
     * @return {Boolean} Were any elements added to numerator?
     */
    collectNumerator() {
        var precis = '';
        var node = this.previousSibling;
        do {
            precis = node.precis + precis;
        } while(node = node.previousSibling)

        //match everything that should move to numerator, fairly arbitrary
        //TODO when I intoduce brackets, they need to be taken into account
        var match = precis.match(/[a-zA-Z0-9]+$/);
        if(match !== null) {
            for(var i = 0; i < match[0].length; i++) {
                this.numerator.startNode.insertAfter(this.previousSibling);
            }

            return true;
        } else {
            return false;
        }
    }

    /**
     * When moving left from a DivisionNode (i.e. cursor is right of the
     * division), move into the end of the numerator rather than to the
     * sibling node to the left.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
     nodeLeft(defaultNode) {
        return this.numerator.endNode;
     }

    /**
     * Called from either the numerator or denominator, return node to the
     * left. In both cases, return the node left of DivisionNode in parent.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childLeft(node, defaultNode) {
        return this.parent.childLeft(this, defaultNode);
    }

    /**
     * Called from either the numerator or denominator, return node to the
     * right. In both cases, return the DivisionNode itself.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childRight(node, defaultNode) {
        return this;
    }

    /**
     * From denominator, provide numerator. Otherwise pass it up the chain.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childUp(node, defaultNode) {
        if(node == this.denominator) {
            return this.numerator.startNode.cursorNodeFromBelow;
        } else {
            return this.parent.childUp(this, defaultNode);
        }
    }

    /**
     * From numerator, provide denominator. Otherwise pass it up the chain.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childDown(node, defaultNode) {
        if(node == this.numerator) {
            return this.denominator.startNode.cursorNodeFromAbove;
        } else {
            return this.parent.childDown(this, defaultNode);
        }
    }
}

export {ExpressionNode, MathNode};