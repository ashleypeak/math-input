import MathNode from './math-node.js';

const DEBUG = false;
const TAGNAME = 'math-input';
const CURSORSPEED = 530;
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
    <style type='text/css'>
        .wrapper {
            display: inline-flex;
            padding: 5px 5px 5px 3px;
        }

        .wrapper .expression {
            display: inline-flex;
            align-items: flex-start;
        }

        .wrapper .unit {
            margin: 0px;
            padding: 0px 1px 0px 0px;
        }

        .wrapper .start {
            width: 3px;
            height: 17px;
        }

        .wrapper .unit.cursor-visible {
            padding-right: 0px;
            border-right: 1px solid;
        }

        .wrapper .division {
            display: flex;
            flex-direction: column;
            padding: 0px 2px;
        }

        .wrapper .division.cursor-visible {
            padding: 0px 1px 0px 2px;
        }

        .wrapper .numerator, .wrapper .denominator {
            display: flex;
            justify-content: center;
        }

        .wrapper .numerator {
            padding: 0px 5px 2px 2px;
        }

        .wrapper .denominator {
            border-top: 1px solid;
            padding: 2px 5px 0px 2px;
        }

        .wrapper .parenthesis {
            background-position: center center;
            background-repeat: no-repeat;
            background-size: 100% 100%;
        }

        .wrapper .parenthesis-left {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%2712%27%20height%3D%27100%27%20viewBox%3D%270%200%2012%2099.999996%27%3E%3Cg%20transform%3D%27matrix(-2.8209367%2C0%2C0%2C5.9197596%2C15.598024%2C-77.91485)%27%3E%3Cpath%20d%3D%27M%202.4092605%2C30.054405%20C%203.2823107%2C28.95284%204.0205912%2C27.663779%204.6241042%2C26.187218%205.2276212%2C24.710657%205.5293787%2C23.181361%205.5293776%2C21.599327%205.5293787%2C20.204802%205.303793%2C18.868866%204.8526198%2C17.591515%204.3252784%2C16.109103%203.5108261%2C14.632542%202.4092605%2C13.161827%20H%201.2754714%20c%200.708989%2C1.218762%201.1777385%2C2.088878%201.40625%2C2.610352%200.3574254%2C0.808603%200.6386752%2C1.652352%200.84375%2C2.53125%200.251956%2C1.09571%200.3779324%2C2.197271%200.3779297%2C3.304687%202.7e-6%2C2.818361%20-0.875973%2C5.633788%20-2.6279297%2C8.446289%20z%27%20%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");
        }

        .wrapper .parenthesis-right {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%2712%27%20height%3D%27100%27%20viewBox%3D%270%200%2012%2099.999996%27%3E%20%3Cg%20transform%3D%27matrix(2.8209367%2C0%2C0%2C5.9197596%2C-3.5980243%2C-77.91485)%27%3E%3Cpath%20d%3D%27M%202.4092605%2C30.054405%20C%203.2823107%2C28.95284%204.0205912%2C27.663779%204.6241042%2C26.187218%205.2276212%2C24.710657%205.5293787%2C23.181361%205.5293776%2C21.599327%205.5293787%2C20.204802%205.303793%2C18.868866%204.8526198%2C17.591515%204.3252784%2C16.109103%203.5108261%2C14.632542%202.4092605%2C13.161827%20H%201.2754714%20c%200.708989%2C1.218762%201.1777385%2C2.088878%201.40625%2C2.610352%200.3574254%2C0.808603%200.6386752%2C1.652352%200.84375%2C2.53125%200.251956%2C1.09571%200.3779324%2C2.197271%200.3779297%2C3.304687%202.7e-6%2C2.818361%20-0.875973%2C5.633788%20-2.6279297%2C8.446289%20z%27%20%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");
        }

        .wrapper .pipe .pipe-display {
            height: 100%;
            width: 1px;
            background-color: #000000;
            margin-left: 1px;
        }

        .wrapper .exponent {
            margin-left: -2px;
        }

        .wrapper .exponent .start:not(.cursor):only-child {
            background-color: #d9edf7;
            border: 1px solid #31708f;
            width:5px;
        }

        .wrapper .exponent .expression {
            height: 10px;
            font-size: 10px;
            line-height: 10px;
        }

        .wrapper .exponent .start {
            height: 10px;
        }

        .wrapper .square-root {
            display: flex;
        }

        .wrapper .square-root .radix {
            background-position: center center;
            background-repeat: no-repeat;
            background-size: 100% 100%;
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%27210%27%20height%3D%27380%27%3E%3Cpath%20d%3D%22M%20178.3537%2C0.28125%20130.32403%2C317.42152%2055.561997%2C156.82162%200%2C186.26857%206.2621711%2C198.75933%2042.830877%2C181.02246%20134.40035%2C380.28125%20189.87373%2C14.270896%20210%2C14.27809%20V%200.28849204%20L%20192.0005%2C0.28125%20h%20-9.65909%20z%22%20style%3D%22stroke-width%3A0.97187144%22%20%2F%3E%3C%2Fsvg%3E");
        } 

        .wrapper .square-root .radicand {
            background-position: top left;
            background-repeat: repeat-x;
            background-size: 100% 100%;
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%2719%27%20height%3D%27380%27%3E%3Cpath%20d%3D%27M%200%2014%2020%2014%20V%200%20H%200%200%20Z%27%20%2F%3E%3C%2Fsvg%3E");
        }

        .wrapper .square-root .radicand .start {
            width: 0px;
            margin-right: 0px;
        }

        .wrapper .square-root .radicand .start:only-child {
            width: 5px;
            margin-right: 5px;
        }
    </style>
    <div id='wrapper' class='wrapper'>
    </div>
