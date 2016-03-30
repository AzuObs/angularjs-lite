(function() {
  "use strict";

  // x || data followed by : || - || _ 
  var PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i;

  function directiveNormalize(name) {
    return _.camelCase(name.replace(PREFIX_REGEXP, ""));
  }

  function nodeName(element) {
    return element.nodeName ? element.nodeName : element[0].nodeName;
  }


  function $CompileProvider($provide) {
    var hasDirectives = {};


    ////////////////////
    // this.directive //
    ////////////////////
    this.directive = function(name, directiveFactory) {
      if (typeof name === "string") {
        if (name === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid directive name";
        }
        if (!hasDirectives.hasOwnProperty(name)) {
          hasDirectives[name] = [];

          // this allows one directive name to hold several directive declarations
          // and it will return the directives, not that directives are hence never held in the providers,
          // instead it is this "providing" function that is
          $provide.factory(name + "Directive", ["$injector", function($injector) {
            var factories = hasDirectives[name];

            return factories.map(function(factory) {
              return $injector.invoke(factory);
            });
          }]);
        }
        hasDirectives[name].push(directiveFactory);
      }

      // support the unusual way of creating directives by object
      else {
        Object.keys(name).forEach(function(k) {
          // (name, directiveFn)
          this.directive(k, name[k]);
        }, this);
      }
    };


    ////////////////////////////
    // this.$get aka $compile //
    ////////////////////////////
    this.$get = ["$injector", function($injector) {

      // $compileNodes = jqLite wrapped html
      function compile($compileNodes) {
        return compileNodes($compileNodes);
      }

      function compileNodes($compileNodes) {
        _.forEach($compileNodes, function(node) {
          // get custom-directives from the node
          var directives = collectDirectives(node);
          // apply changes to the node
          applyDirectivesToNode(directives, node);

          //recurse on children
          if (node.childNodes && node.childNodes.length) {
            compileNodes(node.childNodes);
          }
        });
      }

      function collectDirectives(node) {
        function addDirective(directives, name) {
          if (hasDirectives.hasOwnProperty(name)) {
            directives.push.apply(directives, $injector.get(name + "Directive"));
          }
        }

        var directives = [];

        if (node.nodeType === Node.ELEMENT_NODE) {
          var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
          addDirective(directives, normalizedNodeName);

          _.forEach(node.attributes, function(attr) {
            var normalizedAttrName = directiveNormalize(attr.name.toLowerCase());
            if (/^ngAttr[A-Z]/.test(normalizedAttrName)) {
              normalizedAttrName = normalizedAttrName[6].toLowerCase() + normalizedAttrName.substr(7);
            }
            addDirective(directives, normalizedAttrName);
          });

          _.forEach(node.classList, function(cls) {
            var normalizedClassName = directiveNormalize(cls);
            addDirective(directives, normalizedClassName);
          });
        }

        else if (node.nodeType === Node.COMMENT_NODE) {
          var match = /^\s*directive\:\s*([\d\w\-_]+)/.exec(node.nodeValue);
          if (match) {
            addDirective(directives, directiveNormalize(match[1]));
          }
        }

        return directives;
      }


      function applyDirectivesToNode(directives, compileNode) {
        var $compileNode = $(compileNode);
        directives.forEach(function(directive) {
          if (directive.compile) {
            directive.compile($compileNode);
          }
        });
      }


      return compile;
    }]; //end this.$get
  } //end $CompileProvider
  $CompileProvider.$inject = ["$provide"];


  window.$CompileProvider = $CompileProvider;
})();
