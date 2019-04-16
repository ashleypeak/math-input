/**
 * Virtual class, don't instantiate.
 *
 * LiteralNode and its children represent the equation as it appears in the
 * input field with only enough structure to render (e.g. it has a Division
 * node to render numerator/denominator, but doesn't distinguish between other
 * operators).
 *
 * Convert to a SemanticNode for structure.
 */
class LiteralNode {
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
     * @return {LiteralNode} The parent of the current node
     */
    get parent() {
        return this._parent;
    }

    /**
     * Set parent node
     * 
     * @param  {LiteralNode} parent The new parent node of this element
     */
    set parent(parent) {
        this._parent = parent;
    }

    /**
     * Get the value - the string which will go into the value attribute.
     * In future will be determined by output type.
     *
     * @abstract
     * @return {String} The string to go in the value attribute
     */
    get value() {
        throw new Error('get value() must be defined.');
    }

    /**
     * Get the DOM node of the LiteralNode. LiteralNodes maintain their own
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
     * @abstract
     * @return {LiteralNode} The node to the left of this node
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
     * @abstract
     * @return {LiteralNode} The node to the right of this node
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
     * Add a class to the LiteralNode's DOM element, if not present
     * 
     * @param {string} className The class to be added
     */
    addClass(className) {
        var classes = this._element.className.split(' ');

        var classPos = classes.indexOf(className);
        if(classPos === -1) {
            classes.push(className);
        }

        this._element.className = classes.join(' ');
    }

    /**
     * Remove a class from the LiteralNode's DOM element, if present
     * 
     * @param {string} className The class to be removed
     */
    removeClass(className) {
        var classes = this._element.className.split(' ');

        var classPos = classes.indexOf(className);
        if(classPos !== -1) {
            classes.splice(classPos, 1);
        }

        this._element.className = classes.join(' ');
    }

    /**
     * Toggle a class on or off in the LiteralNode's DOM element,
     * depending on current state
     * 
     * @param {string} className The class to be toggled
     */
    toggleClass(className) {
        var classes = this._element.className.split(' ');

        var classPos = classes.indexOf(className);
        if(classPos !== -1) {
            classes.splice(classPos, 1);
        } else {
            classes.push(className);
        }

        this._element.className = classes.join(' ');
    }

    /**
     * Insert the node `node` after `this`.
     * 
     * @param  {LiteralNode} node The node to be inserted
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
     * @param  {String} state (on|off|toggle) Override toggle to show/hide cursor
     */
    toggleCursor(state='toggle') {
        if(state == 'toggle') {
            this.toggleClass('cursor');
        } else if(state == 'on') {
            this.addClass('cursor');
        } else if(state == 'off') {
            this.removeClass('cursor');
        }
    }


    /** EXPORTED STATIC FUNCTIONS */

    /**
     * Take a character (from input, usually) and determine based on value
     * what LiteralNode class to return.
     * 
     * @param  {String} char The character to create a LiteralNode from
     * @return {LiteralNode} The resultant LiteralNode
     */
    static buildFromCharacter(char) {
        return new LiteralCharacterNode(char);
    }
}

/**
 * LiteralExpressionNode contains any string of nodes which doesn't need to
 * be distinguished for display purposes. Divisions, Exponents etc will have
 * other LiteralNode types, but anything else will be stored in the array
 * this._nodes.
 *
 * The numerator and denominator of a division, exponent of a power etc. are
 * all ExpressionNodes, as is the root node of the MathInput.
 */
class LiteralExpressionNode extends LiteralNode {
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
        var startNode = new LiteralExpressionStartNode();
        startNode.parent = this;
        this._nodes.push(startNode);
        this._element.appendChild(startNode.element);
    }


    /** GETTERS AND SETTERS */

    /**
     * @override
     * @return {String} The string representing this element in the value attribute
     */
    get value() {
        return this._nodes.reduce((acc, node) => acc + node.value, '');
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
     * @param  {LiteralNode} child   The child node after which newNode is being inserted
     * @param  {LiteralNode} newNode The node being inserted
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
     * @param  {LiteralNode} node The node whose neighbour is being searched for
     * @return {LiteralNode}      The node to the left of `node`
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
     * @param  {LiteralNode} node The node whose neighbour is being searched for
     * @return {LiteralNode}      The node to the right of `node`
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
}

/**
 * A LiteralExpressionStartNode is present as the first node of every
 * LiteralExpressionNode and nowhere else. Its purpose is to display the cursor
 * if it is left of every other element in the LiteralExpressionNode, and to
 * provide an anchor to click on / interact with an empty expression.
 */
class LiteralExpressionStartNode extends LiteralNode {
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
     * @return {String} The string representing this element in the value attribute
     */
    get value() {
        return '';
    }
}

class LiteralCharacterNode extends LiteralNode {
    /**
     * @constructs
     */
    constructor(char) {
        super();
        this._char = char;

        this._element = document.createElement('span');
        this._element.innerText = this._char;
    }


    /**
     * @override
     * @return {String} The string representing this element in the value attribute
     */
    get value() {
        return this._char;
    }
}

export {LiteralExpressionNode, LiteralNode};