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
 * Given a string representing the nodes inside the radicand, return an
 * ExpressionNode containing just a SquareRotNode with the described radicand.
 *
 * NOTE: Returns ExpressionNode, not DivisionNode
 *
 * @param  {String} numNodes  The nodes to fill the root with
 * @return {ExpressionNode}   An ExpressionNode containing the SquareRootNode
 */
function sqrt(radicandNodes) {
    let expression = MathNode.buildRootNode();
    let sqrtNode = MathNode.buildFromName('sqrt');
    expression.endNode.insertAfter(sqrtNode);

    expr(radicandNodes, sqrtNode.radicand);

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
        // start at node index 1 to ignore the StartNode
        // insertAfter removes the node from tail, so just keep appending
        // nodes[1] until nodes has a length of 1.
        while(tail[i].nodes.length > 1) {
            head.endNode.insertAfter(tail[i].nodes[1]);
        }
    }

    return head;
}

test('construct-cn', function() {
    expect(expr('1').value).toBe('<cn>1</cn>');
});

test('construct-ci', function() {
    expect(expr('x').value).toBe('<ci>x</ci>');
});

test('construct-pi', function() {
    expect(expr('pi').value).toBe('<pi/>');
});

test('construct-e', function() {
    expect(expr('e').value).toBe('<exponentiale/>');
});

test('construct-float', function() {
    expect(expr('1.5').value).toBe('<cn>1.5</cn>');
});

test('construct-parentheses', function() {
    expect(expr('(x)').value).toBe('<ci>x</ci>');
});

test('construct-abs', function() {
    expect(expr('|x|').value).toBe('<apply><abs/><ci>x</ci></apply>');
});

test('construct-negative-cn', function() {
    expect(expr('-1').value).toBe('<apply><minus/><cn>1</cn></apply>');
});

test('construct-negative-ci', function() {
    expect(expr('-x').value).toBe('<apply><minus/><ci>x</ci></apply>');
});

test('construct-sin', function() {
    expect(expr('sin(x)').value).toBe('<apply><sin/><ci>x</ci></apply>');
});

test('construct-cos', function() {
    expect(expr('cos(x)').value).toBe('<apply><cos/><ci>x</ci></apply>');
});

test('construct-tan', function() {
    expect(expr('tan(x)').value).toBe('<apply><tan/><ci>x</ci></apply>');
});

test('construct-ln', function() {
    expect(expr('ln(x)').value).toBe('<apply><ln/><ci>x</ci></apply>');
});

test('construct-plus', function() {
    expect(expr('1+x').value).toBe('<apply><plus/><cn>1</cn><ci>x</ci></apply>');
});

test('construct-minus', function() {
    expect(expr('1-x').value).toBe('<apply><minus/><cn>1</cn><ci>x</ci></apply>');
});

test('construct-times', function() {
    expect(expr('1*x').value).toBe('<apply><times/><cn>1</cn><ci>x</ci></apply>');
});

test('construct-sqrt', function() {
    expect(sqrt('3').value).toBe('<apply><root/><degree><cn>2</cn></degree><cn>3</cn></apply>');
});

test('construct-bracketing', function() {
    expect(expr('1-(x+1)').value).toBe('<apply><minus/><cn>1</cn><apply><plus/><ci>x</ci><cn>1</cn></apply></apply>');
    expect(expr('1-x+1').value).toBe('<apply><plus/><apply><minus/><cn>1</cn><ci>x</ci></apply><cn>1</cn></apply>');
});

test('construct-divide-cn-cn', function() {
    expect(div('1','2').value).toBe('<apply><divide/><cn>1</cn><cn>2</cn></apply>');
});

test('construct-divide-ci-cn', function() {
    expect(div('1','x').value).toBe('<apply><divide/><cn>1</cn><ci>x</ci></apply>');
});

test('construct-divide-negative-denominator', function() {
    expect(div('1','-x').value).toBe('<apply><divide/><cn>1</cn><apply><minus/><ci>x</ci></apply></apply>');
});

test('construct-times-from-input', function() {
    expect(conc(expr('1'), expr('x')).value).toBe('<apply><times/><cn>1</cn><ci>x</ci></apply>');
});

test('construct-exponent-from-input', function() {
    expect(conc(expr('1'), pow('x')).value).toBe('<apply><power/><cn>1</cn><ci>x</ci></apply>');
});

test('construct-nested-functions', function() {
    expect(expr('sin(cos(x))').value).toBe('<apply><sin/><apply><cos/><ci>x</ci></apply></apply>');
    expect(expr('-sin(cos(x))').value).toBe('<apply><minus/><apply><sin/><apply><cos/><ci>x</ci></apply></apply></apply>');
});

// this tests a situation where, due to poorly written regex, several symbols
// before a 'π'' would be rendered as pi themselves, producing (in this case)
//     <apply><times/><pi/><pi/></apply>
test('regression-times-e-pi-character', function() {
    expect(conc(expr('e'), expr('π')).value).toBe('<apply><times/><exponentiale/><pi/></apply>');
});

