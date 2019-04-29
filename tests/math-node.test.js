import MathNode from '../math-node.js';

/**
 * Given a string representing a series of nodes `nodes`, either:
 *  - if `expression` is undefined, create an expression and fill it with
 *    `nodes`
 *  - or, if `expression` is defined, fill `expression` with `nodes`
 *
 * Then return the constructed expression.
 *
 * In practice, this function serves two purposes. If `expression` is
 * undefined, its principle purpose is to create a new expression and return
 * it. If `expression` is defined, its purpose is to load `nodes` into said
 * expression, and the return value is generally unused.
 * 
 * @param  {String}         nodes      The nodes to fill the expression with
 * @param  {ExpressionNode} expression See above
 * @return {ExpressionNode}            The filled expression
 */
function expr(nodes, expression=MathNode.buildRootNode()) {
    let node = null;
    for(let i = 0; i < nodes.length; i++) {
        node = MathNode.buildFromCharacter(nodes[i]);
        expression.endNode.insertAfter(node);
    }
    return expression;
}

/**
 * Given two strings representing the nodes in the numerator and denominator,
 * return an ExpressionNode containing just a DivisionNode with the described
 * numerator and denominator.
 *
 * NOTE: Returns ExpressionNode, not DivisionNode
 * 
 * @param  {String} numNodes   The nodes to fill the numerator with
 * @param  {String} denomNodes The nodes to fill the denominator with
 * @return {ExpressionNode}    An ExpressionNode containing the DivisionNode
 */
function div(numNodes, denomNodes) {
    let expression = expr('/');
    let divNode = expression.endNode;
    expr(numNodes, divNode.numerator);
    expr(denomNodes, divNode.denominator);

    return expression;
}

/**
 * Given a string representing the nodes in the exponent, return an
 * ExpressionNode containing just an ExponentNode with the described exponent.
 *
 * NOTE: Returns ExpressionNode, not ExponentNode
 * 
 * @param  {String} expNodes The nodes to fill the exponent with
 * @return {ExpressionNode}  An ExpressionNode containing the ExponentNode
 */
function pow(expNodes) {
    let expression = expr('^');
    let expNode = expression.endNode;
    expr(expNodes, expNode.exponent);

    return expression;
}

 /**
 * Given one or more ExpressionNodes, concatenate their nodes into a single
 * expression and return that.
 * 
 * @param  {ExpressionNode}    head The first ExpressionNode
 * @param  {...ExpressionNode} tail The rest of the ExpressionNodes
 * @return {ExpressionNode}         The concatenated ExpressionNode
 */
function conc(head, ...tail) {
    for(let i = 0; i < tail.length; i++) {
        // start at j=1 to ignore the StartNode
        for(let j = 1; j < tail[i].nodes.length; j++) {
            head.endNode.insertAfter(tail[i].nodes[j]);
        }
    }

    return head;
}

test('basics', () => {
    expect(expr('1').value).toBe('<cn>1</cn>');
    expect(expr('x').value).toBe('<ci>x</ci>');
    expect(expr('pi').value).toBe('<pi/>');
    expect(expr('e').value).toBe('<csymbol>e</csymbol>');
    expect(expr('1.5').value).toBe('<cn>1.5</cn>');
    expect(expr('(x)').value).toBe('<ci>x</ci>');
    expect(expr('|x|').value).toBe('<apply><abs/><ci>x</ci></apply>');

    expect(expr('-1').value).toBe('<apply><minus/><cn>1</cn></apply>');
    expect(expr('-x').value).toBe('<apply><minus/><ci>x</ci></apply>');

    expect(expr('sin(x)').value).toBe('<apply><sin/><ci>x</ci></apply>');
    expect(expr('cos(x)').value).toBe('<apply><cos/><ci>x</ci></apply>');
    expect(expr('tan(x)').value).toBe('<apply><tan/><ci>x</ci></apply>');
    expect(expr('ln(x)').value).toBe('<apply><ln/><ci>x</ci></apply>');

    expect(expr('1+x').value).toBe('<apply><plus/><cn>1</cn><ci>x</ci></apply>');
    expect(expr('1-x').value).toBe('<apply><minus/><cn>1</cn><ci>x</ci></apply>');
    expect(expr('1*x').value).toBe('<apply><times/><cn>1</cn><ci>x</ci></apply>');

    expect(expr('1-(x+1)').value).toBe('<apply><minus/><cn>1</cn><apply><plus/><ci>x</ci><cn>1</cn></apply></apply>');
    expect(expr('1-x+1').value).toBe('<apply><plus/><apply><minus/><cn>1</cn><ci>x</ci></apply><cn>1</cn></apply>');


    expect(div('1','2').value).toBe('<apply><divide/><cn>1</cn><cn>2</cn></apply>');
    expect(div('1','x').value).toBe('<apply><divide/><cn>1</cn><ci>x</ci></apply>');
    expect(div('1','-x').value).toBe('<apply><divide/><cn>1</cn><apply><minus/><ci>x</ci></apply></apply>');

    expect(conc(expr('1'), expr('x')).value).toBe('<apply><times/><cn>1</cn><ci>x</ci></apply>');
    expect(conc(expr('1'), pow('x')).value).toBe('<apply><power/><cn>1</cn><ci>x</ci></apply>');

    expect(expr('sin(cos(x))').value).toBe('<apply><sin/><apply><cos/><ci>x</ci></apply></apply>');
    expect(expr('-sin(cos(x))').value).toBe('<apply><minus/><apply><sin/><apply><cos/><ci>x</ci></apply></apply></apply>');
});