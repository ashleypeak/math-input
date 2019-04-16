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
     */
    get value() {
        throw new Error('get value() must be defined.');
    }

    /**
     * Get the DOM node of the LiteralNode. LiteralNodes maintain their own
     * DOM elements
     */
    get element() {
        return this._element;
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
        this.insert(new LiteralExpressionStartNode());
    }


    /** GETTERS AND SETTERS */

    /**
     * Get the value - the string which will go into the value attribute.
     */
    get value() {
        return this._nodes.reduce((acc, node) => acc + node.value, '');
    }

    /**
     * Get the array of child nodes
     */
    get nodes() {
        return this._nodes;
    }


    /** MISCELLANEOUS */

    /**
     * Insert a node into this expression. Currently inserts at the end, but
     * will ultimately be determined by cursor position
     * 
     * @param  {LiteralNode} node The node to be inserted
     */
    insert(node) {
        node.parent = this;
        this._nodes.push(node);
        this._element.appendChild(node.element);
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
     * Get the value - the string which will go into the value attribute.
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
     * Get the value - the string which will go into the value attribute.
     */
    get value() {
        return this._char;
    }
}

export {LiteralExpressionNode, LiteralNode};