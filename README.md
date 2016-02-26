meteor-dropdown
===============

A reactive dropdown widget for Meteor.

# Installation

```
meteor add aramk:dropdown
```

# Usage

In a template, add the `dropdown` template:

```
{{> dropdown name="foo" items=items}}
```

This is the minimum set of attributes. A full set of options are:

* name - Assigned to the element class, `data-schema-key` attribute, and `name` attribute. Useful for finding the dropdown element and passing it into methods.
* items - A collection, cursor, or array.
* value - An initial value.
* labelAttr - The property of each item which represents the label (visible dropdown value). Defaults to `name`.
* valueAttr - The property of each item which represents the underlying value. Defaults to `_id` which is useful for document collections.
* allowEmpty - Whether to allow a "None" selection, which has a value of `null`.
* sorted - Whether to sort the list of items alphabetically.
* text - The initial text to display in the dropdown before a value is selected.
* schemaKey - Whether to add the `data-schema-key` attribute. Defaults to `true`.