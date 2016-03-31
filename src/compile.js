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

  // a and b are directiveDefinitionObjects 
  function byPriority(a, b) {
    var diff = b.priority - a.priority;
    // if priorities are not the same, the highest priority goes first
    if (diff !== 0) {
      return diff;
    }
    // else we sort by directive name
    else {
      // if name are not equal, first unicode char (numbers coerced to char) order goes first
      if (a.name !== b.name) {
        return (a.name < b.name ? -1 : 1);
      }
      // else we sort by order of registration
      else {
        return a.index - b.index;
      }
    }
  }


  function $CompileProvider($provide, $rootScopeProvider) {
    // key: "myDirective + 'Directive'"
    // value: directiveFactory -> returns: directive object 
    // we keep track of these here, as we cannot get the provider that are held
    // in the providerCache outside of config code
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

            return factories.map(function(factory, i) {
              var directive = $injector.invoke(factory);
              directive.restrict = directive.restrict || "EA";
              directive.priority = directive.priority || 0;
              directive.name = directive.name || name;
              directive.index = i;
              return directive;
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
          var terminal = applyDirectivesToNode(directives, node);

          //recurse on children
          if (!terminal && node.childNodes && node.childNodes.length) {
            compileNodes(node.childNodes);
          }
        });
      }


      // return array of directive objects
      function collectDirectives(node) {
        function addDirective(directives, name, mode) {
          if (hasDirectives.hasOwnProperty(name)) {
            // array of directive objects
            var foundDirectives = $injector.get(name + "Directive");
            var applicableDirectives = foundDirectives.filter(function(dir) {
              return dir.restrict.indexOf(mode) !== -1;
            });
            directives.push.apply(directives, applicableDirectives);
          }
        }

        // holds directive object (not factories!)
        var directives = [];

        if (node.nodeType === Node.ELEMENT_NODE) {
          // node element
          var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
          addDirective(directives, normalizedNodeName, "E");

          // node attr
          _.forEach(node.attributes, function(attr) {
            var normalizedAttrName = directiveNormalize(attr.name.toLowerCase());
            if (/^ngAttr[A-Z]/.test(normalizedAttrName)) {
              normalizedAttrName = normalizedAttrName[6].toLowerCase() + normalizedAttrName.substr(7);
            }
            addDirective(directives, normalizedAttrName, "A");
          });

          // node class
          _.forEach(node.classList, function(cls) {
            var normalizedClassName = directiveNormalize(cls);
            addDirective(directives, normalizedClassName, "C");
          });
        }

        // comment node
        else if (node.nodeType === Node.COMMENT_NODE) {
          var match = /^\s*directive\:\s*([\d\w\-_]+)/.exec(node.nodeValue);
          if (match) {
            addDirective(directives, directiveNormalize(match[1]), "M");
          }
        }

        //sort by priority
        //then sort by name
        //then sort by order in which is was declared
        directives.sort(byPriority);
        return directives;
      }


      // apply array of directive object to node
      function applyDirectivesToNode(directives, compileNode) {
        var $compileNode = $(compileNode);
        var termnial = false;
        var terminalPriority = -Number.MAX_VALUE;

        directives.forEach(function(directive) {
          if (directive.priority < terminalPriority) {
            return false;
          }

          if (directive.compile) {
            directive.compile($compileNode);
          }
          if (directive.terminal) {
            terminal = true;
            terminalPriority = directive.terminal;
          }
        });

        return terminal;
      }


      return compile;
    }]; //end this.$get
  } //end $CompileProvider
  $CompileProvider.$inject = ["$provide"];


  window.$CompileProvider = $CompileProvider;
})();
