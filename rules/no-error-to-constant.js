const WHERE = "https://github.com/ramtoshiya/oxlint-rules#ramtoshiyano-error-to-constant";

const unwrap = (node) => (node.type === "ParenthesizedExpression" ? unwrap(node.expression) : node);

function isConstant(node) {
  const expression = unwrap(node);
  switch (expression.type) {
    case "Literal":
      return !expression.regex;
    case "TemplateLiteral":
      return expression.expressions.length === 0;
    case "Identifier":
      return expression.name === "undefined";
    case "UnaryExpression":
      if (expression.operator === "void") return isConstant(expression.argument);
      return (expression.operator === "-" || expression.operator === "+" || expression.operator === "!") && expression.argument.type === "Literal";
    case "ArrayExpression":
      return expression.elements.length === 0;
    case "ObjectExpression":
      return expression.properties.length === 0;
    default:
      return false;
  }
}

function constantReturned(statements) {
  if (statements.length === 0) return { empty: true };
  if (statements.length !== 1 || statements[0].type !== "ReturnStatement") return null;
  const { argument } = statements[0];
  if (argument === null) return { empty: true };
  return isConstant(argument) ? { node: argument } : null;
}

function constantOfHandler(handler) {
  const isFunction = handler.type === "ArrowFunctionExpression" || handler.type === "FunctionExpression";
  if (!isFunction) return null;
  if (handler.body.type === "BlockStatement") return constantReturned(handler.body.body);
  return isConstant(handler.body) ? { node: handler.body } : null;
}

function describe(sourceCode, found) {
  if (found.empty) return "nothing";
  const text = sourceCode.getText(found.node).replace(/\s+/g, " ");
  return text.length > 40 ? `${text.slice(0, 37)}...` : text;
}

const rule = {
  meta: {
    type: "problem",
    docs: { description: "Report a catch path that discards the error and returns a constant.", url: WHERE },
    messages: {
      errorToConstant:
        "{{form}} discards the error and returns {{value}}. " +
        "Why it matters: a missing file, a network failure, and a bug in the code all look the same to the caller, and nobody sees the failure again. " +
        `Where the pattern lives: ${WHERE}. ` +
        "Fix: catch only the error you expect (for example `error.code === \"ENOENT\"`) and return the constant for that case, then log or rethrow everything else. " +
        "If every failure really is acceptable, record the site in the suppressions file.",
    },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    const report = (node, form, found) =>
      context.report({ node, messageId: "errorToConstant", data: { form, value: describe(sourceCode, found) } });
    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== "MemberExpression" || callee.computed || callee.property.type !== "Identifier") return;
        const handlerIndex = callee.property.name === "catch" ? 0 : callee.property.name === "then" ? 1 : -1;
        const handler = node.arguments[handlerIndex];
        if (!handler) return;
        const found = constantOfHandler(handler);
        if (found) report(handler, `\`.${callee.property.name}(...)\` rejection handler`, found);
      },
      CatchClause(node) {
        const found = constantReturned(node.body.body);
        if (found) report(node, "This `catch` block", found);
      },
    };
  },
};

export default rule;
