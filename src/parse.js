(function() {
  "use strict";

  window.parse = function(expr) {
    var lexer = new Lexer();
    var parser = new Parser(lexer);

    return parser.parse(expr);
  };


  var Parser = function(lexer) {
    this.lexer = lexer;
    this.ast = new AST(this.lexer);
    this.ASTCompiler = new ASTCompiler(this.ast);
  };


  Parser.prototype.parse = function(text) {
    return this.ASTCompiler.compile(text);
  };


  // 
  // LEXER
  // 

  var Lexer = function() {};

  Lexer.prototype.lex = function(text) {
    this.text = text;
    this.index = 0;
    this.ch = undefined;
    this.tokens = [];

    while (this.index < this.text.length) {
      this.ch = this.text.charAt(this.index);

      if (this.isNumber(this.ch)) {
        this.readNumber();
      }
      else {
        throw "Unexpected next character:" + this.ch;
      }
    }

    return this.tokens;
  };

  Lexer.prototype.isNumber = function(ch) {
    return "0" <= ch && ch <= "9";
  };


  Lexer.prototype.readNumber = function() {
    var number = "";

    while (this.index < this.text.length) {
      var ch = this.text.charAt(this.index);

      if (this.isNumber(ch)) {
        number += ch;
      }
      else {
        break;
      }

      this.index++;
    }

    this.tokens.push({
      text: number,
      value: Number(number)
    });
  };


  //
  // AST Builder
  // 

  var AST = function(lexer) {
    this.lexer = lexer;
  };


  AST.prototype.ast = function(text) {
    this.tokens = this.lexer.lex(text);
    return this.program();
  };


  AST.Program = "Program";
  AST.Literal = "Literal";


  AST.prototype.program = function() {
    return {
      type: AST.Program,
      body: this.constant()
    };
  };


  AST.prototype.constant = function() {
    return {
      type: AST.Literal,
      value: this.tokens[0].value
    };
  };


  // 
  // AST Compiler
  // 

  var ASTCompiler = function(astBuilder) {
    this.astBuilder = astBuilder;
  };


  ASTCompiler.prototype.compile = function(text) {
    var ast = this.astBuilder.ast(text);
    this.state = {
      body: []
    };

    this.recurse(ast);

    /* jshint -W054 */
    return new Function(this.state.body.join(""));
    /* jshint +W054 */
  };


  ASTCompiler.prototype.recurse = function(ast) {
    switch (ast.type) {
      case AST.Program:
        this.state.body.push("return ", this.recurse(ast.body), ";");
        break;

      case AST.Literal:
        return ast.value;

      default:
        throw "Error the ast.type is not recognised";
    }
  };


})();

//165
