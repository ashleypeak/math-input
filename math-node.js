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

    /**
     * Get the height of `_element`
     *
     * @abstract
     * @return {Number} Element height
     */
    get height() {
        throw new Error('You must define height()');
    }

    /**
     * Get the current cursor node. Shouldn't need overriding
     * 
     * @return {MathNode} The current cursor node
     */
    get cursor() {
        if(this.parent === null) {
            return this._cursor;
        } else {
            throw new Error('Node is not a root node, so has no cursor.')
        }
    }

    /**
     * Set the current cursor node. Shouldn't need overriding
     * 
     * @param  {MathNode} node The new cursor node
     */
    set cursor(node) {
        if(this.parent === null) {
            var oldCursor = this._cursor;
            this._cursor = node;
            node.element.classList.add('cursor');

            if(typeof oldCursor !== 'undefined') {
                oldCursor.toggleCursor(false);

                if(oldCursor !== node) {
                    oldCursor.element.classList.remove('cursor');
                }

                //this is kind of hacky, but I don't want the cursor on when
                //the element is unfocused, and the only time the cursor is
                //set while unfocused is on creation, and the only time
                //oldCursor is undefined is on creation. So it works.
                this._cursor.toggleCursor(true);
            }
        } else {
            this.parent.cursor = node;
        }
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
     * @param  {Boolean} force override toggle, see classList.toggle docs
     */
    toggleCursor(force) {
        this._element.classList.toggle('cursor-visible', force)
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
        } else if(/^[()]$/.test(char)) {
            return new BracketNode(char);
        } else if(/^\|$/.test(char)) {
            return new AbsoluteNode();
        } else if(/^\^$/.test(char)) {
            return new ExponentNode();
        } else {
            throw new Error('Not yet implemented: ' + char);
        }
    }

    static buildFromName(name) {
        if(name == 'sqrt') {
            return new SquareRootNode();
        } else {
            throw new Error('Not implemented: ' + name);
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
     * @override
     * @return {Number} Element height
     */
    get height() {
        return this.nodes.reduce((acc, node) => Math.max(acc, node.height), 0);
    }

    /**
     * Get a precis of the expression, a string with each node represented by
     * a character
     * 
     * @return {String} A summary of the expression's nodes
     */
    get precis() {
        return this._nodes.reduce((acc, node) => acc + node.precis, '');
    }

    /**
     * Returns a MathML string representing the expression in the field. Used
     * to populate the 'value' attribute.
     * 
     * @return {String} The MathML string representing this element
     */
    get value() {
        return this._parse(this.precis);
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
     * When a new element has been inserted, all nodes need to be redrawn to
     * line up properly. Get the dimensions of all child nodes, then get them
     * to redraw themselves on that information.
     * Higher-level Expressions need to be redrawn as well, but not lower-level
     * ones.
     */
    redraw() {
        var nodeParams = this.nodes.map((el) => ({height: el.height, center: el.center}));

        this.nodes.forEach(function(node) {
            node.redraw(nodeParams);
        });

        //Redraw the grandparent expression as well.
        //Expression parents are Units, all Units have a parent Expression, so
        //if this has a parent, it has a grandparent.
        if(this.parent !== null)
            this.parent.parent.redraw();
    }

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
    _parse(precis, offset=0) {
        var masked = BracketNode.mask(precis);
        var masked = AbsoluteNode.mask(masked);

        //matches last +/-. Needs to be done in reverse order: consider a-b+c
        var match = masked.match(/[+\-](?!.*[+\-])/);
        if(match !== null) {
            return this._parseOperator(precis, offset, match.index);
        }

        //match a times symbol
        var match = masked.match(/\*/);
        if(match !== null) {
            return this._parseOperator(precis, offset, match.index);
        }

        //if it starts with an _ i.e. a StartNode
        if(/^_/.test(precis)) {
            return this._parse(precis.slice(1), offset+1)
        }

        //if it starts with a number
        if(/^[0-9]/.test(precis)) {
            var term = precis.match(/^[0-9]+(\.[0-9]+)?/)[0];
            var mathml = '<cn>' + term + '</cn>';

            return this._parseTerm(term, mathml, precis, offset);
        }

        //if it starts with a letter
        if(/^[a-zA-Z]/.test(precis)) {
            //TODO add support for multicharacter terms like `sin`
            var term = precis[0];
            var mathml = '<ci>' + term + '</ci>';

            return this._parseTerm(term, mathml, precis, offset);
        }

        //if it starts with a % i.e. is a non-Atom, non-Exponent UnitNode
        if(/^%/.test(precis)) {
            var term = precis[0];
            var mathml = this.nodes[offset].value;

            return this._parseTerm(term, mathml, precis, offset);
        }

        //if it starts with a parenthesis
        if(/^\(/.test(precis)) {
            //can't find end using `masked` because (1)(2) would return 5 not 2
            var end = BracketNode.findMatchingParen(precis, 0);

            if(end === null) {
                throw new Error('Unmatched parenthesis.');
            }

            var term = precis.slice(0, end + 1);
            var mathml = this._parse(term.slice(1, -1), offset + 1);

            return this._parseTerm(term, mathml, precis, offset);
        }

        //if it starts with a pipe
        if(/^\|/.test(precis)) {
            var end = precis.indexOf('|', 1);

            if(end === -1) {
                throw new Error('Unmatched pipe.');
            }

            var term = precis.slice(0, end + 1);
            var innerMathml = this._parse(term.slice(1, -1), offset + 1);
            var mathml = '<apply><abs/>' + innerMathml + '</apply>';

            return this._parseTerm(term, mathml, precis, offset);
        }

        //if no match has been found
        throw new Error('Cannot parse input.');
    }

    /**
     * Given a `term`, a matched section at the start of a precis:
     *  - if it comprises the entire precis, return it's calculated `mathml`
     *  - otherwise, parse the rest and multiply them together
     *  
     * @param  {String} term   The portion of the precis identified as a term
     * @param  {String} mathml The mathml rendering of `term`
     * @param  {String} precis The full precis being parsed
     * @param  {Number} offset The precis' offset within the expression
     * @return {String}        The resultant mathml term
     */
    _parseTerm(term, mathml, precis, offset) {
        if(term.length == precis.length) {
            return mathml;
        } else {
            if(precis[term.length] === '^') {
                var exponent_mathml = this.nodes[offset+term.length].value;
                mathml = '<apply><power/>' + mathml + exponent_mathml +  '</apply>';

                //fudge so that the rest of the function will parse starting
                //after the ExponentNode.
                term += '^';

                if(term.length == precis.length) {
                    return mathml;
                }
            }

            var newOffset = offset + term.length;
            var rest = this._parse(precis.slice(term.length), newOffset);

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
            precis.slice(0, operatorPos),
            offset);
        var rhs = this._parse(
            precis.slice(operatorPos + 1),
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
        var index = this.indexOf(child);

        newNode.parent = this;

        //use internal names because we're modifying
        this._nodes.splice(index+1, 0, newNode);

        var nextSibling = child.element.nextSibling;
        if(nextSibling !== null) {
            this._element.insertBefore(newNode.element, nextSibling);
        } else {
            this._element.appendChild(newNode.element);
        }

        this.redraw();
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
        var index = this.indexOf(node);

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
        var index = this.indexOf(node);

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
        var index = this.indexOf(node);

        this._nodes.splice(index, 1);
        this._element.removeChild(node.element);

        this.redraw();
    }

    indexOf(node) {
        var index = this.nodes.findIndex((el) => el == node);

        if(index == -1) {
            throw new Error('Node not found.');
        }

        return index;
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

        var self = this;
        this._element.addEventListener('click', function(e) {
            //setting cursor bubbles up to root node, see `set cursor`
            self.cursor = self;
            e.stopPropagation();
        });
    }

    /**
     * @override
     * @return {Number} Element height
     */
    get height() {
        //TODO remove magic number
        if(this.parent.parent !== null && (this.parent.parent instanceof ExponentNode)) {
            return 10;
        } else {
            return 17;
        }
    }

    /**
     * Get the center align position of `_element`
     *
     * @return {Number} Element center
     */
    get center() {
        //TODO remove magic number
        return 8.5;
    }

    /**
     * Get a single character representation of a UnitNode to allow for parsing.
     * AtomNodes return their character, StartNode returns '_', ExponentNode
     * returns '^', everything else returns '%', indicating that it will
     * provide its own value using UnitNode.value
     * (ExponentNode has a different term because it can't be processed as a
     * unit - it needs to know what term preceded it.)
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
        var index = this.parent.indexOf(this);

        if(index == 0) {
            return null;
        }

        return this.parent.nodes[index - 1];
    }


    /** MISCELLANEOUS FUNCTIONS */

    /**
     * Given `nodeParams`, dimensions of all other nodes in the expression,
     * redraw this node to line up.
     * 
     * @param  {Array} nodeParams The dimensions of all nodes in the element;
     */
    redraw(nodeParams) {
        var maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        var diff = Math.floor(maxCenter - this.center);
        this._element.style.marginTop = diff.toString() + 'px';
    }

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
     * Since most elements are only on one level, default behaviour is to pass
     * it up the chain (till it hits a division, probably.)
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childUp(node, defaultNode) {
        return this.parent.childUp(this, defaultNode);
    }

    /**
     * Since most elements are only on one level, default behaviour is to pass
     * it up the chain (till it hits a division, probably.)
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childDown(node, defaultNode) {
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
        return '_';
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
     * @return {Number} Element height
     */
    get height() {
        if(this.parent.parent !== null && (this.parent.parent instanceof ExponentNode)) {
            return (this.numerator.height/1.7) + (this.denominator.height/1.7) + 5;
        } else {
            return this.numerator.height + this.denominator.height + 5;
        }
    }

    /**
     * @override
     * @return {Number} Element center
     */
    get center() {
        return this.numerator.height + 3;
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

    /**
     * Returns a MathML string representing the DivisionNode.
     * 
     * @return {String} The MathML string representing this element
     */
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
        var match = precis.match(/[a-zA-Z0-9]+$/);
        if(match !== null) {
            for(var i = 0; i < match[0].length; i++) {
                this.numerator.startNode.insertAfter(this.previousSibling);
            }

            return true;
        }

        match = precis.match(/\)$/);
        if(match !== null) {
            var start = BracketNode.findMatchingParen(precis, precis.length-1);
            if(start === null) {
                start = 0;
            }

            var count = precis.length - start;
            for(var i = 0; i < count; i++) {
                this.numerator.startNode.insertAfter(this.previousSibling);
            }

            return true;
        }

        return false;
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


class BracketNode extends UnitNode {
    /**
     * @constructs
     */
    constructor(char, parent=null) {
        super(parent);
        this._char = char;
        this._element.classList.add('parenthesis');

        if(char === '(') {
            this._element.classList.add('parenthesis-left');
        } else if(char === ')') {
            this._element.classList.add('parenthesis-right');
        }
    }

    /**
     * Given `nodeParams`, dimensions of all other nodes in the expression,
     * redraw this node to line up.
     * 
     * @param  {Array} nodeParams The dimensions of all nodes in the element;
     */
    redraw(nodeParams) {
        var precis = this.parent.precis;
        var start = this.parent.indexOf(this);

        var end = BracketNode.findMatchingParen(precis, start);
        if(end === null) {
            //This -1 is confusing, but the start and end are supposed to be
            //the positions of the brackets. If there's no starting bracket,
            //we imagine it just before the string, at position -1.
            //Not to be confused with indexOf()'s -1 not present or slice()'s
            //last element.
            end = this._char == '(' ? precis.length : -1;
        }

        if(start > end) {
            [start, end] = [end, start];
        }

        var innerParams = nodeParams.slice(start+1, end);
        //note this.height refers to default height, not css height
        var maxInnerHeight = innerParams.reduce((acc, node) => Math.max(acc, node.height), this.height)

        this._element.style.height = maxInnerHeight.toString() + 'px';
        this._element.style.width = (maxInnerHeight / 8).toString() + 'px';

        //because brackets grow with contents, we only want marginTop to
        //increase if there are larger elements outside
        var maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        var maxInnerCenter = innerParams.reduce((acc, node) => Math.max(acc, node.center), this.center)
        var diff = Math.floor(maxCenter - maxInnerCenter);
        this._element.style.marginTop = diff.toString() + 'px';
    }

    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return this._char;
    }

    /**
     * Given a position of a parenthesis '(' or ')', find its matching
     * parenthesis, and return its location. Throw an error if there is no
     * matching parenthesis.
     * If there's no match, return null;
     * 
     * @param  {String} str    The string being scanned
     * @param  {Number} start  The location of the open parenthesis
     * @return {Number}        The location of the close parenthesis
     */
    static findMatchingParen(str, start) {
        var depth = 1;

        if(str[start] == '(') {
            for(var i = start + 1; i < str.length; i++) {
                if(str[i] == ')') {
                    depth--;
                    if(depth == 0) {
                        return i;
                    }
                } else if(str[i] == '(') {
                    depth++;
                }
            }

            return null;
        } else if(str[start] == ')') {
            for(var i = start - 1; i >= 0; i--) {
                if(str[i] == '(') {
                    depth--;
                    if(depth == 0) {
                        return i;
                    }
                } else if(str[i] == ')') {
                    depth++;
                }
            }

            return null;
        }

        throw new Error('Unrecognised parenthesis');
    }

    /**
     * Replace all bracketed terms with # so that scanning functions can't
     * see elements between brackets
     * 
     * @param  {String} str The unmasked string
     * @return {String}     The masked string
     */
    static mask(str) {
        var masked = str;
        var start = -1;
        while((start = masked.indexOf('(')) != -1) {
            var end = BracketNode.findMatchingParen(masked, start);

            if(end === null) {
                end = str.length - 1;
            }

            var len = end - start + 1;

            masked = masked.substr(0, start) + '#'.repeat(len) + masked.substr(end + 1);
        }

        return masked;
    }
    
    /**
     * Given a string and an element in the string, find if it's inside
     * of brackets and, if so, where they are.
     * Responds with an array [open, close}, each of which are either a position
     * or null
     * 
     * @param  {String} str   The string to be scanned
     * @param  {Number} start The position whose context we want
     * @return {Array}       The positions of the start and end of the context
     */
    static getContext(str, start) {
        str = str.slice(0, start) + ')' + str.slice(start + 1);
        var open = BracketNode.findMatchingParen(str, start);
        str = str.slice(0, start) + '(' + str.slice(start + 1);
        var close = BracketNode.findMatchingParen(str, start);

        return [open, close];
    }
}


class AbsoluteNode extends UnitNode {
    /**
     * @constructs
     */
    constructor(char, parent=null) {
        super(parent);
        this._element.classList.add('pipe');

        var pipeDisp = document.createElement('div');
        pipeDisp.classList.add('pipe-display')
        this._element.appendChild(pipeDisp);
    }

    /**
     * Given `nodeParams`, dimensions of all other nodes in the expression,
     * redraw this node to line up.
     * 
     * @param  {Array} nodeParams The dimensions of all nodes in the element;
     */
    redraw(nodeParams) {
        var precis = this.parent.precis;
        var start = this.parent.indexOf(this);

        var end = AbsoluteNode.findMatchingPipe(precis, start);
        if(end === null) {
            [open, close] = BracketNode.getContext(precis, start);

            if(close !== null) {
                end = close;
            } else {
                end = precis.length;
            }
        }

        if(start > end) {
            [start, end] = [end, start];
        }

        var innerParams = nodeParams.slice(start+1, end);
        //note this.height refers to default height, not css height
        var maxInnerHeight = innerParams.reduce((acc, node) => Math.max(acc, node.height), this.height)
        var heightStr = maxInnerHeight.toString() + 'px';

        this._element.style.height = heightStr;

        //because pipes grow with contents, we only want marginTop to
        //increase if there are larger elements outside
        var maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        var maxInnerCenter = innerParams.reduce((acc, node) => Math.max(acc, node.center), this.center)
        var diff = Math.floor(maxCenter - maxInnerCenter);
        this._element.style.marginTop = diff.toString() + 'px';
    }

    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return '|';
    }

    /**
     * Given a position of a pipe '|', find its matching element.
     * Logic complicated, see function. Return null if no match.
     * 
     * @param  {String} str    The string being scanned
     * @param  {Number} start  The location of the pipe we know
     * @return {Number}        The location of the matching pipe
     */
    static findMatchingPipe(str, start) {
        //first, find the start/end of the bracketed term we're in
        [open, close] = BracketNode.getContext(str, start);

        if(open === null) {
            open = -1;
        }

        if(close === null) {
            close = str.length;
        }

        //mask everything outside of that context
        var masked = '#'.repeat(open + 1) + str.slice(open + 1, close) + '#'.repeat(str.length - close);

        //then mask all fully-enclosed bracketed terms inside the context
        masked = BracketNode.mask(masked);

        //now just pair them off from the start. if there are an odd number
        //before, match backwards, otherwise match forwards.
        var prevMatches = masked.substring(0, start).match(/\|/g);
        if(prevMatches !== null && prevMatches.length % 2 == 1) {
            return masked.lastIndexOf('|', start - 1);
        } else {
            var match = masked.indexOf('|', start + 1);

            if(match !== -1) {
                return match;
            } else {
                return null;
            }
        }
    }

    /**
     * Replace all matching pipes with # so that scanning functions can't
     * see elements between the pipes.
     * Because this runs after BracketNode.mask, we don't need to worry about
     * context like we do in findMatchingPipes - just pair them off.
     * 
     * @param  {String} str The unmasked string
     * @return {String}     The masked string
     */
    static mask(str) {
        var masked = str;
        var start = -1;
        while((start = masked.indexOf('|')) != -1) {
            var end = masked.indexOf('|', start + 1);

            if(end === null) {
                end = str.length - 1;
            }

            var len = end - start + 1;

            masked = masked.substr(0, start) + '#'.repeat(len) + masked.substr(end + 1);
        }

        return masked;
    }
}


class ExponentNode extends UnitNode {
    /**
     * @constructs
     */
    constructor(char, parent=null) {
        super(parent);
        this._element.classList.add('exponent');

        this._exponent = new ExpressionNode(this);
        this._exponent.element.classList.add('exponent-inner');
        this._element.appendChild(this.exponent.element);
    }

    /**
     * @override
     * @return {Number} Element height
     */
    get height() {
        //the logic here is:
        // - this.center() returns the exponent's height - it sits entirely
        //   above the centreline
        // - if a parenthesis is typed, I want it to treat it as though
        //   it extends down to the baseline
        // - the difference between the centreline and the baseline is exactly
        //   equal to a UnitNode's `height`-`center` (actually the same as
        //   `center` for now but that could change)
        // - the only UnitNode that's guaranteed to exist is the StartNode
        // - so calculate its difference, and add it to the height
        var startHeight = this.parent.startNode.height;
        var startCenter = this.parent.startNode.center;
        var diff = startCenter;

        return Math.max(this.exponent.height, 17) + diff;
    }

    /**
     * Lines up bottom of exponent with centreline.
     * @override
     * @return {Number} Element center
     */
    get center() {
        //TODO get rid of magic number. I don't know why it's necessary, but it
        //doesn't sit on the centreline without it. (In fairness it sits
        //considerably above the centreline with it, but it looks good and
        //should be kept there.)
        return Math.max(this.exponent.height, 17);
    }

    /**
     * Get exponent
     * @return {MathNode} Numerator
     */
    get exponent() {
        return this._exponent;
    }

    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return '^';
    }

    /**
     * If the cursor's coming in from the left, where should it go?
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromLeft() {
        return this.exponent.startNode;
    }


    /**
     * Returns a MathML string representing the ExponentNode.
     * 
     * @return {String} The MathML string representing this element
     */
    get value() {
        return this.exponent.value;
    }

    /**
     * When moving left from an ExponentNode (i.e. cursor is right of the
     * entire ExponentNode), move into the end of the exponent rather than to
     * the sibling node to the left.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
     nodeLeft(defaultNode) {
        return this.exponent.endNode;
     }

    /**
     * Called from inside the exponent, return node to the left.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childLeft(node, defaultNode) {
        return this.parent.childLeft(this, defaultNode);
    }

    /**
     * Called from inside the exponent, return node to the right, which for
     * cursor purposes is the ExponentNode itself.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childRight(node, defaultNode) {
        return this;
    }
}


class SquareRootNode extends UnitNode {
    /**
     * @constructs
     */
    constructor(char, parent=null) {
        super(parent);
        this._element.classList.add('square-root');

        this._radix = document.createElement('div');
        this._radix.classList.add('radix');
        this._element.appendChild(this.radix);

        this._radicand = new ExpressionNode(this);
        this._radicand.element.classList.add('radicand');
        this._element.appendChild(this.radicand.element);
    }

    /**
     * Given `nodeParams`, dimensions of all other nodes in the expression,
     * redraw this node to line up.
     * 
     * @param  {Array} nodeParams The dimensions of all nodes in the element;
     */
    redraw(nodeParams) {
        var maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        var diff = Math.floor(maxCenter - this.center);
        this._element.style.marginTop = diff.toString() + 'px';

        var heightString = this.height.toString() + 'px';
        this._radix.style.height = heightString;
        //numbers are just the width:height ratio of the radix graphic
        this._radix.style.width = ((this.height*21)/38).toString() + '10px';
        this._radicand.element.style.height = heightString;
    }

    /**
     * @override
     * @return {Number} Element height
     */
    get height() {
        return this.radicand.height;
    }

    /**
     * @override
     * @return {Number} Element center
     */
    get center() {
        return this.radicand.height / 2;
    }

    /**
     * Get radix
     * @return {MathNode} Numerator
     */
    get radix() {
        return this._radix;
    }

    /**
     * Get radicand
     * @return {MathNode} Numerator
     */
    get radicand() {
        return this._radicand;
    }

    /**
     * @override
     * @return {String} The node precis
     */
    get precis() {
        return '%';
    }

    /**
     * If the cursor's coming in from the left, where should it go?
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    get cursorNodeFromLeft() {
        return this.radicand.startNode;
    }


    /**
     * Returns a MathML string representing the SquareRootNode.
     * 
     * @return {String} The MathML string representing this element
     */
    get value() {
        return '<apply><root/><degree><ci>2</ci></degree>' + this.radicand.value + '</apply>';
    }

    /**
     * When moving left from an SquareRootNode (i.e. cursor is right of the
     * root), move into the end of the radicand rather than to the
     * sibling node to the left.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
     nodeLeft(defaultNode) {
        return this.radicand.endNode;
     }

    /**
     * Called from radicand, return node to the left.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childLeft(node, defaultNode) {
        return this.parent.childLeft(this, defaultNode);
    }

    /**
     * Called from radicand, return node to the right, which for cursor
     * purposes is the SquareRootNode itself.
     *
     * @override
     * @return {MathNode} The new cursor node
     */
    childRight(node, defaultNode) {
        return this;
    }
}

export {ExpressionNode, MathNode};