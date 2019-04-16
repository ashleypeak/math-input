class LiteralNode {
    constructor() {
        this._parent = null;
    }

    set parent(parent) {
        this._parent = parent;
    }

    get value() {
        throw new Error('get value() must be defined.');
    }

    get html() {
        throw new Error('get html() must be defined.');
    }

    static build_from_character(char) {
        return new LiteralCharacterNode(char);
    }
}

class LiteralExpressionNode extends LiteralNode {
    constructor() {
        super();

        this._nodes = new Array();
    }

    get value() {
        return this._nodes.reduce((acc, node) => acc + node.value, '');
    }

    get html() {
        var element = document.createElement('span');

        if(this.nodes.length === 0)
            element.setAttribute('class', 'empty-expression');

        this.nodes.forEach(function(node) {
            element.appendChild(node.html);
        });

        return element;
    }

    insert(node) {
        node.parent = this;
        this._nodes.push(node);
    }

    get nodes() {
        return this._nodes;
    }
}

class LiteralCharacterNode extends LiteralNode {
    constructor(char) {
        super();
        this.char = char;
    }

    get value() {
        return this.char;
    }

    get html() {
        var element = document.createElement('span');
        element.innerText = this.value;

        return element;
    }
}

export {LiteralExpressionNode, LiteralNode};