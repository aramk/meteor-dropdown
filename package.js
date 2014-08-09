Package.describe({
  name: 'dropdown',
  summary: 'A reactive dropdown widget for Meteor.'
});

Package.on_use(function(api) {
  api.use(['templating', 'underscore', 'jquery'], 'client');

  api.add_files([
    'lib/dropdown.html',
    'lib/dropdown.js'
  ], 'client');
});
