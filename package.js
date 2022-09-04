Package.describe({
  name: 'aramk:dropdown',
  summary: 'A reactive dropdown widget',
  version: '2.0.0',
  git: 'https://github.com/aramk/meteor-dropdown.git'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.6.1');
  api.use([
    'templating@1.3.2',
    'underscore',
    'jquery',
    'ecmascript'
  ], 'client');
  api.use([
    'semantic:ui-css@2.1.2',
    'aldeed:autoform@7.0.0',
    'urbanetic:utility@3.0.0'
  ], 'client', {weak: true});
  api.addFiles([
    'src/dropdown.html',
    'src/dropdown.js'
  ], 'client');
});
