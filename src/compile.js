(function() {
  "use strict";

  // "x" OR "data" followed by ":" OR "-" OR "_"
  var PREFIX_REGEXP = /(x[\:\-_]|data[\:\-_])/i;
  var BOOLEAN_ELEMENTS = {
    INPUT: true,
    SELECT: true,
    OPTION: true,
    TEXTAREA: true,
    BUTTON: true,
    FORM: true,
    DETAILS: true
  };
  var BOOLEAN_ATTRS = {
    multiple: true,
    selected: true,
    checked: true,
    disabled: true,
    readOnly: true,
    required: true,
    open: true
  };


  // strip prefix from directives and convert to camelCase
  function directiveNormalize(name) {
    return _.camelCase(name.replace(PREFIX_REGEXP, ""));
  }

  // get name of a node
  function nodeName(element) {
    return element.nodeName ? element.nodeName : element[0].nodeName;
  }

  // return true if HTML node attribute is a boolean eg "required", "checked", "disabled"
  function isBooleanAttribute(node, attrName) {
    return BOOLEAN_ATTRS[attrName] && BOOLEAN_ELEMENTS[node.nodeName];
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

  // scans a node for the nodes containing startAttr, endAttr, and everything in between
  function groupScan(node, startAttr, endAttr) {
    var nodes = [];
    if (startAttr && node && node.hasAttribute(startAttr)) {
      //use for nested multi-elements
      //<div a-start></div>
      //<div a-start></div>
      //<div a-end></div>
      //<div a-end></div>
      var depth = 0;
      do {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.hasAttribute(startAttr)) {
            depth++;
          }
          else if (node.hasAttribute(endAttr)) {
            depth--;
          }
        }
        nodes.push(node);
        node = node.nextSibling;
      } while (depth > 0);
    }
    else {
      nodes.push(node);
    }
    return $(nodes);
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
      function Attributes(element) {
        this.$$element = element;
      }
      Attributes.prototype = {
        $set: function(key, value) {
          this[key] = value;
          this.$$element.attr(key, value);
        }
      };

      function directiveIsMultiElement(name) {
        if (hasDirectives.hasOwnProperty(name)) {
          var directives = $injector.get(name + "Directive");
          return directives.some(function(dir) {
            return dir.multiElement === true;
          });
        }
        else {
          return false;
        }
      }


      function addDirective(directives, name, mode, attrStartName, attrEndName) {
        if (hasDirectives.hasOwnProperty(name)) {
          // array of directive objects
          var foundDirectives = $injector.get(name + "Directive");
          var applicableDirectives = foundDirectives.filter(function(dir) {
            return dir.restrict.indexOf(mode) !== -1;
          });

          //check if multi-element
          applicableDirectives.forEach(function(directive) {
            if (attrStartName) {
              directive = _.create(directive, {
                $$start: attrStartName,
                $$end: attrEndName
              });
            }
            directives.push(directive);
          });
        }
      }


      // $compileNodes = jqLite wrapped html
      function compile($compileNodes) {
        return compileNodes($compileNodes);
      }


      function compileNodes($compileNodes) {
        _.forEach($compileNodes, function(node) {
          var attrs = new Attributes($(node));
          var directives = collectDirectives(node, attrs);
          var terminal = applyDirectivesToNode(directives, node, attrs);

          // recurse on childrens unless "termnial" eg ng-if
          if (!terminal && node.childNodes && node.childNodes.length) {
            compileNodes(node.childNodes);
          }
        });
      }


      // return array of directive objects
      function collectDirectives(node, attrs) {
        // holds directive object (not factories!)
        var directives = [];

        // element
        if (node.nodeType === Node.ELEMENT_NODE) {
          var normalizedNodeName = directiveNormalize(nodeName(node).toLowerCase());
          addDirective(directives, normalizedNodeName, "E");

          // attr
          _.forEach(node.attributes, function(attr) {
            var attrStartName, attrEndName;
            var name = attr.name;
            var normalizedAttrName = directiveNormalize(name.toLowerCase());

            var isNgAttr = /^ngAttr[A-Z]/.test(normalizedAttrName);
            if (isNgAttr) {
              // this-is-kebab-case
              name = _.kebabCase(normalizedAttrName[6].toLowerCase() + normalizedAttrName.substr(7));
            }

            var directiveNName = normalizedAttrName.replace(/(Start|End)$/, "");
            if (directiveIsMultiElement(directiveNName)) {
              if (/Start$/.test(normalizedAttrName)) {
                attrStartName = name;
                attrEndName = name.substring(0, name.length - 5) + "end";
                name = name.substring(0, name.length - 6);
              }
            }

            normalizedAttrName = directiveNormalize(name.toLowerCase());

            // add to attrs
            if (isNgAttr || !attrs.hasOwnProperty(normalizedAttrName)) {
              attrs[normalizedAttrName] = attr.value.trim();
              if (isBooleanAttribute(node, normalizedAttrName)) {
                attrs[normalizedAttrName] = true;
              }
            }

            addDirective(directives, normalizedAttrName, "A", attrStartName, attrEndName);
          });

          // class
          _.forEach(node.classList, function(cls) {
            var normalizedClassName = directiveNormalize(cls);
            addDirective(directives, normalizedClassName, "C");
          });
        }

        // comment
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
      function applyDirectivesToNode(directives, compileNode, attrs) {
        var $compileNode = $(compileNode);
        var terminal = false;
        var terminalPriority = -Number.MAX_VALUE;

        directives.forEach(function(directive) {
          // multi-element
          if (directive.$$start) {
            $compileNode = groupScan(compileNode, directive.$$start, directive.$$end);
          }

          if (directive.priority < terminalPriority) {
            return false;
          }

          if (directive.compile) {
            directive.compile($compileNode, attrs);
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
