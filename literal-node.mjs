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

    get element() {
        throw new Error('get element() must be defined.');
    }

    addClass(className) {
        var classes = this._element.className.split(' ');

        var classPos = classes.indexOf(className);
        if(classPos === -1) {
            classes.push(className);
        }

        this._element.className = classes.join(' ');
    }

    removeClass(className) {
        var classes = this._element.className.split(' ');

        var classPos = classes.indexOf(className);
        if(classPos !== -1) {
            classes.splice(classPos, 1);
        }

        this._element.className = classes.join(' ');
    }

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

    toggleCursor(state='toggle') {
        if(state == 'toggle') {
            this.toggleClass('cursor');
        } else if(state == 'on') {
            this.addClass('cursor');
        } else if(state == 'off') {
            this.removeClass('cursor');
        }
    }

    static buildFromCharacter(char) {
        return new LiteralCharacterNode(char);
    }
}

class LiteralExpressionNode extends LiteralNode {
    constructor() {
        super();

        this._nodes = new Array();
        this._element = document.createElement('span');
        this._element.setAttribute('class', 'empty-expression');

        //every expression starts with a span, serves as the cursor location before
        //the first element
        this.insert(new LiteralExpressionStartNode());
    }

    get value() {
        return this._nodes.reduce((acc, node) => acc + node.value, '');
    }

    get element() {
        return this._element;
    }

    get nodes() {
        return this._nodes;
    }

    insert(node) {
        node.parent = this;
        this._nodes.push(node);
        this._element.appendChild(node.element);

        if(this.nodes.length > 1) //1 == empty because of the LiteralExpresionStartNode
            this.removeClass('empty-expression');
    }
}

class LiteralExpressionStartNode extends LiteralNode {
    constructor() {
        super();

        this._element = document.createElement('span');
        this._element.className = 'empty';
    }

    get value() {
        return '';
    }

    get element() {
        return this._element;
    }
}

class LiteralCharacterNode extends LiteralNode {
    constructor(char) {
        super();
        this._char = char;

        this._element = document.createElement('span');
        this._element.innerText = this._char;
    }

    get value() {
        return this._char;
    }

    get element() {
        return this._element;
    }
}

export {LiteralExpressionNode, LiteralNode};