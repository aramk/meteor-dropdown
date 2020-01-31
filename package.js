Package.describe({
  name: 'aramk:dropdown',
  summary: 'A reactive dropdown widget',
  version: '1.0.2',
  git: 'https://github.com/aramk/meteor-dropdown.git'
});

Package.on_use(function(api) {
  api.versionsFrom('METEOR@1.6.1');
  api.use([
    'templating@1.3.2',
    'underscore',
    'jquery',
    'ecmascript'
  ], 'client');
  api.use([
    'semantic:ui-css@2.1.2',
    'aldeed:autoform@5.1.2',
    'urbanetic:utility@2.0.0'
  ], 'client', {weak: true});
  api.add_files([
    'src/dropdown.html',
    'src/dropdown.js'
  ], 'client');
});
