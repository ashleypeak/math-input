
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
            this._unsetCursor(this._cursor);
            this._setCursor(node);

            node.toggleCursor(true);
        } else {
            this.parent.cursor = node;
        }
    }

    /**
     * Set the new cursor, add CSS classes
     * Don't call this, call `set cursor()` instead.
     * 
     * @param {MathNode} node The node to be made a cursor
     */
    _setCursor(node) {
        this._cursor = node;
        node.element.classList.add('cursor');
    }

    /**
     * Unset the old cursor, remove CSS classes
     * Don't call this, used by `set cursor()`. I can't think of a reason you'd
     * unset the cursor without setting a new one. Even when not displayed, the
     * input needs a cursor incase an element is inserted through the `insert`
     * attribute.
     * 
     * @param {MathNode} node The old cursor, to be unset
     */
    _unsetCursor(node) {
        node.element.classList.remove('cursor');
        node.toggleCursor(false);
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
     * Build the top-level ExpressionNode for a MathInput. Used to initialise
     * an input field.
     * 
     * @return {ExpressionNode} A top-level ExpressionNode
     */
    static buildRootNode() {
        let rootNode = new ExpressionNode(null);
        rootNode._setCursor(rootNode.startNode);

        return rootNode;
    }

    /**
     * Take a character (from input, usually) and determine based on value
     * what MathNode class to return.
     * 
     * @param  {String} char The character to create a MathNode from
     * @return {MathNode} The resultant MathNode
     */
    static buildFromCharacter(char) {
        if(/^[a-zA-Zα-ωΑ-Ω0-9.+\-*]$/.test(char)) {
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

    /**
     * Take a named symbol (like 'sqrt') and determine based on that name what
     * MathNode class to return.
     * 
     * @param  {String}   name The name of the MathNode to build
     * @return {MathNode}      The resultant MathNode
     */
    static buildFromName(name) {
        if(name == 'sqrt') {
            return new SquareRootNode();
        } else if(name == 'pi') {
            return new AtomNode('π');
        } else if(name == 'infty') {
            return new AtomNode('∞');
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
     *
     * In addition to creating the element, register a listener for clicks so
     * when the ExpressionNode is clicked, the cursor moves to the last child
     * of the ExpressionNode.
     *
     * Because Nodes within the ExpressionNode have their own click handlers
     * which call stopPropagation(), if a child node is clicked this listener
     * won't be called.
     */
    constructor(parent=null) {
        super(parent);

        this._nodes = new Array();
        this._element.classList.add('expression');

        //every expression starts with a span, serves as the cursor location before
        //the first element
        //has to be inserted manually because there is no child in a new ExpressionNode
        //to insert it after
        let startNode = new StartNode(this);
        this._nodes.push(startNode);
        this._element.appendChild(startNode.element);

        let self = this;
        this._element.addEventListener('click', function(e) {
            //setting cursor bubbles up to root node, see `set cursor`
            self.cursor = self.endNode;
            e.stopPropagation();
        });
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
        let nodeParams = this.nodes.map((el) => ({height: el.height, center: el.center}));

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
     * `preModifiers` keeps track of a previous elements which affect the next
     * e.g. sin(x) has two terms: 'sin' and '(x)'. We pass 'sin' as a
     * preModifier back to _parse, so that the engine knows to return the sine
     * of 'x', not just 'x', on its next run.
     *
     * @see  UnitNode.precis()
     * @param  {String} precis       A precis of a set of nodes
     * @param  {Number} offset       The offset between `precis` and `_nodes`
     * @param  {Array}  preModifiers An array of preModifiers, if any, that
     *                               must be applied
     * @return {String}              A MathML string
     */
    _parse(precis, offset=0, preModifiers=[]) {
        let masked = BracketNode.mask(precis);
        masked = AbsoluteNode.mask(masked);

        //if it starts with an _ i.e. a StartNode, get rid of it
        if(/^_/.test(precis)) {
            return this._parse(precis.slice(1), offset+1)
        }

        //matches last +/-. Needs to be done in reverse order: consider a-b+c
        let match = masked.match(/([+\-])(?!.*[+\-])/);
        //symbol can't be the first character in the string, because if it's
        //first it's a unary positive/negative (unary positive not supported,
        //but nevertheless can't be handled here.)
        if(match !== null && match.index !== 0) {
            return this._parseOperator(precis, offset, match.index);
        }

        //match a times symbol
        match = masked.match(/\*/);
        if(match !== null) {
            return this._parseOperator(precis, offset, match.index);
        }

        //if it starts with a unary negative
        if(/^-/.test(precis)) {
            preModifiers.push('negative');
            return this._parse(precis.slice(1), offset + 1, preModifiers);
        }

        //if it starts with a number
        if(/^[0-9]/.test(precis)) {
            let term = precis.match(/^[0-9]+(\.[0-9]+)?/)[0];
            let mathml = '<cn>' + term + '</cn>';

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it starts with a known function
        let functionPattern = /^(sin|cos|tan|ln)/;
        if(functionPattern.test(precis)) {
            let term = precis.match(functionPattern)[0];
            let len = term.length;

            preModifiers.push(term);
            return this._parse(precis.slice(len), offset+len, preModifiers);
        }

        //if it starts with pi
        let piPattern = /^(pi|π)/;
        if(piPattern.test(precis)) {
            let term = precis.match(piPattern)[0];
            let mathml = '<pi/>';

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it starts with infinity
        let inftyPattern = /^∞/;
        if(inftyPattern.test(precis)) {
            let term = precis.match(inftyPattern)[0];
            let mathml = '<infinity/>';

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it is the letter 'e', parse as Euler's number
        if(/^e/.test(precis)) {
            let term = precis[0];
            let mathml = '<exponentiale/>';

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it starts with a letter
        if(/^[a-zA-Zα-ωΑ-Ω]/.test(precis)) {
            let term = precis[0];
            let mathml = '<ci>' + term + '</ci>';

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it starts with a % i.e. is a non-Atom, non-Exponent UnitNode
        if(/^%/.test(precis)) {
            let term = precis[0];
            let mathml = this.nodes[offset].value;

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it starts with a parenthesis
        if(/^\(/.test(precis)) {
            //can't find end using `masked` because (1)(2) would return 5 not 2
            let end = BracketNode.findMatchingParen(precis, 0);

            if(end === null) {
                throw new Error('Unmatched parenthesis.');
            }

            let term = precis.slice(0, end + 1);
            let mathml = this._parse(term.slice(1, -1), offset + 1);

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if it starts with a pipe
        if(/^\|/.test(precis)) {
            let end = precis.indexOf('|', 1);

            if(end === -1) {
                throw new Error('Unmatched pipe.');
            }

            let term = precis.slice(0, end + 1);
            let innerMathml = this._parse(term.slice(1, -1), offset + 1);
            let mathml = '<apply><abs/>' + innerMathml + '</apply>';

            return this._parseTerm(term, mathml, precis, offset, preModifiers);
        }

        //if no match has been found
        throw new Error('Cannot parse input.');
    }

    /**
     * Given a `term`, a matched section at the start of a precis:
     *  - make preModifier and postModifier alterations
     *    - @see _parse(Pre|Post)Modifiers
     *  - if the term comprises the entire precis, return it's calculated `mathml`
     *  - otherwise, parse the rest and multiply them together
     *  
     * @param  {String} term         The portion of the precis identified as a term
     * @param  {String} mathml       The mathml rendering of `term`
     * @param  {String} precis       The full precis being parsed
     * @param  {Number} offset       The precis' offset within the expression
     * @param  {Array}  preModifiers The preModifiers - @see _parse
     * @return {String}              The resultant mathml term
     */
    _parseTerm(term, mathml, precis, offset, preModifiers) {
        //I'm not certain that it will always be fine to run all postModifiers
        //before all preModifiers, but it's fine (and necessary) for now.
        [term, mathml, precis, offset] = this._parsePostModifiers(term, mathml, precis, offset);
        if(preModifiers !== []) {
            [term, mathml, precis, offset] = this._parsePreModifiers(term, mathml, precis, offset, preModifiers);
        }

        if(term.length == precis.length) {
            return mathml;
        } else {
            offset = offset + term.length;
            let rest = this._parse(precis.slice(term.length), offset);

            return '<apply><times/>' + mathml + rest + '</apply>';
        }
    }

    /**
     * Looks for postModifiers - anything after a term which alters it (for
     * example, an exponent or a prime sign). If there is, make appropriate
     * changes to the arguments, then pass them back altered.
     * 
     * @param  {String} term   The portion of the precis identified as a term
     * @param  {String} mathml The mathml rendering of `term`
     * @param  {String} precis The full precis being parsed
     * @param  {Number} offset The precis' offset within the expression
     * @return {Array}         The function arguments, altered and returned
     */
    _parsePostModifiers(term, mathml, precis, offset) {
        if(precis[term.length] === '^') {
            let exponent_mathml = this.nodes[offset+term.length].value;
            term += '^';
            mathml = '<apply><power/>' + mathml + exponent_mathml +  '</apply>';
        }

        return [term, mathml, precis, offset];
    }

    /**
     * We've identified (in `_parse`) that there is a preModifiers to apply -
     * that is, anything before a term which alters it (e.g. 'sin' or 'ln').
     * Apply the preModifier, make appropriate changes to the arguments, then
     * pass them back altered.
     * 
     * @param  {String} term         The portion of the precis identified as a term
     * @param  {String} mathml       The mathml rendering of `term`
     * @param  {String} precis       The full precis being parsed
     * @param  {Number} offset       The precis' offset within the expression
     * @param  {Array}  preModifiers The identified preModifiers
     * @return {Array}               The function arguments, altered and returned
     */
    _parsePreModifiers(term, mathml, precis, offset, preModifiers) {
        //apply in reverse order
        let preModifier = null;
        while(typeof (preModifier = preModifiers.pop()) !== 'undefined') {
            if(['sin', 'cos', 'tan', 'ln'].includes(preModifier)) {
                mathml = `<apply><${preModifier}/>${mathml}</apply>`;
            } else if(preModifier === 'negative') {
                mathml = `<apply><minus/>${mathml}</apply>`;
            }
        }

        return [term, mathml, precis, offset];
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
        let op = precis[operatorPos];
        let lhs = this._parse(
            precis.slice(0, operatorPos),
            offset);
        let rhs = this._parse(
            precis.slice(operatorPos + 1),
            offset + operatorPos + 1);

        let op_tags = {'+': '<plus/>', '-': '<minus/>', '*': '<times/>'};

        return '<apply>' + op_tags[op] + lhs + rhs + '</apply>';
    }

    /**
     * Insert a node `newNode` after the node `child`
     * 
     * @param  {MathNode} child   The child node after which newNode is being inserted
     * @param  {MathNode} newNode The node being inserted
     */
    childInsertAfter(child, newNode) {
        let index = this.indexOf(child);

        newNode.parent = this;

        //use internal names because we're modifying
        this._nodes.splice(index+1, 0, newNode);

        let nextSibling = child.element.nextSibling;
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
        let index = this.indexOf(node);

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
        let index = this.indexOf(node);

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
        let index = this.indexOf(node);

        this._nodes.splice(index, 1);
        this._element.removeChild(node.element);

        this.redraw();
    }

    indexOf(node) {
        let index = this.nodes.findIndex((el) => el == node);

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
     *
     * In addition to creating the element, register a listener for clicks so
     * when the element is clicked on the cursor moves to it.
     */
    constructor(parent=null) {
        super(parent);
        this._element.classList.add('unit');

        let self = this;
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
        let index = this.parent.indexOf(this);

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
        let maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        let diff = Math.floor(maxCenter - this.center);
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
        let precis = '';
        let node = this.previousSibling;
        do {
            precis = node.precis + precis;
        } while(node = node.previousSibling)

        //match everything that should move to numerator, fairly arbitrary
        let match = precis.match(/[a-zA-Zα-ωΑ-Ω0-9%^]+$/);
        if(match !== null) {
            for(let i = 0; i < match[0].length; i++) {
                this.numerator.startNode.insertAfter(this.previousSibling);
            }

            return true;
        }

        match = precis.match(/\)$/);
        if(match !== null) {
            let start = BracketNode.findMatchingParen(precis, precis.length-1);
            if(start === null) {
                start = 0;
            }

            let count = precis.length - start;
            for(let i = 0; i < count; i++) {
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
        let precis = this.parent.precis;
        let start = this.parent.indexOf(this);

        let end = BracketNode.findMatchingParen(precis, start);
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

        let innerParams = nodeParams.slice(start+1, end);
        //note this.height refers to default height, not css height
        let maxInnerHeight = innerParams.reduce((acc, node) => Math.max(acc, node.height), this.height)

        this._element.style.height = maxInnerHeight.toString() + 'px';
        this._element.style.width = (maxInnerHeight / 8).toString() + 'px';

        //because brackets grow with contents, we only want marginTop to
        //increase if there are larger elements outside
        let maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        let maxInnerCenter = innerParams.reduce((acc, node) => Math.max(acc, node.center), this.center)
        let diff = Math.floor(maxCenter - maxInnerCenter);
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
        let depth = 1;

        if(str[start] == '(') {
            for(let i = start + 1; i < str.length; i++) {
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
            for(let i = start - 1; i >= 0; i--) {
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
        let masked = str;
        let start = -1;
        while((start = masked.indexOf('(')) != -1) {
            let end = BracketNode.findMatchingParen(masked, start);

            if(end === null) {
                end = str.length - 1;
            }

            let len = end - start + 1;

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
        let open = BracketNode.findMatchingParen(str, start);
        str = str.slice(0, start) + '(' + str.slice(start + 1);
        let close = BracketNode.findMatchingParen(str, start);

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

        let pipeDisp = document.createElement('div');
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
        let precis = this.parent.precis;
        let start = this.parent.indexOf(this);

        let end = AbsoluteNode.findMatchingPipe(precis, start);
        if(end === null) {
            let [open, close] = BracketNode.getContext(precis, start);

            if(close !== null) {
                end = close;
            } else {
                end = precis.length;
            }
        }

        if(start > end) {
            [start, end] = [end, start];
        }

        let innerParams = nodeParams.slice(start+1, end);
        //note this.height refers to default height, not css height
        let maxInnerHeight = innerParams.reduce((acc, node) => Math.max(acc, node.height), this.height)
        let heightStr = maxInnerHeight.toString() + 'px';

        this._element.style.height = heightStr;

        //because pipes grow with contents, we only want marginTop to
        //increase if there are larger elements outside
        let maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        let maxInnerCenter = innerParams.reduce((acc, node) => Math.max(acc, node.center), this.center)
        let diff = Math.floor(maxCenter - maxInnerCenter);
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
        let [open, close] = BracketNode.getContext(str, start);

        if(open === null) {
            open = -1;
        }

        if(close === null) {
            close = str.length;
        }

        //mask everything outside of that context
        let masked = '#'.repeat(open + 1) + str.slice(open + 1, close) + '#'.repeat(str.length - close);

        //then mask all fully-enclosed bracketed terms inside the context
        masked = BracketNode.mask(masked);

        //now just pair them off from the start. if there are an odd number
        //before, match backwards, otherwise match forwards.
        let prevMatches = masked.substring(0, start).match(/\|/g);
        if(prevMatches !== null && prevMatches.length % 2 == 1) {
            return masked.lastIndexOf('|', start - 1);
        } else {
            let match = masked.indexOf('|', start + 1);

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
        let masked = str;
        let start = -1;
        while((start = masked.indexOf('|')) != -1) {
            let end = masked.indexOf('|', start + 1);

            if(end === null) {
                end = str.length - 1;
            }

            let len = end - start + 1;

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
        let startHeight = this.parent.startNode.height;
        let startCenter = this.parent.startNode.center;
        let diff = startCenter;

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
        let maxCenter = nodeParams.reduce((acc, node) => Math.max(acc, node.center), 0)
        let diff = Math.floor(maxCenter - this.center);
        this._element.style.marginTop = diff.toString() + 'px';

        let heightString = this.height.toString() + 'px';
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
     * @return {MathNode} Radix
     */
    get radix() {
        return this._radix;
    }

    /**
     * Get radicand
     * @return {MathNode} Radicand
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
        return '<apply><root/><degree><cn>2</cn></degree>' + this.radicand.value + '</apply>';
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

export default MathNode;