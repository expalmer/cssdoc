# cssdoc

> Generating Documentation for CSS with Markdown

## What's it ?

Are you starting a new css styleguide, or updating your css in a project?

**You need a documentation!**

With ``cssdoc`` you can write the documentation in your css files with ``markdown``, and transform it in
a cool and responsive web page.

## Install

```
npm install cssdoc --save
```

## Usage

Firstly, you have to write the documentation in your css file, like this:

```css
/*---
title: Buttons
resume: The buttons page
section: Default Buttons
---

My ``styleguide`` includes two predefined **button** styles, each serving its own semantic purpose.

```example
<button type="button" class="button">Default</button>
<button type="button" class="button button--primary">Primary</button>
​```

```html
<button type="button" class="button">Default</button>
<button type="button" class="button button--primary">Primary</button>
​```

.button {
  color: #bbb;
  font-size: 1em;
}

.button--primary {
  color: #e34;
  background: #fff;
}

*/

```

Then save a file, for example, 'css/styles.css' with its css.

And run...

```javascript

var Cssdoc = require('cssdoc');

Cssdoc({
  inputDir: './css',    // directory with the css files
  outputDir: './build'  // directory that will be created the page
});

```

Done! Now go to the ``build`` directory and open the file ``index.html`` in your browser.

Enjoy!

## Examples

Here some examples using ``bootstrap 4`` and ``primercss`` only to demonstrate what you can do with ``cssdoc``.

  - [Bootstrap 4 Example](/examples/bootstrap4)
  - [PrimerCss Example](/examples/primercss)
  - [MyStyleguide Example](/examples/mystyleguide)
  - [Multifile Example](/examples/multifile)

The ``mystyleguide`` example, is an example of the real purpose of this library, give you a way to document your css style guides.







