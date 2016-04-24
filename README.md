<i>Learning how to make a modern day front-end javascript framework from scratch.</i>

</h1>How does Angular work the TOP-DOWN approach.<h1>

<i>When I was a University I learnt Networking from the bottom-up. That is I started with the physical layer, then link layer, and network layer and finally transport layer. Another way to learn would have been to have started at the top with the transport layer and peel away until we reach the physical layer.</i>

This peeling away approach is the one we will adopt when uncovering the mechanisms that make up Angular.


</h2>BOOTSTRAP</h2>
<u>Initial State</u> window is the default window object, the DOM isn't loaded, the DOM isn't ready.

The very line of code that Angular executes is the function called PublishExternalAPI(). This creates the window.angular object and gives it the oh-so-important properties <b>window.angular.module</b> and </b>window.angular.bootstrap</b>. Which will respectively allow us to register modules and then instanciated them.

The second thing Angular does is that it register a module called "ng". This modules loads all the $providers angular will need.

The core ones being:
$compile
$interpolate
$controller
$parse
$rootScope
$q
$http
$filter

It will also load all the angular-native directives (ngIf, ngRepeat, ngShow, etc.) and filters.

Now that window.angular.module is created, and the first "ng" module is created. The browser now goes onto loading our own modules that get created in the same way the "ng" module was: via window.angular.module.


<h3> AUTOMATIC BOOTSTRAP vs MANUAL BOOTSTRAP </h3>
<u>Current State</u> window.angular is created, angular.bootstrap and angular.module is created, angular registers the "ng" module, the DOM is not loaded, the DOM is not ready 

The browser loads all our JS and CSS files. Suddenly, the document.ready event fires.

Angular has it's own callback attached to document.ready. It's going to look for an element an "ng-app" attribute on it, and take it as the $rootElement of the application. And call window.angular.bootstrap(rootElement, rootElement.getAttr("ng-app")).

If however Angular does not find any elements with the "ng-app" attribute, it will not do anything. Usually this means that the developer will call angular.bootstrap himself inside of his own document.ready event handler.

The boostrap function takes two parameters: the root element of the application, and the modules you want to load.

It first call createInjector(). This is the function that loads of all your modules and providers into the angular's providerCache. We talk about this more in detail in our injector section.

It will then call $compile on the root element, and pass it the $rootScope. It will then call $digest so that all the watchers are initialized and all values interpolated.

<u>Current State</u>bootstrap is finished, the initial $compile(rootElement)($rootScope) has been called, the first $digest has been called, the DOM is loaded.


<h1>INJECTOR</h1>
