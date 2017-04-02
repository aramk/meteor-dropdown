const templateName = 'dropdown';
const TemplateClass = Template[templateName];

const DEFAULT_TEXT = 'Select';

TemplateClass.created = function() {
  const data = this.data;
  const name = data.name;
  if (!name) {
    throw new Error('Name required for dropdown.');
  }
  // The next value to set once the item becomes available.
  this.nextValue = null;
  // "atts" is only provided when used with AutoForm.
  this.atts = data.atts || data;
};

TemplateClass.rendered = function() {
  this.isRendered = true;
  const data = this.data;
  const $input = getValueInput(this);

  const atts = this.atts;
  let schemaKey = atts.schemaKey;
  schemaKey = schemaKey !== undefined ? schemaKey : true;
  if (!schemaKey) {
    $input.removeAttr('data-schema-key');
  }

  const $dropdown = getDropdown(this).dropdown();
  setUpDropdown();

  // Handle changes to the collection.
  const items = atts.items;
  let cursor = items;
  // TODO(aramk) Add dependency to Collections.
  if (Collections.isCollection(items)) {
    cursor = items.find();
  }
  if (Collections.isCursor(cursor)) {
    let shouldObserve = false;
    // If passed a cursor, listen for changes and update the items reactively.
    const changeHandler = _.debounce(function() {
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
  const $em = resolveElement(em);
  const template = Templates.getInstanceFromElement(em);
  // Sanitize the values to null if they are falsey so we don't attempt to set the value to null
  // when it's currently an empty string.
  const existingValue = TemplateClass.getValue($em);
  value = value != null ? value : null;
  const hasValue = TemplateClass.hasValue($em, value);
  if (force || value !== existingValue || !hasValue) {
    if (hasValue) {
      $em.dropdown('set value', value).dropdown('set selected', value);
      // Necessary in some cases to ensure selection has the right text.
      clearTimeout(template.setSelectedHandle);
      template.setSelectedHandle = _.defer(function() {
        $em.dropdown('set selected', value);
      });
    } else {
      $em.dropdown('set value', null).dropdown('set text', template.atts.text || DEFAULT_TEXT);
    }
    template.nextValue = hasValue ? null : value;
    return true;
  } else {
    return false;
  }
};

TemplateClass.getValue = function(em) {
  const $em = resolveElement(em);
  let value = null;
  if ($em.length > 0) {
    value = $em.dropdown('get value');
    const trimValue = value.toString().trim();
    if (trimValue.length === 0 || trimValue === 'null') {
      value = null;
    }
  }
  return value;
};

TemplateClass.getItem = function(em, value) {
  const $menu = $('.menu', resolveElement(em));
  return $('.item[data-value=' + value + ']', $menu);
};

TemplateClass.bindVarToElement = function(em, reactiveVariable, args) {
  const $em = resolveElement(em);
  return Templates.bindVarToElement($em, reactiveVariable, _.extend(getTemplateBindArgs($em),
    args));
};

TemplateClass.bindSessionToElement = function(em, sessionVarName, args) {
  const $em = resolveElement(em);
  return Templates.bindSessionToElement($em, sessionVarName, _.extend(getTemplateBindArgs($em),
    args));
};

TemplateClass.isDropdown = function(em) {
  return resolveElement(em).length === 1;
};

function setUpDropdown(template) {
  template = getTemplate(template);
  if (!template.isRendered) {
    return;
  }

  const data = template.data;
  const atts = template.atts;
  const labelAttr = atts.labelAttr || 'name';
  const valueAttr = atts.valueAttr || '_id';
  const allowEmpty = atts.allowEmpty;
  const emptyLabel = atts.emptyLabel || 'None';
  let sorted = atts.sorted;
  sorted = sorted !== undefined ? sorted : false;
  const origValue = data.value;
  // The last non-empty value.
  let lastValue;
  const nextValue = template.nextValue;
  const $dropdown = getDropdown(template);

  // Save the last valid selection and restore it when possible after setup.
  const currentValue = TemplateClass.getValue($dropdown);
  if (currentValue != null) {
    lastValue = currentValue;
  } else if (nextValue) {
    lastValue = nextValue;
  }
  // TODO(aramk) This isn't efficient since we're manually recreating all items instead of
  // using the reactive template. We need a way to detect the template is re-rendered. Until then
  // this is a compromise.
  let items;
  if (data.selectOptions) {
    // AutoForm schema allowedValues.
    items = _.map(data.selectOptions, function(option) {
      const item = {};
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
    const emptyItem = {};
    Objects.setModifierProperty(emptyItem, labelAttr, emptyLabel);
    Objects.setModifierProperty(emptyItem, valueAttr, null);
    items.unshift(emptyItem);
  }
  const $menu = template.$('.menu');
  $menu.empty();
  _.each(items, function(item) {
    if (!Types.isObject(item)) {
      const value = item;
      item = {};
      Objects.setModifierProperty(item, valueAttr, value);
      Objects.setModifierProperty(item, labelAttr, value);
    }
    const $item = $('<div class="item" data-value="' + Objects.getModifierProperty(item, valueAttr) +
      '">' + Objects.getModifierProperty(item, labelAttr) + '</div>');
    $menu.append($item);
  });
  $dropdown.trigger('load');

  $dropdown.on('change', function() {
    const text = atts.text;
    if (text != null && atts.staticText) {
      $dropdown.dropdown('set text', text);
    }
  });

  const value = lastValue !== undefined ? lastValue : origValue;
  if (value) {
    const result = TemplateClass.setValue($dropdown, value);
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

function getTemplateBindArgs($em) {
  return {
    getValue: function() {
      return TemplateClass.getValue($em);
    },
    setValue: function(value) {
      TemplateClass.setValue($em, value);
    }
  }
}

function registerAutoForm() {
  const autoform = Package['aldeed:autoform'];
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

  cls() {
    let cls = this.name.trim().replace(/[\.\s]+/g, '-');
    if (this.cls) cls += ' ' + this.cls;
    return cls;
  },

  setUpDropdown() {
    setUpDropdown();
  },

  text() {
    return Template.instance().atts;
  }

});