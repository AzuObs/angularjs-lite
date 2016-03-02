(function() {
  "use strict";

  window.parse = function(expr) {
    var lexer = new Lexer();
    var parser = new Parser(lexer);

    return parser.parse(expr);
  };


  var Lexer = function() {

  };

  Lexer.prototype.lex = function(text) {

  };


  var AST = function(lexer) {
    this.lexer = lexer;
  };

  AST.prototype.ast = function(text) {
    this.token = this.lexer.lex(test);
  };


  var ASTCompiler = function(astBuilder) {
    this.astBuilder = astBuilder;
  };

  ASTCompiler.prototype.compile = function(text) {
    var ast = this.astBuilder.ast(text);
  };


  var Parser = function(lexer) {
    this.lexer = lexer;
    this.ast = new AST(this.lexer);
    this.ASTCompiler = new ASTCompiler(this.ast);
  };

  Parser.prototype.parse = function(text) {
    return this.ASTCompiler.compile(text);
  };
})();
