# Vanilla JS Router with Mustache Templates
## Routes

### Static Route
```
<script type="x-tmpl-mustache" id="home">
	<h1>Homepage</h1>
	<p>Lorem ipsum dolor sit amet...</p>
</script>
<script type="x-tmpl-mustache" id="error404">
	<h1>404 Not found</h1>	
</script>
<script>
route('/', 'home');
route('*', 'error404');
</script>
```

### Route with parameters
```
<script type="x-tmpl-mustache" id="products4">
	<h1>{{heading}}</h1>
	{{action}}
</script>
<script>
route('/products/:id/:action', 'products4', function(){
	this.heading="Products 4";
	this.action = "Action" + this.$get("params").action;
});
</script>
```

### Route with parameters and events 
```
<script type="x-tmpl-mustache" id="template1">
	<h1>{{greeting}}</h1>
	<p>Pieces of bacon: {{counter}}</p>
	<button class="my-button">More Bacon</button>
</script>
<script>
route('/page1', 'template1', function () {
	this.greeting = 'Bacon getter';
	this.moreText = 'More Bacon...';
	this.counter = 1;
	this.$set("key", "value");
	this.$on('.my-button', 'click', function () {
		this.moreText = "more bacon";
		this.counter += 1;
		this.$refresh();
	}.bind(this));
});
</script>
```