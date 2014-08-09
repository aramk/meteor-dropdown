Package.describe({
  name: 'meteor-dropdown',
  summary: 'A reactive dropdown widget for Meteor.'
});

Package.on_use(function(api) {
  api.use(['templating', 'underscore', 'jquery', 'less'], 'client');

  api.add_files([
    'lib/dropdown.html',
    'lib/dropdown.js'
  ], 'client');
});
