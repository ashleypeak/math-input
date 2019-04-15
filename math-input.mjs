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
    </style>
    <div id='wrapper' class='wrapper'>
    </div>
`

// `
// <div class="mathinput" ng-class="{'mathinput-error': !output.isValid}" tabindex="0"
//  ng-keypress="control.keypress($event)" ng-keydown="control.keydown($event)" ng-focus="control.focus()"
//  ng-blur="control.blur()" ng-copy="control.copy()" ng-cut="control.cut()" ng-paste="control.paste($event)">
// <adm-math-expression cursor="cursor" expression="literalTree" control="control"></adm-math-expression>
// <input type="hidden" name="{{name}}" value="{{model}}" />
// <input type="hidden" class="clipboard" />
// </div>
// `

class MathInput extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.addEventListener('keydown', this.keydown);
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

        // scope.output.write();
    }

    insert(character) {
        var value = this.getAttribute('value') || '';

        this.setAttribute('value', value + character);
    }
}

customElements.define(tagname, MathInput);