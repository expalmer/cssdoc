var fs  = require('co-fs-extra');
var marked = require('marked');
var matter = require('gray-matter');
var swig  = require('swig');

var commentPattern = /\/\*---([\s\S]+?)?\*\//g;
var examplePattern = /```example([\s\S]+?)```/g;
var templatePath = __dirname + '/template';

marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

var _defaults = {
  base: '',
  title: 'My Awesome Styleguide',
  footer: 'Cssdoc is Cool',
  destination: './build',
  highlightTheme: 'hybrid'
};

/**
 * Export `Cssdoc`.
 */
module.exports = Cssdoc;

/**
 * Initialize a new `Cssdoc` builder with a working `directory` and `options` Optional.
 *
 * @param {String} directory
 * @param {Object} opts
 */
function Cssdoc( directory, opts ) {
  if ( !(this instanceof Cssdoc) ) {
    return new Cssdoc( directory, opts );
  }

  this.directory = directory;
  this.opts = Object.assign( {}, _defaults, opts );

  this.cssComments = {};
  this.cssContents = [];

  this.initialize();
}

/**
 * Walk through each file in css directories
 */
Cssdoc.prototype.initialize = function () {
  this.walk( this.directory, this.pathsHandler.bind(this) );
};

/**
 * Walk through directories
 */
Cssdoc.prototype.walk = function ( dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

/**
 * Receive all path of the files.
 *
 * @param {Boolean} err
 * @param {Array} paths
 */
Cssdoc.prototype.pathsHandler = function( err, paths ){
  if ( err ) {
    throw new Error(err);
  }
  var i = paths.length;
  while( i-- ) {
    this.commentHandler( fs.readFileSync(paths[i], 'utf8') );
  }
  this.createPage();
};

/**
 * Handle each file content to extract the comments.
 *
 * @param {Boolean} err
 * @param {Array} paths
 */
Cssdoc.prototype.commentHandler = function ( fileContent ) {

  var comments = [];

  fileContent = fileContent.replace(commentPattern, function( item ) {
    comments.push( item.replace('/*','').replace('*/','') );
    return '';
  });

  this.addCssContents( fileContent );

  var i = comments.length;
  var comment,
      parsed,
      data,
      content;

  while( i-- ) {
    comment = comments[i];
    parsed = matter(comment);
    data = parsed.data;
    content = parsed.content.replace(examplePattern, function( example ) {
      return [ '<div class="docs-example clearfix">',
        example.replace(/(```example)/g,'').replace(/```/,'').replace(/^\n/,''),
        '</div>'].join('');
    });

    content = marked(content)
      .replace(/<pre>/g, function(i) {
        return i.replace('>', ' class="hljs">').trim();
      });

    this.addCssComments( data, content );
  }

};


/**
 * Feed the this.cssContents
 *
 * @param {String} content
 */
Cssdoc.prototype.addCssContents = function( content ) {
  this.cssContents.push(content);
};

/**
 * Feed the this.cssComments
 *
 * @param {Object} data
 * @param {Object} content
 */
Cssdoc.prototype.addCssComments = function( data, content ) {
  this.cssComments[data.title] = this.cssComments[data.title] || {};
  this.cssComments[data.title].title  = data.title;
  this.cssComments[data.title].resume = data.resume;
  this.cssComments[data.title].sections = this.cssComments[data.title].sections || [];
  this.cssComments[data.title].sections.push( {
    title: data.section,
    content: content
  });
};

/**
 * Create the web page
 */
Cssdoc.prototype.createPage = function() {
  var datas = {
    base: this.opts.base,
    title: this.opts.title,
    footer: this.opts.footer,
    items: this.cssComments
  };

  this.combineCss();
  this.combineJs();

  var page = swig.renderFile( templatePath + '/index.html', datas );
  try {
    fs.outputFile( this.opts.destination + '/index.html', page );
  } catch (e) {
    e.message = 'Failed to create the files at: ' + this.opts.destination + '\n\n' + e.message;
    throw e;
  }
};

/**
 * Combine the documentation css and the template css
 */
Cssdoc.prototype.combineCss = function() {
  var styleCss = this.cssContents.join('');
  var templCss = fs.readFileSync( templatePath + '/style.css', 'utf8');
  var highlight = '';
  highlight = fs.readFileSync( __dirname + '/node_modules/highlight.js/styles/' + this.opts.highlightTheme + '.css', 'utf8');

  fs.copySync( templatePath + '/logo.png', this.opts.destination + '/img/logo.png');

  fs.outputFile( this.opts.destination + '/css/style.css', styleCss + templCss + highlight );
};

/**
 * Combine the documentation js and the template js
 */
Cssdoc.prototype.combineJs = function() {
  var templJs = fs.readFileSync( templatePath + '/script.js', 'utf8');
  fs.outputFile( this.opts.destination + '/js/script.js', templJs );
};