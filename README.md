# math-input

A WebComponent form element for inputting mathematical expressions. Spiritual successor of [adm-math](https://github.com/wyattpeak/adm-math).

This component defines the `<math-input>` field, which behaves as a regular form element. Its `value` attribute contains a representation of the typed expression in [content MathML](https://www.w3.org/TR/MathML3/chapter4.html).

## Installation

The component is contained in a single JavaScript file, `math-input.js`. Simply download it into your project folder.

## Usage

First include the module:

```html
<script type="module" src="math-input.js"></script>
```

Then use it as a regular form element:

```html
<form...>
    <math-input name="fieldName" tabindex="1"></math-input>
</form>
```

**Note:** Due to WebComponent limitations, you must give the field a `tabindex`.

## Math Support

The field will accept the following characters as input:

`[a-zA-Z0-9α-ωΑ-Ω.+\-*\/()\|^]`

It will also accept the following elements, which can't be easily typed:

| Element     | Symbol| 
| ----------- | ------ |
| Square root | `sqrt` |
| π           | `pi`   |

To input one of these, set the `<math-input>`'s `insert` attribute to its symbol in the right hand column. A buttton to add a square root symbol, for instance, might look like this:

```html
<input type="button" value="Square Root" onclick="document.getElementsByName('fieldName')[0].setAttribute('insert', 'sqrt');" />
```

The attribute will auto-clear when the element has been inserted, there's no need to clear it before inserting another element.