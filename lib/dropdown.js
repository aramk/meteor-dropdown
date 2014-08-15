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
  var data = this.data;
  var labelAttr = data.labelAttr || 'name';
  var valueAttr = data.valueAttr || '_id';
  var text = data.text;
  var allowEmpty = data.allowEmpty;
  var firstSetUp = true;
  var setUpDropdown = function() {
    // TODO(aramk) This isn't efficient since we're manually recreating all items instead of
    // using the reactive template. We need a way to detect the template is re-rendered. Until then
    // this is a compromise.
    var items = Collections.getItems(data.items);
    if (allowEmpty) {
      var emptyItem = {};
      emptyItem[valueAttr] = null;
      emptyItem[labelAttr] = '';
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
    // Set initial value
    var value = data.value;
    if (value && firstSetUp) {
      TemplateClass.setValue($dropdown, value);
    }
    updateText();
    firstSetUp = false;
  }.bind(this);
  var updateText = function() {
    if (text !== undefined) {
      $dropdown.dropdown('set text', text);
    }
  };
  // Handle changes to the collection.
  var items = data.items;
  if (Collections.isCursor(items)) {
    // If passed a cursor, listen for changes and update the items reactively.
    var changeHandler = function() {
      setUpDropdown();
    };
    this._changeHandle = items.observe({
      added: changeHandler,
      changed: changeHandler,
      removed: changeHandler
    });
  }
  setUpDropdown();
  $dropdown.on('change', function() {
    updateText();
  });
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
  } else {
    console.warn('Could not set dropdown value', node, value);
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
