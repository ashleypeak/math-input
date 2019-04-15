const tagname = 'math-input';
const template = document.createElement('template');
template.innerHTML = `
    <style type='text/css'>
        .wrapper {width:100px; height:100px; border:1px solid #ff0000;}
    </style>
    <div id='wrapper' class='wrapper'>
    </div>
`

class MathInput extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.addEventListener('keydown', function(e) {
            var value = this.getAttribute('value');
            if(value === null)
                value = '';

            this.setAttribute('value', value + e.key);
        });
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
}

customElements.define(tagname, MathInput);