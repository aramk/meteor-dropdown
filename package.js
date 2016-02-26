Package.describe({
  name: 'aramk:dropdown',
  summary: 'A reactive dropdown widget',
  version: '0.5.1',
  git: 'https://github.com/aramk/meteor-dropdown.git'
});

Package.on_use(function(api) {
  api.versionsFrom('METEOR@0.9.0');
  api.use(['templating', 'underscore', 'jquery'], 'client');
  api.use([
    'semantic:ui-css@2.0.8',
    'aldeed:autoform@5.1.2',
    'aramk:utility@0.8.7'
  ], 'client', {weak: true});
  api.add_files([
    'src/dropdown.html',
    'src/dropdown.js'
  ], 'client');
});
