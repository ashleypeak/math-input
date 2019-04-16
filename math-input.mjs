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
        }

        .wrapper span {
            display: inline-block;
            vertical-align: middle;
            padding: 0px 1px 0px 0px;
            cursor: text;
            min-width: 7px;
            min-height: 20px;
        }

        .wrapper span.cursor {
            padding-right: 0px;
            border-right: 1px solid;
        }

        .wrapper .empty-expression {
            background-color: #d9edf7;
            border: 1px solid #31708f;
        }

        .mathinput .empty-expression.cursor-inside {
            background-color: #dff0d8;
            border: 1px solid #3c763d;
        }
    </style>
    <div id='wrapper' class='wrapper'>
    </div>
`

class MathInput extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.wrapper = this.shadowRoot.getElementById('wrapper');

        this.literalTree = new LiteralExpressionNode(null);
        this.expression = this.literalTree;
        this._cursorNode = this.expression.nodes[0];

        this.render();

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

    attributeChangedCallback(name, old, value) {
        if(this._connected) {
            this.shadowRoot.getElementById('wrapper').innerHTML = value;
            this.getElementsByClassName('real-input')[0].value = value;
        }
    }

    static get observedAttributes() {
        return ['value'];
    }

    keydown(e) {
        if(e.ctrlKey)   //don't capture control combinations
            return;
        
        var character = e.key || e.keyCode;
        if(/^[a-zA-Z0-9.+\-*()\^|,='<>~]$/.test(character)) {
            this.insert(character);
            e.preventDefault();
        }
    }

    focus() {
        this._focused = true;
        this.cursorNode.toggleCursor('on');
    }

    blur() {
        this._focused = false;
        this.cursorNode.toggleCursor('off');
    }

    get cursorNode() {
        return this._cursorNode;
    }

    set cursorNode(node) {
        this._cursorNode.toggleCursor('off');
        this._cursorNode = node;
    }

    insert(char) {
        var node = LiteralNode.buildFromCharacter(char);
        this.expression.insert(node);
        this.cursorNode = node;

        this.render();
    }

    render() {
        this.setAttribute('value', this.literalTree.value);

        while(this.wrapper.firstChild) {
            this.wrapper.removeChild(this.wrapper.firstChild);
        }
        this.wrapper.appendChild(this.literalTree.element);
    }
}

customElements.define(tagname, MathInput);