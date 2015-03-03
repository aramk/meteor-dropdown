Package.describe({
  name: 'aramk:dropdown',
  summary: 'A reactive dropdown widget',
  version: '0.4.1',
  git: 'https://github.com/aramk/meteor-dropdown.git'
});

Package.on_use(function(api) {
  api.versionsFrom('METEOR@0.9.0');
  api.use(['templating', 'underscore', 'jquery', 'nooitaf:semantic-ui@1.8.1'], 'client');
  api.use(['aldeed:autoform@4.0.7'], 'client', {weak: true});
  api.add_files([
    'lib/dropdown.html',
    'lib/dropdown.js'
  ], 'client');
});