`;

/**
 * The MathInput is a form element which allows for the entry of mathematical
 * expressions.
 *
 * NOTE: Due to limitations in creating WebComponent form elements, MathInput
 * fields must be given a tabindex.
 */
class MathInput extends HTMLElement {
    /**
     * @constructs
     */
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
        this.wrapper = this.shadowRoot.getElementById('wrapper');

        this.rootNode = MathNode.buildRootNode();
        this.wrapper.appendChild(this.rootNode.element);

        let self = this;
        setInterval(function() {
            if(self._focused) {
                self.cursorNode.toggleCursor();
            }
        }, CURSORSPEED);

        this.addEventListener('keydown', this._keydown);
        this.addEventListener('focus', this._focus);
        this.addEventListener('blur', this._blur);
        this.addEventListener('click', this._click);

        // If the 'value' attribute already set, draw the MathNodes represented
        // by that MathML into the field
        let value = this.getAttribute('value');
        if(value !== null) {
            this.insertNodesByMathML(value);
            this.blur(); // Inserting nodes focusses a field, but we don't want
                         // that here.
        }
    }


    /** WEBCOMPONENTS CONTROL */

    /** 
    * Attach the input which serves as the form element. Input element can't be
    * in the shadow DOM, and you can't attach elements to the main DOM until
    * after connection.
    */
    connectedCallback() {
        //proxy input
        this.realInput = document.createElement('input');
        this.realInput.type = "hidden";
        this.realInput.name = this.getAttribute('name');
        this.realInput.value = this.getAttribute('value');
        this.realInput.tabIndex = -1;
        this.realInput.setAttribute('class', 'real-input');
        this.parentNode.insertBefore(this.realInput, this);

        this._connected = true;
    }

    /**
     * Updates the input element whenever the value is changed (by render())
     * 
     * @param  {string} name  The name of the changed attribute
     * @param  {string} old   The old value of the attribute
     * @param  {string} value The new attribute value
     */
    attributeChangedCallback(name, old, value) {
        if(this._connected) {
            if(name === 'value') {
                this.realInput.value = value;
            } else if(name === 'insert' && value !== '') {
                try {
                    this.insertNodeByCharacter(value);
                } catch(err) {
                    try {
                        this.insertNodeByName(value);
                    } catch(err) {
                        throw new Error(`Insert value not supported: ${value}`);
                    }
                }

                this.setAttribute('insert', '');
            }
        }
    }

    /**
     * Returns the list of attributes which, when changed, should trigger
     * attributeChangedCallback
     * 
     * @return {array} The list of attributes to watch
     */
    static get observedAttributes() {
        return ['value', 'insert'];
    }


    /** EVENT HANDLERS */

    /**
     * OnKeyDown, determine if the key should be intercepted and, if so,
     * insert/delete node, move cursor etc.
     * 
     * @param  {Event} e JavaScript Event object
     */
    _keydown(e) {
        if(e.ctrlKey)   //don't capture control combinations
            return;

        let char = e.key || e.keyCode;
        try {
            this.insertNodeByCharacter(char);
            e.preventDefault();
        } catch(err) {
        }

        if(char == 'ArrowLeft') {
            e.preventDefault();
            this.cursorNode = this.cursorNode.nodeLeft();
        }

        if(char == 'ArrowRight') {
            e.preventDefault();
            this.cursorNode = this.cursorNode.nodeRight();
        }

        if(char == 'ArrowUp') {
            e.preventDefault();
            this.cursorNode = this.cursorNode.nodeUp();
        }

        if(char == 'ArrowDown') {
            e.preventDefault();
            this.cursorNode = this.cursorNode.nodeDown();
        }

        if(char == 'Backspace') {
            e.preventDefault();
            let newCursor = this.cursorNode.previousSibling;

            if(newCursor !== null) {
                let oldCursor = this.cursorNode;
                this.cursorNode = newCursor;

                oldCursor.delete();
                this.updateValue();
            }
        }
    }

    /**
     * OnFocus, start the cursor flashing
     */
    _focus() {
        this._focused = true;
        this.cursorNode.toggleCursor(true);
    }

    /**
     * OnBlur, stop the cursor flashing
     */
    _blur() {
        this._focused = false;
        this.cursorNode.toggleCursor(false);
    }

    /**
     * OnClick, move the cursor to the last child of the root ExpressionNode,
     * i.e. to the rightmost position in the field.
     *
     * Because Nodes within the ExpressionNode have their own click handlers
     * which call stopPropagation(), if a child node is clicked this listener
     * won't be called.
     */
    _click() {
        this.rootNode.cursor = this.rootNode.endNode;
    }


    /** GETTERS AND SETTERS */

    /**
     * Get cursorNode - the node with the flashing cursor and after which new
     * nodes will be inserted
     */
    get cursorNode() {
        return this.rootNode.cursor;
    }

    /**
     * Set cursorNode. Remove the cursor class from the previous cursor node
     * before changing.
     * 
     * @param  {MathNode} node The new cursorNode
     */
    set cursorNode(node) {
        this.rootNode.cursor = node;
    }


    /** MISCELLANEOUS (CHANGE WHEN THERE'S MORE STRUCTURE) */

    /**
     * Insert a new node, whose identity is determined by the parameter `char`,
     * then possibly move the cursor depending on what node was inserted. If an
     * exponent, for example, move the cursor into the exponent.
     * 
     * @param  {String} char The character whose equivalent node is to be
     *                       inserted
     */
    insertNodeByCharacter(char) {
        let node = MathNode.buildFromCharacter(char);
        this.insert(node);

        if(char == '/') {
            let collected = node.collectNumerator();
            if(collected) {
                this.cursorNode = node.denominator.startNode;
            } else {
                this.cursorNode = node.numerator.endNode;
            }
        }

        if(char == '^') {
            this.cursorNode = node.exponent.startNode;
        }

        this.focus();
    }

    /**
     * Insert a new node, whose identity is determined by the parameter `name`,
     * then possibly move the cursor depending on what node was inserted. If a
     * square root, for example, move the cursor into the square root.
     *
     * This differs from insertNodeByCharacter because it takes symbols with
     * multicharacter descriptors, like 'sqrt'. insertNodeByCharacter takes
     * single-character descriptors, like '1', and generally inserts that value
     * more or less directly into the field.
     * 
     * @param  {String} name The name of the node to be inserted
     */
    insertNodeByName(name) {
        let node = MathNode.buildFromName(name);
        this.insert(node);

        if(name == 'sqrt') {
            this.cursorNode = node.radicand.startNode;
        }

        this.focus();
    }

    /**
     * Insert a set of new nodes, whose identities are determined by the
     * parameter `mml`.
     *
     * This function will take any MathML which the <math-input> field is
     * capable of outputting, it needn't be a simple atomic node.
     * 
     * @param  {String} mml The MathML of the node to be inserted
     */
    insertNodesByMathML(mml) {
        let nodes = MathNode.buildNodesetFromMathML(mml);

        let self = this;
        nodes.forEach(function(node) {
            self.insert(node);
        });

        this.focus();
    }

    /**
     * Insert a node at the cursor position.
     * 
     * @param  {MathNode} node The node to insert
     */
    insert(node) {
        this.cursorNode.insertAfter(node);
        this.cursorNode = node;

        this.updateValue();
        this.cursorNode.parent.redraw();
    }

    /**
     * Update the element's value to reflect the expression in rootNode
     */
    updateValue() {
        try {
            this.classList.remove('error');
            this.setAttribute('value', this.rootNode.value);
        } catch(error) {
            if(DEBUG) {
                console.error(error);
            }

            this.classList.add('error');
            this.setAttribute('value', '');
        }
    }
}


customElements.define(TAGNAME, MathInput);