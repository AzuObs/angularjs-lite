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

  function groupElementsLinkFnWrapper(linkFn, attrStart, attrEnd) {
    return function(scope, element, attrs) {
      var group = groupScan(element[0], attrStart, attrEnd);
      return linkFn(scope, group, attrs);
    };
  }

  function parseIsolateBindings(isolateScope) {
    var bindings = {};
    _.forEach(isolateScope, function(definition, scopeName) {
      // "@" or "=" followed by 0+ characters into another group
      var match = definition.match(/\s*([@=])\s*(\w*)\s*/);
      bindings[scopeName] = {
        mode: match[1],
        attrName: match[2] || scopeName
      };
    });

    return bindings;
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

          // yo dawg, I heard you liked factories
          // so these are factories for your factory
          $provide.factory(name + "Directive", ["$injector", function($injector) {
            var factories = hasDirectives[name];

            return factories.map(function(factory, i) {
              var directive = $injector.invoke(factory);
              directive.restrict = directive.restrict || "EA";
              directive.priority = directive.priority || 0;
              directive.name = directive.name || name;
              directive.index = i;
              if (directive.link && !directive.compile) {
                directive.compile = function() {
                  return directive.link;
                };
              }
              //isolate scope
              if (_.isObject(directive.scope)) {
                directive.$$isolateBindings = parseIsolateBindings(directive.scope);
              }
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
    this.$get = ["$injector", "$rootScope", "$parse",
      function($injector, $rootScope, $parse) {
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
          var compositeLinkFn = compileNodes($compileNodes);

          return function publicLinkFn(scope) {
            $compileNodes.data("$scope", scope);
            compositeLinkFn(scope, $compileNodes);
          };
        }


        function compileNodes($compileNodes) {
          // every directive's linkFn of every node
          var linkFns = [];

          _.forEach($compileNodes, function(node, i) {
            var attrs = new Attributes($(node));
            var directives = collectDirectives(node, attrs);
            var nodeLinkFn;

            if (directives.length) {
              // directive.compile
              nodeLinkFn = applyDirectivesToNode(directives, node, attrs);
            }

            var childLinkFn;
            if ((!nodeLinkFn || !nodeLinkFn.terminal) && node.childNodes && node.childNodes.length) {
              childLinkFn = compileNodes(node.childNodes);
            }

            if (nodeLinkFn && nodeLinkFn.scope) {
              attrs.$$element.addClass("ng-scope");
            }

            if (nodeLinkFn || childLinkFn) {
              linkFns.push({
                nodeLinkFn: nodeLinkFn,
                childLinkFn: childLinkFn,
                idx: i
              });
            }
          });

          function compositeLinkFn(scope, linkNodes) {
            var stableNodeList = [];
            _.forEach(linkFns, function(linkFn) {
              stableNodeList[linkFn.idx] = linkNodes[linkFn.idx];
            });

            _.forEach(linkFns, function(linkFn) {
              var node = stableNodeList[linkFn.idx];

              if (linkFn.nodeLinkFn) {
                if (linkFn.nodeLinkFn.scope) {
                  scope = scope.$new();
                  $(node).data("$scope", scope);
                }

                linkFn.nodeLinkFn(
                  linkFn.childLinkFn,
                  scope,
                  node);
              }
              // no directives on current node
              else {
                //link fn is the compositeLinkFn of the child
                linkFn.childLinkFn(
                  scope,
                  node.childNodes);
              }
            });
          }

          return compositeLinkFn;
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


        function applyDirectivesToNode(directives, compileNode, attrs) {
          var $compileNode = $(compileNode);
          var terminal = false;
          var terminalPriority = -Number.MAX_VALUE;
          var preLinkFns = [];
          var postLinkFns = [];
          var newScopeDirective, newIsolateScopeDirective;

          function addLinkFns(preLinkFn, postLinkFn, attrStart, attrEnd, isolateScope) {
            if (preLinkFn) {
              if (attrStart) {
                preLinkFn = groupElementsLinkFnWrapper(preLinkFn, attrStart, attrEnd);
              }
              preLinkFn.isolateScope = isolateScope;
              preLinkFns.push(preLinkFn);
            }
            if (postLinkFn) {
              if (attrStart) {
                postLinkFn = groupElementsLinkFnWrapper(postLinkFn, attrStart, attrEnd);
              }
              postLinkFn.isolateScope = isolateScope;
              postLinkFns.push(postLinkFn);
            }
          }

          directives.forEach(function(directive) {
            // is multi-element
            if (directive.$$start) {
              $compileNode = groupScan(compileNode, directive.$$start, directive.$$end);
            }

            // has priority
            if (directive.priority < terminalPriority) {
              return false;
            }

            // has scope
            if (directive.scope) {
              // scope: {} (isolate)
              if (_.isObject(directive.scope)) {
                if (newIsolateScopeDirective || newScopeDirective) {
                  throw "Multiple directives asking for new/inherited scopes";
                }
                newIsolateScopeDirective = directive;
              }
              // scope:true (inherited)
              else {
                if (newIsolateScopeDirective) {
                  throw "Multiple directives asking for new/inherited scopes";
                }
                newScopeDirective = newScopeDirective || directive;
              }
            }

            // compile
            if (directive.compile) {
              var linkFn = directive.compile($compileNode, attrs);
              var attrEnd = directive.$$end;
              var attrStart = directive.$$start;
              var isolateScope = (directive === newIsolateScopeDirective);

              if (typeof linkFn === "function") {
                addLinkFns(null, linkFn, attrStart, attrEnd, isolateScope);
              }
              else if (linkFn) {
                addLinkFns(linkFn.pre, linkFn.post, attrStart, attrEnd, isolateScope);
              }
            }
            if (directive.terminal) {
              terminal = true;
              terminalPriority = directive.terminal;
            }
          });


          function nodeLinkFn(childLinkFn, scope, linkNode) {
            var $element = $(linkNode);

            var isolateScope;
            if (newIsolateScopeDirective) {
              isolateScope = scope.$new(true);
              $element.addClass("ng-isolate-scope");
              $element.data("$isolateScope", isolateScope);

              // for every property in {a:"=a",b:"&b"} etc
              _.forEach(newIsolateScopeDirective.$$isolateBindings, function(definition, scopeName) {
                var attrName = definition.attrName;

                switch (definition.mode) {
                  case "@":
                    // observe the attr
                    attrs.$observe(attrName, function(newAttrValue) {
                      isolateScope[scopeName] = newAttrValue;
                    });
                    // initialize scope
                    if (attrs[attrName]) {
                      isolateScope[scopeName] = attrs[attrName];
                    }
                    break;

                  case "=":
                    var parentGet = $parse(attrs[attrName]);
                    //scope is the parent of isolateScope
                    isolateScope[scopeName] = parentGet(scope);
                    // anything returned from a $parse can be used as a scope watchFn
                    // but the properties should be in the {},{} passed to the return fn
                    scope.$watch(parentGet, function(newValue) {
                      isolateScope[scopeName] = newValue;
                    });

                    break;

                  case "&":
                    break;
                }
              });
            }

            _.forEach(preLinkFns, function(linkFn) {
              linkFn(linkFn.isolateScope ? isolateScope : scope, $element, attrs);
            });

            if (childLinkFn) {
              childLinkFn(scope, linkNode.childNodes);
            }

            //start from the end
            _.forEachRight(postLinkFns, function(linkFn) {
              linkFn(linkFn.isolateScope ? isolateScope : scope, $element, attrs);
            });
          }

          nodeLinkFn.terminal = terminal;
          nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope;
          return nodeLinkFn;
        } // applyDirectives


        return compile;
      }
    ]; //end this.$get
  } //end $CompileProvider
  $CompileProvider.$inject = ["$provide"];


  window.$CompileProvider = $CompileProvider;
})();
