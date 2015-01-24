var templateName = 'dropdown';
var TemplateClass = Template[templateName];

var defaultText = 'Select';

TemplateClass.created = function() {
  var data = this.data;
  var name = data.name;
  if (!name) {
    throw new Error('Name required for dropdown.');
  }
};

TemplateClass.rendered = function() {
  this.isRendered = true;
  var $dropdown = getDropdown(this).dropdown();
  var $input = getValueInput(this);
  var data = this.data;
  // "atts" is only provided when used with AutoForm.
  var atts = data.atts || data;
  
  var schemaKey = atts.schemaKey;
  schemaKey = schemaKey !== undefined ? schemaKey : true;
  var text = atts.text;
  
  var updateText = this.updateText = function() {
    if (text !== undefined) {
      $dropdown.dropdown('set text', text);
    }
  };
  // Handle changes to the collection.
  var items = atts.items;
  var cursor = items;
  // TODO(aramk) Add dependency to Collections.
  if (Collections.isCollection(items)) {
    cursor = items.find();
  }
  if (Collections.isCursor(cursor)) {
    var shouldObserve = false;
    // If passed a cursor, listen for changes and update the items reactively.
    var changeHandler = function() {
      shouldObserve && setUpDropdown();
    };
    this._changeHandle = cursor.observe({
      added: changeHandler,
      changed: changeHandler,
      removed: changeHandler
    });
    // Delay observing to avoid the added() callback firing for existing items.
    shouldObserve = true;
  }

  $dropdown.on('change', function() {
    updateText();
  });
  if (!schemaKey) {
    $input.removeAttr('data-schema-key');
  }
  TemplateClass.setValue($dropdown, data.value);

  setUpDropdown();
};

TemplateClass.destroyed = function() {
  this._changeHandle && this._changeHandle.stop();
};

TemplateClass.hasValue = function(em, value) {
  return $('.menu [data-value="' + value + '"]', resolveElement(em)).length > 0;
};

TemplateClass.setValue = function(em, value) {
  var $em = resolveElement(em);
  var shouldClear = !value;
  var existingValue = TemplateClass.getValue($em);
  if (value !== existingValue && (TemplateClass.hasValue($em, value) || shouldClear)) {
    $em.dropdown('set value', value).dropdown('set selected', value);
    if (shouldClear) {
      $em.dropdown('set text', defaultText);
    }
    return true;
  } else {
    return false;
  }
};

TemplateClass.getValue = function(em) {
  var $em = resolveElement(em);
  return $em.length > 0 ? $em.dropdown('get value') : null;
};

TemplateClass.getItem = function(em, value) {
  var $menu = $('.menu', resolveElement(em));
  return $('.item[data-value=' + value + ']', $menu);
};

TemplateClass.bindVarToElement = function(em, reactiveVariable, args) {
  Templates.bindVarToElement(resolveElement(em), reactiveVariable, _.extend({
    getValue: function() {
      return Template.dropdown.getValue($(this));
    },
    setValue: function(value) {
      Template.dropdown.setValue(value);
    }
  }, args));
};

TemplateClass.isDropdown = function(em) {
  return resolveElement(em).length === 1;
};

function setUpDropdown() {
  var template = getTemplate();
  if (!template.isRendered) {
    return;
  }

  var data = template.data;
  // "atts" is only provided when used with AutoForm.
  var atts = data.atts || data;
  var labelAttr = atts.labelAttr || 'name';
  var valueAttr = atts.valueAttr || '_id';
  var allowEmpty = atts.allowEmpty;
  var origValue = data.value;
  // The last non-empty value.
  var lastValue;
  var $dropdown = getDropdown();

  // Save the last valid selection and restore it when possible after setup.
  var currentValue = TemplateClass.getValue($dropdown);
  if (currentValue !== '') {
    lastValue = currentValue;
  }
  // TODO(aramk) This isn't efficient since we're manually recreating all items instead of
  // using the reactive template. We need a way to detect the template is re-rendered. Until then
  // this is a compromise.
  var items;
  if (data.selectOptions) {
    // AutoForm schema allowedValues.
    items = _.map(data.selectOptions, function(option) {
      var item = {};
      item[valueAttr] = option.value;
      item[labelAttr] = option.label;
      return item;
    });
  } else if (atts.items) {
    // Collection, cursor or array.
    items = Collections.getItems(atts.items);
  }
  if (!items) {
    throw new Error('Dropdown items not defined.');
  }
  if (allowEmpty) {
    var emptyItem = {};
    emptyItem[valueAttr] = emptyItem[labelAttr] = '';
    items.unshift(emptyItem);
  }
  var $menu = template.$('.menu');
  $menu.empty();
  _.each(items, function(item) {
    if (!Types.isObject(item)) {
      var value = item;
      item = {};
      item[valueAttr] = value;
      item[labelAttr] = value;
    }
    var $item = $('<div class="item" data-value="' + item[valueAttr] + '">' + item[labelAttr] +
        '</div>');
    $menu.append($item);
  });
  var value = lastValue !== undefined ? lastValue : origValue;
  if (value) {
    if (!TemplateClass.hasValue($dropdown, value)) {
      value = '';
    }
    TemplateClass.setValue($dropdown, value);
  }
  template.updateText();

  // Updates the dropdown events for the updated items.
  $dropdown.dropdown();
}

function getDropdown(template) {
  return getTemplate(template).$('.ui.dropdown');
}

function getValueInput(template) {
  return getTemplate(template).$('input');
}

function getTemplate(template) {
  return Templates.getNamedInstance(templateName, template);
}

function resolveElement(em) {
  return $(em).closest('.ui.dropdown');
}

function registerAutoForm() {
  var autoform = Package['aldeed:autoform'];
  if (typeof autoform === 'undefined') {
    console.error('Cannot register input type - AutoForm not found.');
    return;
  }
  autoform.AutoForm.addInputType('dropdown', {
    template: 'dropdown',
    valueOut: function() {
      return TemplateClass.getValue(this.closest('.dropdown'));
    }
  });
}

registerAutoForm();

TemplateClass.helpers({

  cls: function() {
    return this.name.replace('.', '-');
  },

  setUpDropdown: function() {
    setUpDropdown();
  }

//  processedItems: function () {
//    var items = Collections.getItems(this.items);
//    var labelAttr = this.labelAttr || 'name';
//    var valueAttr = this.valueAttr || '_id';
//    return _.map(items, function(item) {
//      return {
//        label: item[labelAttr],
//        value: item[valueAttr]
//      }
//    });
//  },
//  afterUpdate: function () {
//    // Only requested to ensure this is called on updates to the
//    var items = Collections.getItems(this.items);
//  }
//  labelAttr: function () {
//    return this.labelAttr || 'name';
//  },
//  valueAttr: function () {
//    return this.valueAttr || '_id';
//  }

});
