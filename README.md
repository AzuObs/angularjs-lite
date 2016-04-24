Learning how to make a modern day front-end javascript framework from scratch.

How does Angular work the TOP-DOWN approach.

When I was a University I learnt Networking from the bottom-up. That is I started with the physical layer, then link layer, and network layer and finally transport layer. Another way to learn would have been to have started at the top with the transport layer and peel away until we reach the physical layer.

This peeling away approach is the one we will adopt when uncovering the mechanisms that make up Angular.


angular>src>publishExternalAPI.js

This file contains only one line. It calls the function PublishExternalAPI(). This is going to create the window.angular object and give it core properties such as <b>window.angular.bootstrap</b> and window.angular.module.





