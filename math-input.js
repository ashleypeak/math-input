import {ExpressionNode, MathNode} from './math-node.js';

const tagname = 'math-input';
const cursorSpeed = 530;
const template = document.createElement('template');
template.innerHTML = `
    <style type='text/css'>
        .wrapper {
            display:inline-flex;
            border: 1px solid;
            padding: 3px;
            background-color: #ffffff;
            min-width: 200px;
            cursor: text;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12pt;
        }

        .wrapper.error {
            border-color: #d9534f;
            background-color: #f2dede;
        }

        .wrapper .expression {
            display:inline-flex;
            align-items: center;
        }

        .wrapper .unit {
            min-width: 3px;
            min-height: 20px;
            margin: 0px;
            padding: 0px 1px 0px 0px;
        }

        .wrapper .unit.cursor {
            padding-right: 0px;
            border-right: 1px solid;
        }

        .wrapper .atom {
        }

        .wrapper .division {
            display: flex;
            flex-direction: column;
            padding: 2px;
        }

        .wrapper .division.cursor {
            padding: 2px 1px 2px 2px;
        }

        .wrapper .numerator, .wrapper .denominator {
            display: flex;
            justify-content: center;
        }

        .wrapper .numerator {
            padding: 3px 5px 2px 2px;
        }

        .wrapper .denominator {
            border-top: 1px solid;
            padding: 2px 5px 2px 2px;
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
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.wrapper = this.shadowRoot.getElementById('wrapper');

        this.rootNode = new ExpressionNode(null);
        this.expression = this.rootNode;
        this._cursorNode = this.expression.startNode;

        // this.render();
        this.wrapper.appendChild(this.rootNode.element);

        var self = this;
        setInterval(function() {
            if(self._focused) {
                self.cursorNode.toggleCursor();
            }
        }, cursorSpeed);

        this.addEventListener('keydown', this.keydown);
        this.addEventListener('focus', this.focus);
        this.addEventListener('blur', this.blur);
    }


    /** WEBCOMPONENTS CONTROL */

    /** 
    * Attach the input which serves as the form element. Input element can't be
    * in the shadow DOM, and you can't attach elements to the main DOM until
    * after connection.
    */
    connectedCallback() {
        //proxy input
        var input = document.createElement('input');
        input.name = this.getAttribute('name');
        input.value = this.getAttribute('value');
        input.tabIndex = -1;
        input.setAttribute('class', 'real-input');
        this.appendChild(input);

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
            this.getElementsByClassName('real-input')[0].value = value;
        }
    }

    /**
     * Returns the list of attributes which, when changed, should trigger
     * attributeChangedCallback
     * 
     * @return {array} The list of attributes to watch
     */
    static get observedAttributes() {
        return ['value'];
    }


    /** EVENT HANDLERS */

    /**
     * OnKeyDown, determine if the key should be intercepted and, if so,
     * insert/delete node, move cursor etc.
     * 
     * @param  {Event} e JavaScript Event object
     */
    keydown(e) {
        if(e.ctrlKey)   //don't capture control combinations
            return;

        var character = e.key || e.keyCode;
        if(/^[a-zA-Z0-9.+\-*()\^|,='<>~]$/.test(character)) {
            e.preventDefault();
            this.insert(character);
        }

        if(character == '/') {
            e.preventDefault();
            var node = this.insert(character);

            var collected = node.collectNumerator();
            if(collected) {
                this.cursorNode = node.denominator.startNode;
            } else {
                this.cursorNode = node.numerator.endNode;
            }
        }


        if(character == 'ArrowLeft') {
            this.cursorNode = this.cursorNode.nodeLeft();
        }

        if(character == 'ArrowRight') {
            this.cursorNode = this.cursorNode.nodeRight();
        }

        if(character == 'ArrowUp') {
            this.cursorNode = this.cursorNode.nodeUp();
        }

        if(character == 'ArrowDown') {
            this.cursorNode = this.cursorNode.nodeDown();
        }

        if(character == 'Backspace') {
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
    focus() {
        this._focused = true;
        this.cursorNode.toggleCursor(true);
    }

    /**
     * OnBlur, stop the cursor flashing
     */
    blur() {
        this._focused = false;
        this.cursorNode.toggleCursor(false);
    }


    /** GETTERS AND SETTERS */

    /**
     * Get cursorNode - the node with the flashing cursor and after which new
     * nodes will be inserted
     */
    get cursorNode() {
        return this._cursorNode;
    }

    /**
     * Set cursorNode. Remove the cursor class from the previous cursor node
     * before changing.
     * 
     * @param  {MathNode} node The new cursorNode
     */
    set cursorNode(node) {
        this._cursorNode.toggleCursor(false);
        this._cursorNode = node;
        this._cursorNode.toggleCursor(true);
    }


    /** MISCELLANEOUS (CHANGE WHEN THERE'S MORE STRUCTURE) */

    /**
     * Insert a character at the cursor position.
     * 
     * @param  {string} char The character to insert as a new node
     * @return {MathNode} The created node
     */
    insert(char) {
        var node = MathNode.buildFromCharacter(char);
        this.cursorNode.insertAfter(node);
        this.cursorNode = node;

        this.updateValue();

        return node;
    }

    /**
     * Update the element's value to reflect the expression in rootNode
     */
    updateValue() {
        try {
            this.wrapper.classList.remove('error');
            this.setAttribute('value', this.rootNode.value);
        } catch(error) {
            console.error(error);

            this.wrapper.classList.add('error');
            this.setAttribute('value', '');
        }
    }
}

customElements.define(tagname, MathInput);