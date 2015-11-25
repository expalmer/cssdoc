var fs       = require('co-fs-extra'),
    marked   = require('marked'),
    matter   = require('gray-matter'),
    Swig     = require('swig'),
    walkSync = require('walk-sync'),
    slug     = require('slug');

marked.setOptions({
  highlight: function (code) {
    return require('highlight.js')
      .highlightAuto(code).value;
  }
});

var commentPattern = /\/\*---([\s\S]+?)?\*\//g
    examplePattern = /```example([\s\S]+?)```/g,
    templatePath = __dirname + '/template';

var DEFAULT_OPTIONS = {
  base: '',
  title: 'My Awesome Styleguide',
  highlightTheme: 'github',
  logo: templatePath + '/logo.png',
  favicon: templatePath + '/favicon.ico',
  css: templatePath + '/style.css',
  js: templatePath + '/script.js'
};

module.exports = Cssdoc;

function Cssdoc(opts){
  if (!(this instanceof Cssdoc)) {
    return new Cssdoc(opts);
  }
  this.opts = Object.assign({}, DEFAULT_OPTIONS, opts);
  this.comments = {};
  this.contents = [];
  this.run();
}

Cssdoc.prototype.run = function(){
  var paths = walkSync(this.opts.inputDir, { directories: false });
  var i = paths.length;
  var path;
  while (i--) {
    path = this.opts.inputDir +'/'+ paths[i];
    console.log('Reading file', path, '...');
    this.processFile(fs.readFileSync(path, 'utf8'));
  }
  this.compileTemplate();
};

Cssdoc.prototype.processFile = function(fileContent){
  var separated = this.separeCommentsOfContents(fileContent);
  this.addContent( separated.content );

  var index = -1;
  var total = separated.comment.length - 1;
  var comment,
      parsed,
      data,
      content;
  while (index++ < total) {
    comment = separated.comment[index];
    parsed = matter(comment);
    data = parsed.data;
    content = this.replaceExampleInPureHtml(parsed.content);
    content = marked(content);
    content = this.addHighlightTag(content);
    this.addComment(data, content);
  }
};

Cssdoc.prototype.separeCommentsOfContents = function(fileContent){
  var comments = [];
  fileContent = fileContent.replace(commentPattern, function(item){
    comments.push(item.replace('/*','').replace('*/',''));
    return '';
  });
  return {
    comment: comments,
    content: fileContent
  }
};

Cssdoc.prototype.replaceExampleInPureHtml = function(comment){
  return comment.replace(examplePattern, function(example){
        return [ '<div class="docs-example clearfix">',
          example.replace(/(```example)/g,'').replace(/```/,'').replace(/^\n/,''),
          '</div>'].join('');
      });
};

Cssdoc.prototype.addHighlightTag = function(comment){
  return comment.
    replace(/<pre>/g, function(i) {
      return i.replace('>', ' class="hljs">').trim();
    });
};

Cssdoc.prototype.addContent = function(content){
  this.contents.push(content);
};

Cssdoc.prototype.addComment = function(data, content){
  if (!this.comments[data.title]) {
    this.comments[data.title] = {
      id: this.generateId(data.title),
      title: data.title,
      resume: data.resume,
      sections: []
    };
  }
  this.comments[data.title].sections.push( {
    id: this.generateId(data.section, data.title),
    title: data.section,
    content: content
  });
};

Cssdoc.prototype.generateId = function(string, prefix) {
  string = prefix ? prefix +'_'+ string : string ;
  return slug(string, { lower: true });
};

Cssdoc.prototype.compileTemplate = function(){
  var datas = {
    base: this.opts.base,
    title: this.opts.title,
    items: this.comments
  };
  var dest = this.opts.outputDir +'/index.html';
  var tmpl = Swig.renderFile(templatePath +'/index.html', datas);
  this.generateAssets();
  try {
    fs.outputFile(dest, tmpl);
    console.log('Done! Page created in', dest);
  } catch (e) {
    e.message = 'Failed to create the files at: ' + this.opts.outputDir + '\n\n' + e.message;
    throw e;
  }
};

Cssdoc.prototype.generateAssets = function(){
  console.log('Generating Assets ...');
  this.addLogoAndFavicon();
  this.combineCss();
  this.combineJs();
};

Cssdoc.prototype.addLogoAndFavicon = function(){
  fs.copySync(this.opts.favicon, this.opts.outputDir + '/favicon.ico');
  fs.copySync(this.opts.logo, this.opts.outputDir + '/img/logo.png');
};

Cssdoc.prototype.combineCss = function(){
  var styleCss = this.contents.join('');
  var templCss = fs.readFileSync(this.opts.css, 'utf8');
  var highlight = fs.readFileSync(require.resolve('highlight.js/styles/' + this.opts.highlightTheme + '.css'), 'utf8');
  fs.outputFile(this.opts.outputDir +'/css/style.css', styleCss + templCss + highlight);
};

Cssdoc.prototype.combineJs = function(){
  var templJs = fs.readFileSync( this.opts.js, 'utf8');
  fs.outputFile(this.opts.outputDir + '/js/script.js', templJs);
};
