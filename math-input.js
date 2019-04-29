import MathNode from './math-node.js';

const DEBUG = false;
const TAGNAME = 'math-input';
const CURSORSPEED = 530;
const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
    <style type='text/css'>
        .wrapper {
            display: inline-flex;
            border: 1px solid;
            padding: 5px 5px 5px 3px;
            background-color: #ffffff;
            min-width: 200px;
            cursor: text;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 17px;
            line-height: 17px;
        }

        .wrapper.error {
            border-color: #d9534f;
            background-color: #f2dede;
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
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%2725%27%20height%3D%27100%27%20viewBox%3D%270%200%2023.671175%2093.999996%27%3E%3Cg%20transform%3D%27matrix(-5.564574%2C0%2C0%2C5.564574%2C30.768631%2C-73.23996)%27%3E%3Cpath%20d%3D%27M%202.4092605%2030.054405%20C%203.2823107%2028.95284%204.0205912%2027.663779%204.6241042%2026.187218%205.2276212%2024.710657%205.5293787%2023.181361%205.5293776%2021.599327%205.5293787%2020.204802%205.303793%2018.868866%204.8526198%2017.591515%204.3252784%2016.109103%203.5108261%2014.632542%202.4092605%2013.161827%20H%201.2754714%20c%200.708989%201.218762%201.1777385%202.088878%201.40625%202.610352%200.3574254%200.808603%200.6386752%201.652352%200.84375%202.53125%200.251956%201.09571%200.3779324%202.197271%200.3779297%203.304687%202.7e-6%202.818361%20-0.875973%205.633788%20-2.6279297%208.446289%20z%27%20%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");
        }

        .wrapper .parenthesis-right {
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%2725%27%20height%3D%27100%27%20viewBox%3D%270%200%2023.671175%2093.999996%27%3E%3Cg%20transform%3D%27matrix(5.564574%200%200%205.564574%20-7.0974548%20-73.23996)%27%3E%3Cpath%20d%3D%27M%202.4092605%2030.054405%20C%203.2823107%2028.95284%204.0205912%2027.663779%204.6241042%2026.187218%205.2276212%2024.710657%205.5293787%2023.181361%205.5293776%2021.599327%205.5293787%2020.204802%205.303793%2018.868866%204.8526198%2017.591515%204.3252784%2016.109103%203.5108261%2014.632542%202.4092605%2013.161827%20H%201.2754714%20c%200.708989%201.218762%201.1777385%202.088878%201.40625%202.610352%200.3574254%200.808603%200.6386752%201.652352%200.84375%202.53125%200.251956%201.09571%200.3779324%202.197271%200.3779297%203.304687%202.7e-6%202.818361%20-0.875973%205.633788%20-2.6279297%208.446289%20z%27%20%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E");
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
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%27210%27%20height%3D%27380%27%3E%3Cpath%20d%3D%27M%20188.6875%200%20137.875%20317.375%2058.781256%20156.65623%200%20186.12498%20l%206.625001%2012.5%2038.687495%20-17.75%20L%20142.1875%20380.28125%20200.875%2014%20222.16739%2014.0072%20V%200.0072474%20L%20203.125%200%20h%20-10.21874%20z%27%20%2F%3E%3C%2Fsvg%3E");
        }

        .wrapper .square-root .radicand {
            background-position: top left;
            background-repeat: repeat-x;
            background-size: 100% 100%;
            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20xmlns%3Axlink%3D%27http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%27%20version%3D%271.1%27%20width%3D%2720%27%20height%3D%27380%27%3E%3Cpath%20d%3D%27M%200%2014%2020%2014%20V%200%20H%200%200%20Z%27%20%2F%3E%3C%2Fsvg%3E");
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

        var self = this;
        setInterval(function() {
            if(self._focused) {
                self.cursorNode.toggleCursor();
            }
        }, CURSORSPEED);

        this.addEventListener('keydown', this._keydown);
        this.addEventListener('focus', this._focus);
        this.addEventListener('blur', this._blur);
        this.addEventListener('click', this._click);
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
        this.realInput.name = this.getAttribute('name');
        this.realInput.value = this.getAttribute('value');
        this.realInput.tabIndex = -1;
        this.realInput.setAttribute('class', 'real-input');
        this.appendChild(this.realInput);

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

        var char = e.key || e.keyCode;
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
            var newCursor = this.cursorNode.previousSibling;

            if(newCursor !== null) {
                var oldCursor = this.cursorNode;
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
        var node = MathNode.buildFromCharacter(char);
        this.insert(node);

        if(char == '/') {
            var collected = node.collectNumerator();
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
     * @param  {String} char The character whose equivalent node is to be
     *                       inserted
     */
    insertNodeByName(name) {
        var node = MathNode.buildFromName(name);
        this.insert(node);

        if(name == 'sqrt') {
            this.cursorNode = node.radicand.startNode;
        }

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
            this.wrapper.classList.remove('error');
            this.setAttribute('value', this.rootNode.value);
        } catch(error) {
            if(DEBUG) {
                console.error(error);
            }

            this.wrapper.classList.add('error');
            this.setAttribute('value', '');
        }
    }
}


customElements.define(TAGNAME, MathInput);