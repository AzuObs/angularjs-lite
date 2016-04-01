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
    this.$get = ["$injector", "$rootScope", function($injector, $rootScope) {
      function Attributes(element) {
        this.$$element = element;
        this.$attr = {};
      }
      Attributes.prototype = {
        $set: function(key, value, writeAttr, attrName) {
          this[key] = value;

          if (isBooleanAttribute(this.$$element[0], key)) {
            this.$$element.prop(key, value);
          }

          if (!attrName) {
            if (this.$attr[key]) {
              attrName = this.$attr[key];
            }
            else {
              attrName = this.$attr[key] = _.kebabCase(key);
            }
          }
          else {
            this.$attr[key] = attrName;
          }

          if (writeAttr !== false) {
            this.$$element.attr(attrName, value);
          }

          if (this.$$observers) {
            _.forEach(this.$$observers[key], function(observer) {
              try {
                observer(value);
              }
              catch (e) {
                console.log(e);
              }
            });
          }

        },

        $observe: function(key, fn) {
          var self = this;
          this.$$observers = this.$$observers || {};
          this.$$observers[key] = this.$$observers[key] || [];
          this.$$observers[key].push(fn);
          $rootScope.$evalAsync(function() {
            fn(self[key]);
          });

          //deregisters the observe
          return function() {
            var index = self.$$observers[key].indexOf(fn);
            if (index >= 0) {
              self.$$observers[key].splice(index, 1);
            }
          };
        },

        $addClass: function(classVal) {
          this.$$element.addClass(classVal);
        },


        $removeClass: function(classVal) {
          this.$$element.removeClass(classVal);
        },

        $updateClass: function(newClassVal, oldClassVal) {
          // regex: "at least one white space"
          var newClasses = newClassVal.split(/\s+/);
          var oldClasses = oldClassVal.split(/\s+/);

          // _.difference = substract from first array the values of the second array
          var addedClasses = _.difference(newClasses, oldClasses);
          var removedClasses = _.difference(oldClasses, newClasses);

          if (addedClasses.length) {
            this.$addClass(addedClasses.join(" "));
          }

          if (removedClasses.length) {
            this.$removeClass(removedClasses.join(" "));
          }
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
        var match;

        if (hasDirectives.hasOwnProperty(name)) {
          // array of directive objects
          var foundDirectives = $injector.get(name + "Directive");
          var applicableDirectives = foundDirectives.filter(function(dir) {
            return dir.restrict.indexOf(mode) !== -1;
          });

          applicableDirectives.forEach(function(directive) {
            //check if multi-element
            if (attrStartName) {
              directive = _.create(directive, {
                $$start: attrStartName,
                $$end: attrEndName
              });
            }
            directives.push(directive);
            match = directive;
          });
        }

        return match;
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
        var match;

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
              normalizedAttrName = directiveNormalize(name.toLowerCase());
            }

            attrs.$attr[normalizedAttrName] = name;

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

            // deleted???
            addDirective(directives, normalizedAttrName, "A", attrStartName, attrEndName);
          });

          // class 
          var className = node.className;
          if (typeof className === "string" && className.length !== 0) {
            // ([\d\w\-_]+) = match anything contains a letter, digit, "-" or "_"
            // (?:\:([^;]+))?;? optionally match a ":" that optionally finished with "?"
            while ((match = /([\d\w\-_]+)(?:\:([^;]+))?;?/.exec(className))) {
              var normalizedClassName = directiveNormalize(match[1]);
              if (addDirective(directives, normalizedClassName, "C")) {
                attrs[normalizedClassName] = match[2] ? match[2].trim() : undefined;
              }

              // process className so while loop doesn't go on infinitely
              className = className.substr(match.index + match[0].length);
            }
          }
        }

        // comment
        else if (node.nodeType === Node.COMMENT_NODE) {
          // regex is explained in the collectDirective:className section
          match = /^\s*directive\:\s*([\d\w\-_]+)\s*(.*)$/.exec(node.nodeValue);

          if (match) {
            var normalizedName = directiveNormalize(match[1]);
            if (addDirective(directives, normalizedName, 'M')) {
              attrs[normalizedName] = match[2] ? match[2].trim() : undefined;
            }
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
