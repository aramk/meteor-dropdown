var templateName = 'dropdown';
var TemplateClass = Template[templateName];

var defaultText = 'Select';

TemplateClass.created = function() {
  var data = this.data;
  var name = data.name;
  if (!name) {
    throw new Error('Name required for dropdown.');
  }
  // The next value to set once the item becomes available.
  this.nextValue = null;
};

TemplateClass.rendered = function() {
  this.isRendered = true;
  var data = this.data;
  // "atts" is only provided when used with AutoForm.
  var atts = data.atts || data;
  var $input = getValueInput(this);

  var schemaKey = atts.schemaKey;
  schemaKey = schemaKey !== undefined ? schemaKey : true;
  if (!schemaKey) {
    $input.removeAttr('data-schema-key');
  }

  var $dropdown = getDropdown(this).dropdown();
  setUpDropdown();

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
    var changeHandler = _.debounce(function() {
      shouldObserve && setUpDropdown(this);
    }.bind(this), 500);
    this._changeHandle = cursor.observe({
      added: changeHandler,
      changed: changeHandler,
      removed: changeHandler
    });
    // Delay observing to avoid the added() callback firing for existing items.
    shouldObserve = true;
  }
};

TemplateClass.destroyed = function() {
  this._changeHandle && this._changeHandle.stop();
};

TemplateClass.hasValue = function(em, value) {
  return $('.menu [data-value="' + value + '"]', resolveElement(em)).length > 0;
};

TemplateClass.setValue = function(em, value, force) {
  var $em = resolveElement(em);
  var template = Templates.getInstanceFromElement(em);
  // Sanitize the values to null if they are falsey so we don't attempt to set the value to null
  // when it's currently an empty string.
  var existingValue = TemplateClass.getValue($em);
  value = value != null ? value : null;
  var hasValue = TemplateClass.hasValue($em, value);
  if (force || value !== existingValue || !hasValue) {
    if (hasValue) {
      $em.dropdown('set value', value).dropdown('set selected', value);
      // Necessary in some cases to ensure selection has the right text.
      clearTimeout(template.setSelectedHandle);
      template.setSelectedHandle = _.defer(function() {
        $em.dropdown('set selected', value);
      });
    } else {
      $em.dropdown('set value', null).dropdown('set text', defaultText);
    }
    template.nextValue = hasValue ? null : value;
    return true;
  } else {
    return false;
  }
};

TemplateClass.getValue = function(em) {
  var $em = resolveElement(em);
  var value = null;
  if ($em.length > 0) {
    value = $em.dropdown('get value');
    var trimValue = value.toString().trim();
    if (trimValue.length === 0 || trimValue === 'null') {
      value = null;
    }
  }
  return value;
};

TemplateClass.getItem = function(em, value) {
  var $menu = $('.menu', resolveElement(em));
  return $('.item[data-value=' + value + ']', $menu);
};

TemplateClass.bindVarToElement = function(em, reactiveVariable, args) {
  var $em = resolveElement(em);
  return Templates.bindVarToElement($em, reactiveVariable, _.extend({
    getValue: function() {
      return TemplateClass.getValue($em);
    },
    setValue: function(value) {
      TemplateClass.setValue($em, value);
    }
  }, args));
};

TemplateClass.isDropdown = function(em) {
  return resolveElement(em).length === 1;
};

function setUpDropdown(template) {
  template = getTemplate(template);
  if (!template.isRendered) {
    return;
  }

  var data = template.data;
  // "atts" is only provided when used with AutoForm.
  var atts = data.atts || data;
  var labelAttr = atts.labelAttr || 'name';
  var valueAttr = atts.valueAttr || '_id';
  var allowEmpty = atts.allowEmpty;
  var emptyLabel = atts.emptyLabel || 'None';
  var sorted = atts.sorted;
  sorted = sorted !== undefined ? sorted : false;
  var origValue = data.value;
  // The last non-empty value.
  var lastValue;
  var nextValue = template.nextValue;
  var $dropdown = getDropdown(template);

  // Save the last valid selection and restore it when possible after setup.
  var currentValue = TemplateClass.getValue($dropdown);
  if (currentValue != null) {
    lastValue = currentValue;
  } else if (nextValue) {
    lastValue = nextValue;
  }
  // TODO(aramk) This isn't efficient since we're manually recreating all items instead of
  // using the reactive template. We need a way to detect the template is re-rendered. Until then
  // this is a compromise.
  var items;
  if (data.selectOptions) {
    // AutoForm schema allowedValues.
    items = _.map(data.selectOptions, function(option) {
      var item = {};
      Objects.setModifierProperty(item, valueAttr, option.value);
      Objects.setModifierProperty(item, labelAttr, option.label);
      return item;
    });
  } else if (atts.items) {
    // Collection, cursor or array.
    items = Collections.getItems(atts.items);
  }
  if (!items) {
    throw new Error('Dropdown items not defined.');
  }

  // Sort items based on label.
  if (sorted) {
    items.sort(function(itemA, itemB) {
      return Objects.getModifierProperty(itemA, labelAttr).toLowerCase() <
          Objects.getModifierProperty(itemB, labelAttr).toLowerCase() ? -1 : 1;
    });
  }

  if (allowEmpty) {
    var emptyItem = {};
    Objects.setModifierProperty(emptyItem, labelAttr, emptyLabel);
    Objects.setModifierProperty(emptyItem, valueAttr, null);
    items.unshift(emptyItem);
  }
  var $menu = template.$('.menu');
  $menu.empty();
  _.each(items, function(item) {
    if (!Types.isObject(item)) {
      var value = item;
      item = {};
      Objects.setModifierProperty(item, valueAttr, value);
      Objects.setModifierProperty(item, labelAttr, value);
    }
    var $item = $('<div class="item" data-value="' + Objects.getModifierProperty(item, valueAttr) +
        '">' + Objects.getModifierProperty(item, labelAttr) + '</div>');
    $menu.append($item);
  });
  $dropdown.trigger('load');

  $dropdown.on('change', function() {
    var text = atts.text;
    if (text !== undefined) {
      $dropdown.dropdown('set text', text);
    }
  });

  var value = lastValue !== undefined ? lastValue : origValue;
  if (value) {
    var result = TemplateClass.setValue($dropdown, value);
    if (result) {
      TemplateClass.setValue($dropdown, value, true);
    }
    if (!TemplateClass.hasValue($dropdown, value)) {
      $dropdown.dropdown('set selected', '');
    }
  }
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
    var cls = this.name.trim().replace(/[\.\s]+/g, '-');
    if (this.cls) cls += ' ' + this.cls;
    return cls;
  },

  setUpDropdown: function() {
    setUpDropdown();
  }

});
