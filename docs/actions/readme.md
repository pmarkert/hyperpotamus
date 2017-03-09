# Action plugins

Action plugins are the components that implement the functionality in hyperpotamus to apply the desired actions specified in a script. The action plugin that will process any given script element is determined by matching the top-level property names to the available action plugin names. (i.e. an element `{ "foo": "something" }` would be processed by the hypothetical `foo` action.
