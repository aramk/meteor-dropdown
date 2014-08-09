AutoForm.inputValueHandlers({
  '.selection.dropdown': function() {
    return $('input', this).val();
  }
});

Template.dropdown.rendered = function() {
  var $dropdown = $(this.find('.dropdown'));
  var labelAttr = this.data.labelAttr || 'name';
  var valueAttr = this.data.valueAttr || '_id';
  var text = this.data.text;
  var firstSetUp = true;
  var setUpDropdown = function() {
    // TODO(aramk) This isn't efficient since we're manually recreating all items instead of
    // using the reactive template. We need a way to detect the template is re-rendered. Until then
    // this is a compromise.
    var items = Collections.getItems(this.data.items);
    var $menu = $(this.find('.menu'));
    $menu.empty();
    _.each(items, function(item) {
      var $item = $('<div class="item" data-value="' + item[valueAttr] + '">' + item[labelAttr] +
          '</div>');
      $menu.append($item);
    });
    $dropdown.dropdown();
    // Set initial value
    var value = this.data.value;
    if (value && firstSetUp) {
      $dropdown.dropdown('set value', value).dropdown('set selected', value);
    }
    updateText();
    firstSetUp = false;
  }.bind(this);
  var updateText = function () {
    if (text !== undefined) {
      $dropdown.dropdown('set text', text);
    }
  };
  // Handle changes to the collection.
  var items = this.data.items;
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
  $dropdown.on('change', function () {
    updateText();
  });
};

Template.dropdown.destroyed = function() {
  this._changeHandle && this._changeHandle.stop();
};

Template.dropdown.helpers({

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