// this tests the test suite itself - there was an error in the conc() function
// which would only copy across every second character in the `tail` argument
// due to a misunderstanding of the insertAfter() function. See conc().
test('regression-times-e-pi-text', function() {
    expect(conc(expr('e'), expr('pi')).value).toBe('<apply><times/><exponentiale/><pi/></apply>');
});

/**
 * Given a string of MathML, return an ExpressionNode built from that string.
 *
 * @param  {String}         mml The MathML to build the expression from
 * @return {ExpressionNode}     The expression
 */
function exprFromMathML(mml) {
    let expression = MathNode.buildRootNode();

    expression.value = mml;

    return expression;
}

test('from-mathml-cn', function() {
    let mml = '<cn>1</cn>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-cn-float', function() {
    let mml = '<cn>1.5</cn>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-ci', function() {
    let mml = '<ci>x</ci>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-pi', function() {
    let mml = '<pi/>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-e', function() {
    let mml = '<exponentiale/>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-infinity', function() {
    let mml = '<infinity/>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-sin', function() {
    let mml = '<apply><sin/><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-cos', function() {
    let mml = '<apply><cos/><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-tan', function() {
    let mml = '<apply><tan/><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-abs', function() {
    let mml = '<apply><abs/><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-ln', function() {
    let mml = '<apply><ln/><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-negative-cn', function() {
    let mml = '<apply><minus/><cn>1</cn></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-negative-ci', function() {
    let mml = '<apply><minus/><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-plus', function() {
    let mml = '<apply><plus/><cn>1</cn><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-minus', function() {
    let mml = '<apply><minus/><cn>1</cn><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-times', function() {
    let mml = '<apply><times/><cn>1</cn><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-power', function() {
    let mml = '<apply><power/><cn>1</cn><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-power-nonunit-base', function() {
    let mml = '<apply><power/><apply><plus/><cn>1</cn><cn>2</cn></apply><ci>x</ci></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-sqrt', function() {
    let mml = '<apply><root/><degree><cn>2</cn></degree><apply><plus/><cn>3</cn><ci>x</ci></apply></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

// We use a different, but equivalent, MathML string for the output because
// the system always outputs the MathML of a square root with the radix
// specified.
test('from-mathml-sqrt-noradix', function() {
    let mml = '<apply><root/><apply><plus/><cn>3</cn><ci>x</ci></apply></apply>';
    let mml_output = '<apply><root/><degree><cn>2</cn></degree><apply><plus/><cn>3</cn><ci>x</ci></apply></apply>';
    expect(exprFromMathML(mml).value).toBe(mml_output);
});

test('from-mathml-bracketing', function() {
    let mml1 = '<apply><minus/><cn>1</cn><apply><plus/><ci>x</ci><cn>1</cn></apply></apply>';
    let mml1Expr = exprFromMathML(mml1);
    expect(mml1Expr.value).toBe(mml1);

    // precis is a purely internal structure, and shouldn't really be tested,
    // but it's unlikely to change format and is the easiest way to check
    // the visual output of the <math-input> field.
    expect(mml1Expr.precis).toBe('_1-(x+1)');

    let mml2 = '<apply><plus/><apply><minus/><cn>1</cn><ci>x</ci></apply><cn>1</cn></apply>';
    let mml2Expr = exprFromMathML(mml2);
    expect(mml2Expr.value).toBe(mml2);
    expect(mml2Expr.precis).toBe('_1-x+1');

    let mml3 = '<apply><times/><cn>1</cn><apply><plus/><ci>x</ci><cn>1</cn></apply></apply>';
    let mml3Expr = exprFromMathML(mml3);
    expect(mml3Expr.value).toBe(mml3);
    expect(mml3Expr.precis).toBe('_1*(x+1)');
});

test('from-mathml-divide-cn-cn', function() {
    let mml = '<apply><divide/><cn>1</cn><cn>2</cn></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-divide-ci-cn', function() {
    let mml = '<apply><divide/><cn>1</cn><cn>2</cn></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-divide-negative-denominator', function() {
    let mml = '<apply><divide/><cn>1</cn><apply><minus/><ci>x</ci></apply></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-sin-divide', function() {
    let mml = '<apply><sin/><apply><divide/><cn>1</cn><ci>x</ci></apply></apply>';
    expect(exprFromMathML(mml).value).toBe(mml);
});

test('from-mathml-nested-functions', function() {
    let mml1 = '<apply><sin/><apply><cos/><ci>x</ci></apply></apply>';
    let mml1Expr = exprFromMathML(mml1);
    expect(mml1Expr.value).toBe(mml1);
    expect(mml1Expr.precis).toBe('_sin(cos(x))');

    let mml2 = '<apply><minus/><apply><cos/><apply><sin/><ci>x</ci></apply></apply></apply>';
    let mml2Expr = exprFromMathML(mml2);
    expect(mml2Expr.value).toBe(mml2);
    expect(mml2Expr.precis).toBe('_-cos(sin(x))');
});
