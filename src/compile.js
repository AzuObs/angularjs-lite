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
    return function(scope, element, attrs, ctrl) {
      var group = groupScan(element[0], attrStart, attrEnd);
      return linkFn(scope, group, attrs, ctrl);
    };
  }

  function parseIsolateBindings(isolateScope) {
    var bindings = {};
    _.forEach(isolateScope, function(definition, scopeName) {
      // "@" or "=" or "&" followed by "*" followed by "?" followed by 0+ characters into another group
      // @ : one way data binding
      // = : two way data binding
      // =* : two way data binding with a watchCollection
      // =? : optional attribute
      // & : function
      // &?: optional function
      var match = definition.match(/\s*([@&]|=(\*?))(\??)\s*(\w*)\s*/);
      bindings[scopeName] = {
        mode: match[1][0],
        collection: match[2] === "*",
        optional: match[3] === "?",
        attrName: match[4] || scopeName
      };
    });

    return bindings;
  }

  function parseDirectiveBindings(directive) {
    var bindings = {};
    if (_.isObject(directive.scope)) {
      if (directive.bindToController === true) {
        bindings.bindToController = parseIsolateBindings(directive.scope);
      }
      else {
        bindings.isolateScope = parseIsolateBindings(directive.scope);
      }
    }
    if (_.isObject(directive.bindToController)) {
      bindings.bindToController =
        parseIsolateBindings(directive.bindToController);
    }

    return bindings;
  }


  function $CompileProvider($provide) {
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
              directive.require = directive.require || (directive.controller && name);
              directive.name = directive.name || name;
              directive.index = i;
              if (directive.link && !directive.compile) {
                directive.compile = function() {
                  return directive.link;
                };
              }
              directive.$$bindings = parseDirectiveBindings(directive);
              //isolate scope // necessary
              if (_.isObject(directive.scope)) {
                directive.$$isolateBindings = directive.$$bindings.isolateScope;
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
    this.$get = ["$injector", "$rootScope", "$parse", "$controller", "$http",
      function($injector, $rootScope, $parse, $controller, $http) {

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

          return function publicLinkFn(scope, options) {
            options = options || {};
            var parentBoundTranscludeFn = options.parentBoundTranscludeFn;
            if (parentBoundTranscludeFn && parentBoundTranscludeFn.$$boundTransclude) {
              parentBoundTranscludeFn = parentBoundTranscludeFn.$$boundTransclude;
            }

            $compileNodes.data("$scope", scope);
            compositeLinkFn(scope, $compileNodes, parentBoundTranscludeFn);

            return $compileNodes;
          };
        }


        function compileNodes($compileNodes) {
          // linkFns of every node
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

          function compositeLinkFn(scope, linkNodes, parentBoundTranscludeFn) {
            var stableNodeList = [];
            _.forEach(linkFns, function(linkFn) {
              stableNodeList[linkFn.idx] = linkNodes[linkFn.idx];
            });

            _.forEach(linkFns, function(linkFn) {
              var node = stableNodeList[linkFn.idx];

              // if node has a link fn
              if (linkFn.nodeLinkFn) {
                var childScope;

                // if the LINK fn has a scope property, NOT if a DIRECTIVE has one
                // applyDirective calculates this
                if (linkFn.nodeLinkFn.scope) {
                  childScope = scope.$new();
                  $(node).data("$scope", childScope);
                }
                else {
                  childScope = scope;
                }

                var boundTranscludeFn;
                // if node has transclude
                if (linkFn.nodeLinkFn.transcludeOnThisElement) {
                  boundTranscludeFn = function(transcludedScope, containingScope) {
                    if (!transcludedScope) {
                      transcludedScope = scope.$new(false, containingScope);
                    }
                    return linkFn.nodeLinkFn.transclude(transcludedScope);
                  };
                }
                // if parent node has a transclude instead
                else if (parentBoundTranscludeFn) {
                  boundTranscludeFn = parentBoundTranscludeFn;
                }

                linkFn.nodeLinkFn(
                  linkFn.childLinkFn,
                  childScope,
                  node,
                  boundTranscludeFn
                );
              }

              // no linkfn on node
              else {
                // call childLinkfn
                linkFn.childLinkFn(
                  scope,
                  node.childNodes,
                  parentBoundTranscludeFn);
              }
            });
          } // end compositeLinkFn

          return compositeLinkFn;
        } // end compileNodes


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
        } // end collectDirectives


        function compileTemplateUrl(directives, $compileNode, attrs, previousCompileContext) {
          var origAsyncDirective = directives.shift();
          var derivedAsyncDirective = _.assign({}, origAsyncDirective, {
            templateUrl: null
          });
          var templateUrl = _.isFunction(origAsyncDirective.templateUrl) ?
            origAsyncDirective.templateUrl($compileNode, attrs) : origAsyncDirective.templateUrl;

          var afterTemplateNodeLinkFn, afterTemplateChildLinkFn;
          var linkQueue = [];
          $compileNode.empty();

          $http
            .get(templateUrl)
            .success(function(template) {
              directives.unshift(derivedAsyncDirective);
              $compileNode.html(template);
              afterTemplateNodeLinkFn = applyDirectivesToNode(directives, $compileNode, attrs, previousCompileContext);
              afterTemplateChildLinkFn = compileNodes($compileNode[0].childNodes);

              // call nodeLinkFn, this means that the $http.get resolved after the call to the 
              // delayedNodeFn got called
              _.forEach(linkQueue, function(linkCall) {
                afterTemplateNodeLinkFn(afterTemplateChildLinkFn, linkCall.scope, linkCall.linkNode);
              });
              linkQueue = null;
            });

          // we ignore childLinkFn because the HTML for the child is going to be contained
          // within templateUrl
          return function delayedNodeFn(_ignoreChildLinkFn, scope, linkNode) {
            // if the $http.get hasn't resolved yet, we want to store the scope and node variables
            if (linkQueue) {
              linkQueue.push({
                scope: scope,
                linkNode: linkNode
              });
            }

            // if the $http.get has resolve, then we haven't called this function yet
            else {
              afterTemplateNodeLinkFn(afterTemplateChildLinkFn, scope, linkNode);
            }
          };
        } // end compileTemplateUrl


        function applyDirectivesToNode(directives, compileNode, attrs, previousCompileContext) {
          previousCompileContext = previousCompileContext || {};
          var $compileNode = $(compileNode);
          var terminal = false;
          var terminalPriority = -Number.MAX_VALUE;
          var controllers = {};
          var newScopeDirective;
          var preLinkFns = previousCompileContext.preLinkFns || [];
          var postLinkFns = previousCompileContext.postLinkFns || [];
          var controllerDirectives = previousCompileContext.controllerDirectives;
          var templateDirective = previousCompileContext.templateDirective;
          var newIsolateScopeDirective = previousCompileContext.newIsolateScopeDirective;
          var childTranscludeFn, hasTranscludeDirective;

          function getControllers(require, $element) {
            // array
            if (_.isArray(require)) {
              return require.map(getControllers);
            }

            // string OR wrong input
            else {
              var value;
              // does it start with a "^" or "^^" that start of finished with "?" character
              // "?" optional require
              // "^" start by looking on current node, then on ancestors
              // "^^" start by looking on ancestors
              var match = require.match(/^(\^\^?)?(\?)?(\^\^?)?/);
              var optional = match[2];
              require = require.substring(match[0].length);

              // you can start or finish your require string with "^" or "^^"
              if (match[1] || match[3]) {
                if (match[3] && !match[1]) {
                  match[1] = match[3];
                }
                if (match[1] === "^^") {
                  $element = $element.parent();
                }
                while ($element.length) {
                  value = $element.data("$" + require + "Controller");
                  if (value) {
                    break;
                  }
                  else {
                    $element = $element.parent();
                  }
                }
              }

              else {
                if (controllers[require]) {
                  value = controllers[require].instance;
                }
              }

              if (!value && !optional) {
                throw "Controller " + require + " required by directive, cannot be found!";
              }

              return value || null;
            }
          } // end getControllers


          function addLinkFns(preLinkFn, postLinkFn, attrStart, attrEnd, isolateScope, require) {
            if (preLinkFn) {
              if (attrStart) {
                preLinkFn = groupElementsLinkFnWrapper(preLinkFn, attrStart, attrEnd);
              }
              preLinkFn.isolateScope = isolateScope;
              preLinkFn.require = require;
              preLinkFns.push(preLinkFn);
            }
            if (postLinkFn) {
              if (attrStart) {
                postLinkFn = groupElementsLinkFnWrapper(postLinkFn, attrStart, attrEnd);
              }
              postLinkFn.isolateScope = isolateScope;
              postLinkFn.require = require;
              postLinkFns.push(postLinkFn);
            }
          } // end addLinkfns


          function initializeDirectiveBindings(
            scope, attrs, destination, bindings, newScope) {
            _.forEach(bindings, function(definition, scopeName) {
              var attrName = definition.attrName;
              switch (definition.mode) {
                case '@':
                  attrs.$observe(attrName, function(newAttrValue) {
                    destination[scopeName] = newAttrValue;
                  });
                  if (attrs[attrName]) {
                    destination[scopeName] = attrs[attrName];
                  }
                  break;
                case '=':
                  if (definition.optional && !attrs[attrName]) {
                    break;
                  }
                  var parentGet = $parse(attrs[attrName]);
                  var lastValue = destination[scopeName] = parentGet(scope);
                  var parentValueWatch = function() {
                    var parentValue = parentGet(scope);
                    if (destination[scopeName] !== parentValue) {
                      if (parentValue !== lastValue) {
                        destination[scopeName] = parentValue;
                      }
                      else {
                        parentValue = destination[scopeName];
                        parentGet.assign(scope, parentValue);
                      }
                    }
                    lastValue = parentValue;
                    return lastValue;
                  };
                  var unwatch;
                  if (definition.collection) {
                    unwatch = scope.$watchCollection(attrs[attrName], parentValueWatch);
                  }
                  else {
                    unwatch = scope.$watch(parentValueWatch);
                  }
                  newScope.$on('$destroy', unwatch);
                  break;
                case '&':
                  var parentExpr = $parse(attrs[attrName]);
                  if (parentExpr === _.noop && definition.optional) {
                    break;
                  }
                  destination[scopeName] = function(locals) {
                    return parentExpr(scope, locals);
                  };
                  break;
              }
            });
          } // end initializeDirectiveBindings


          var nodeLinkFn = function(childLinkFn, scope, linkNode, boundTranscludeFn) {
            var $element = $(linkNode);

            var isolateScope;
            if (newIsolateScopeDirective) {
              isolateScope = scope.$new(true);
              $element.addClass("ng-isolate-scope");
              $element.data("$isolateScope", isolateScope);
            }

            // if controller
            _.forEach(controllerDirectives, function(directive) {
              var controllerName = directive.controller;
              var locals = {
                $scope: newIsolateScopeDirective ? isolateScope : scope,
                $element: $element,
                $attrs: attrs
              };

              if (controllerName === "@") {
                controllerName = attrs[directive.name];
              }
              var controller = $controller(controllerName, locals, true, directive.controllerAs);
              controllers[directive.name] = controller;
              $element.data("$" + directive.name + "Controller", controller.instance);
            });


            var scopeDirective = newIsolateScopeDirective || newScopeDirective;

            // if isolate scope, bind directives to isolateScope
            if (newIsolateScopeDirective) {
              initializeDirectiveBindings(
                scope,
                attrs,
                isolateScope,
                newIsolateScopeDirective.$$bindings.isolateScope,
                isolateScope
              );
            }

            // if isolate scope AND controller, bind directives to controller instance
            if (scopeDirective && controllers[scopeDirective.name]) {
              initializeDirectiveBindings(
                scope,
                attrs,
                controllers[scopeDirective.name].instance,
                scopeDirective.$$bindings.bindToController,
                isolateScope
              );
            }

            // controller
            _.forEach(controllers, function(controller) {
              controller();
            });

            function scopeBoundTranscludeFn(transcludedScope) {
              return boundTranscludeFn(transcludedScope, scope);
            }
            scopeBoundTranscludeFn.$$boundTransclude = boundTranscludeFn;

            // pre link
            _.forEach(preLinkFns, function(linkFn) {
              linkFn(
                linkFn.isolateScope ? isolateScope : scope,
                $element,
                attrs,
                linkFn.require && getControllers(linkFn.require, $element),
                scopeBoundTranscludeFn
              );
            });

            // child link
            if (childLinkFn) {
              var scopeToChild = scope;
              // if the directive has an iso scope AND a template
              // pass the isolated scope to the "template" aka "child"
              if (newIsolateScopeDirective && newIsolateScopeDirective.template) {
                scopeToChild = isolateScope;
              }
              childLinkFn(scopeToChild, linkNode.childNodes, boundTranscludeFn);
            }

            //post link - start from the end
            _.forEachRight(postLinkFns, function(linkFn) {
              linkFn(
                linkFn.isolateScope ? isolateScope : scope,
                $element,
                attrs,
                linkFn.require && getControllers(linkFn.require, $element),
                scopeBoundTranscludeFn
              );
            });
          }; // end node LinkFn


          _.forEach(directives, function(directive, i) {
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

            // has controller
            if (directive.controller) {
              controllerDirectives = controllerDirectives || {};
              controllerDirectives[directive.name] = directive;
            }

            // has transclude
            if (directive.transclude) {
              if (hasTranscludeDirective) {
                throw "Multiple directives asking for transclude";
              }
              hasTranscludeDirective = true;

              var $transcludeNodes = $compileNode.clone().contents();
              childTranscludeFn = compile($transcludeNodes);
              $compileNode.empty();
            }

            // has template
            if (directive.template) {
              if (templateDirective) {
                throw "Multiple directives asking for template";
              }
              templateDirective = directive;
              $compileNode.html(_.isFunction(directive.template) ?
                directive.template($compileNode, attrs) : directive.template);
            }

            // has templateUrl
            if (directive.templateUrl) {
              if (templateDirective) {
                throw "Multiple directives asking for template";
              }
              templateDirective = directive;
              nodeLinkFn = compileTemplateUrl(directives.slice(i), $compileNode, attrs, {
                templateDirective: templateDirective,
                preLinkFns: preLinkFns,
                postLinkFns: postLinkFns,
                newIsolateScopeDirective: newIsolateScopeDirective,
                controllerDirectives: controllerDirectives
              });
              return false;
            }
            // compile
            else if (directive.compile) {
              var linkFn = directive.compile($compileNode, attrs);
              var attrEnd = directive.$$end;
              var attrStart = directive.$$start;
              var require = directive.require;
              var isolateScope = (directive === newIsolateScopeDirective);

              if (typeof linkFn === "function") {
                addLinkFns(null, linkFn, attrStart, attrEnd, isolateScope, require);
              }
              else if (linkFn) {
                addLinkFns(linkFn.pre, linkFn.post, attrStart, attrEnd, isolateScope, require);
              }
            }

            // is terminal
            if (directive.terminal) {
              terminal = true;
              terminalPriority = directive.terminal;
            }
          });

          nodeLinkFn.terminal = terminal;
          nodeLinkFn.scope = newScopeDirective && newScopeDirective.scope;
          nodeLinkFn.transcludeOnThisElement = hasTranscludeDirective;
          nodeLinkFn.transclude = childTranscludeFn;
          return nodeLinkFn;
        } // applyDirectives


        return compile;
      }
    ]; //end this.$get
  } //end $CompileProvider
  $CompileProvider.$inject = ["$provide"];


  window.$CompileProvider = $CompileProvider;
})();
