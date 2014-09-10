var TemplateClass = Template.dropdown;

var templateInstances = {};
var nextId = 1;
var idField = '_dropdownId';

function addTemplateInstance(template) {
  var id = nextId++;
  templateInstances[id] = template;
  template[idField] = id;
  getDropdown(template).data(idField, id);
  return id;
}

function getDropdown(template) {
  return $(template.find('.dropdown'));
}

function getValueInput(template) {
  return $(template.find('input'));
}

function getTemplate(node) {
  var id = $(node).data(idField);
  return templateInstances[id];
}

var registerAutoForm = _.once(function() {
  if (typeof AutoForm === 'undefined') {
    return;
  }
  AutoForm.inputValueHandlers({
    '.selection.dropdown': function() {
      return $('input', this).val();
    }
  });
});

TemplateClass.created = function() {
  registerAutoForm();
};

TemplateClass.rendered = function() {
  addTemplateInstance(this);
  var $dropdown = getDropdown(this);
  var $input = getValueInput(this);
  var data = this.data;
  var name = data.name;
  if (!name) {
    throw new Error('Name required for dropdown.');
  }
  var labelAttr = data.labelAttr || 'name';
  var valueAttr = data.valueAttr || '_id';
  var schemaKey = data.schemaKey;
  schemaKey = schemaKey !== undefined ? schemaKey : true;
  var text = data.text;
  var allowEmpty = data.allowEmpty;
  // The last non-empty value.
  var lastValue;
  var setUpDropdown = function() {
    // Save the last valid selection and restore it when possible after setup.
    var currentValue = TemplateClass.getValue($dropdown);
    if (currentValue !== '') {
      lastValue = currentValue;
    }
    // TODO(aramk) This isn't efficient since we're manually recreating all items instead of
    // using the reactive template. We need a way to detect the template is re-rendered. Until then
    // this is a compromise.
    var items = Collections.getItems(data.items);
    if (allowEmpty) {
      var emptyItem = {};
      emptyItem[valueAttr] = emptyItem[labelAttr] = '';
      items.unshift(emptyItem);
    }
    data.resolvedItems = items;
    var $menu = $(this.find('.menu'));
    $menu.empty();
    _.each(items, function(item) {
      var $item = $('<div class="item" data-value="' + item[valueAttr] + '">' + item[labelAttr] +
          '</div>');
      $menu.append($item);
    });
    $dropdown.dropdown();
    var value = lastValue || data.value;
    if (value) {
      if (!TemplateClass.hasValue($dropdown, value)) {
        value = '';
      }
      TemplateClass.setValue($dropdown, value);
    }
    updateText();
  }.bind(this);
  var updateText = function() {
    if (text !== undefined) {
      $dropdown.dropdown('set text', text);
    }
  };
  // Handle changes to the collection.
  var items = data.items;
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
  setUpDropdown();
  $dropdown.on('change', function() {
    updateText();
  });
  if (schemaKey) {
    $input.attr('data-schema-key', name);
  }
};

TemplateClass.destroyed = function() {
  this._changeHandle && this._changeHandle.stop();
};

TemplateClass.hasValue = function(node, value) {
  var $dropdown = $(node);
  return $('.menu [data-value="' + value + '"]', $dropdown).length > 0;
};

TemplateClass.setValue = function(node, value) {
  if (TemplateClass.hasValue(node, value)) {
    $(node).dropdown('set value', value).dropdown('set selected', value);
    return true;
  } else {
    return false;
  }
};

TemplateClass.getValue = function(node) {
  return $(node).dropdown('get value');
};

TemplateClass.helpers({

  cls: function() {
    return this.name.replace('.', '-');
  },
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
