(function (tmpl) {
	// A hash to store our routes:
	var routes = {};
	// An array of the current route's events:
	var events = [];
	// The element where the routes are rendered:
	var app = document.getElementById('app');
	
	
	// Context functions shared between all controllers:
	var ctx = {
		encode : function(obj) {
			/* URL encode a JSON object */
			return Object.keys(obj).map(function(k){ 
				if(obj[k] && Object.prototype.toString.call(obj[k]) == "[object Array]" ){
					return obj[k].map(function(tag){
						return k + "=" +  tag;
					}).join("&");
				} else if(obj[k]) return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
			}).filter(function(el){return el}).join('&');
		},
		on: function (selector, evt, handler) {
			events.push([selector, evt, handler]);
		},
		refresh: function (listeners) {
			listeners.forEach(function (fn) { fn(); });
		},
		set : function(id, val){
			localStorage.setItem(id, val);
		},
		get : function(key){
			return JSON.parse(localStorage.getItem(key));
		},
		data : function(url, data = {}, headers={}, format="json", sendas=""){
			var self = this;
		
			if(typeof data === "object" && Object.getOwnPropertyNames(data).length)
				url = url + "?" + this.encode(data);
		
			return new Promise(function(resolve, reject){
				let xhr = new XMLHttpRequest();
				xhr.responseType = format;
				xhr.open("GET", url, true);
							
				if (headers) {
					Object.keys(headers).forEach(key => {
						xhr.setRequestHeader(key, headers[key]);
					});
				}
				/*
				* Send as JSON unless otherwise specified
				*/
				xhr.setRequestHeader("Content-Type", "application/json");
				xhr.setRequestHeader("Accept", "text/plain, */*; q=0.01");
				
				xhr.onload = function(){ resolve(xhr.response)};
				xhr.onerror = function(){ reject( new Error(xhr.status + xhr.response) )};
				xhr.send(null);
			});
		}
	};
	
	// Defines a route:
	function route (path, templateId, controller) {
		var listeners = [];
		var params = {};
		var regex = null;
		// If there were only two arguments passed in, assume we are using the second one
		// as the controller.
		
		if (typeof templateId === 'function') {
			controller = templateId;
			templateId = null;
		}
		
		if (typeof controller === "undefined")
			controller = function(){};
			
		if (path.indexOf(":") > -1) {
			regex = path;
		}
		// Add properties to our callback function that will be available after
		// Route is determined
		Object.defineProperty(controller.prototype, '$on', {value: ctx.on});
		Object.defineProperty(controller.prototype, '$refresh', {value: ctx.refresh.bind(undefined, listeners)});
		Object.defineProperty(controller.prototype, '$set', {value: ctx.set});
		Object.defineProperty(controller.prototype, '$get', {value: ctx.get});
		Object.defineProperty(controller.prototype, '$data', {value : ctx.get});
		
		routes[path] = {
			templateId: templateId, 
			controller: controller, 
			onRefresh: listeners.push.bind(listeners),
			regex : regex,
			params : params
		};
	}
	function forEachEventElement(fnName) {
		events.forEach(function(event, i){
			var els = app.querySelectorAll(event[0]);
			els.forEach(function(ele, j){
				ele[fnName].apply(ele, event.slice(1));
			});
		});
	}
	
	function addEventListeners() {
		forEachEventElement('addEventListener');
	}
	function removeEventListeners() {
		forEachEventElement('removeEventListener');
	}
	/**
	* Browser runs this function every time the page is loaded 
	* or if there is a change to the window.location.hash.
	*/
	function router () {
		var route = null;
		
		this.match_arr = null;
		this.url = location.hash.slice(1) || '/';
		this.url_arr = this.url.split("/").filter(function(p){ return p });
		this.params = {};
		this.params_regex = /(:\w+)/g;
		this.url_matches_pattern = function(url, route){
			var pattern;
			if(route === "/" || route == "*")
				return false;
				
			pattern = new RegExp(route.replace(/(:\w+)/g, '([\\w-]+)'));
			this.match_arr =  url.match(pattern);
			return match_arr && match_arr[0] === match_arr["input"] ? true : false;
		}

		if(typeof routes[this.url] === "undefined"){
			// Set route to 404 page
			route = routes["*"];
			// Check each route to find any routes with regular expressions
			for(var key in routes){
				if(routes[key].regex && this.url_matches_pattern(this.url, key)){
					//get arguments from the regular expression
					var args = key.match(this.params_regex);
					// Set route based on regex pattern found in URL
					route = routes[key];
					// Get any parameters from the URL, matching the url against the 
					// arguments from the regular expression
					if( args ) {
						// this.match_arr.shift();
						for(var y = 0; y < args.length; y++)
							this.params[args[y].slice(1)] = this.match_arr[y];
					}
				} 
			}
		} else route = routes[url];
		// Set route params
		route.controller.prototype.$set("params", JSON.stringify(this.params));
		// Lazy load view element:

		// Remove current event listeners:
		removeEventListeners();
		// Clear events, to prepare for next render:
		events = [];
		// Do we have a controller:
		if (route && route.controller) {
			var template;
			var ctrl = new route.controller();
			if(ctrl.template){
				template = ctrl.template;			
			} else if(route.templateId) {
				template = document.getElementById(route.templateId).innerHTML;
			}
			if (!app) {
					// If there's nothing to render, abort:
				return;
			}
			// Listen on route refreshes:
			route.onRefresh(function () {
				removeEventListeners();
				if(typeof template === "object"){
					console.log(ctrl.template);
					template.done(function(data){
						app.innerHTML = tmpl.render(
							data, 
							ctrl
						);
						addEventListeners();
					});
					
				} else {
					app.innerHTML = tmpl.render(
						template, 
						ctrl
					);
					addEventListeners();
				}
			});
			// Trigger the first refresh:
			ctrl.$refresh();
		}
	}
	window.router = router;
	// Listen on hash change:
	window.addEventListener('hashchange', router);
	// Listen on page load:
	window.addEventListener('load', router);
	// Expose the route register function:
	window.route = route;
})(Mustache);