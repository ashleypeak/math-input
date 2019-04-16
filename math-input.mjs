import {LiteralExpressionNode, LiteralNode} from './literal-node.mjs';

const tagname = 'math-input';
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
        }

        .wrapper .empty-expression {
            background-color: #d9edf7;
            border: 1px solid #31708f;
            width: 7px;
            height: 20px;
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

        this.addEventListener('keydown', this.keydown);

        this.literal_tree = new LiteralExpressionNode(null);
        this.expression = this.literal_tree;
        this.render();
    }

    connectedCallback() {
        //proxy input
        var input = document.createElement('input');
        input.name = this.getAttribute('name');
        input.value = this.getAttribute('value');
        input.tabIndex = -1;
        input.setAttribute('class', 'real-input');
        this.appendChild(input);

        this.connected = true;
    }

    attributeChangedCallback(name, old, value) {
        if(this.connected) {
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

    insert(char) {
        var node = LiteralNode.build_from_character(char);
        this.expression.insert(node);
        console.log(this.expression.nodes)

        this.render();
    }

    render() {
        this.setAttribute('value', this.literal_tree.value);

        while(this.wrapper.firstChild) {
            this.wrapper.removeChild(this.wrapper.firstChild);
        }
        this.wrapper.appendChild(this.literal_tree.html);
    }
}

customElements.define(tagname, MathInput);