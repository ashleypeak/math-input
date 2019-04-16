import {LiteralExpressionNode, LiteralNode} from './literal-node.mjs';

const tagname = 'math-input';
const cursorSpeed = 530;
const template = document.createElement('template');
template.innerHTML = `
    <style type='text/css'>
        .wrapper {
            display: inline-block;
            border: 1px solid;
            padding: 3px;
            background-color: #ffffff;
            min-width: 200px;
            min-height: 20px;
            white-space: nowrap;
            overflow: hidden;
            cursor: text;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-size: 12pt;
        }

        .wrapper span {
            display: inline-block;
            vertical-align: middle;
            padding: 0px 1px 0px 0px;
            cursor: text;
            min-width: 5px;
            min-height: 20px;
        }

        .wrapper span.cursor {
            padding-right: 0px;
            border-right: 1px solid;
        }
    </style>
    <div id='wrapper' class='wrapper'>
    </div>
`

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

        this.rootNode = new LiteralExpressionNode(null);
        this.expression = this.rootNode;
        this._cursorNode = this.expression.nodes[0];

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
            this.insert(character);
            e.preventDefault();
        }
    }

    /**
     * OnFocus, start the cursor flashing
     */
    focus() {
        this._focused = true;
        this.cursorNode.toggleCursor('on');
    }

    /**
     * OnBlur, stop the cursor flashing
     */
    blur() {
        this._focused = false;
        this.cursorNode.toggleCursor('off');
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
     * @param  {LiteralNode} node The new cursorNode
     */
    set cursorNode(node) {
        this._cursorNode.toggleCursor('off');
        this._cursorNode = node;
    }


    /** MISCELLANEOUS (CHANGE WHEN THERE'S MORE STRUCTURE) */

    /**
     * Insert a character at the cursor position.
     * 
     * @param  {string} char The character to insert as a new node
     */
    insert(char) {
        var node = LiteralNode.buildFromCharacter(char);
        this.expression.insert(node);
        this.cursorNode = node;

        this.updateValue();
    }

    /**
     * Update the element's value to reflect the expression in rootNode
     */
    updateValue() {
        this.setAttribute('value', this.rootNode.value);
    }
}

customElements.define(tagname, MathInput);