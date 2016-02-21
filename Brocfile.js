var compileSass = require('broccoli-sass'),
  concatenate = require('broccoli-concat'),
  mergeTrees  = require('broccoli-merge-trees'),
  pickFiles   = require('broccoli-static-compiler'),
  uglifyJs    = require('broccoli-uglify-js'),
  jade        = require('broccoli-jade'),
  browserify = require('broccoli-browserify'),
  esTranspiler = require('broccoli-babel-transpiler'),
  env = require('broccoli-env').getEnv();

var app = 'app',
    appCss,
    appHtml,
    appLib, appLibJs, appLibCss,
    appJs,
    appImg,
    appFonts;

/**
 * move the index.html file from the project /app folder
 * into the build assets folder
 */
appHtml = pickFiles(app, {
  srcDir  : '/',
  files   : ['**.jade'],
  destDir : '/'
});

appHtml = jade(appHtml, {pretty: true});

/**
 * put all the bower dependencies under /lib
 */
var bower = 'bower_components';
var bowerItems = [
  {
    dir: '/lodash',
    files: ['lodash.js']
  },
  {
    dir: '/jquery/dist',
    files: ['jquery.js']
  },
  {
    dir: '/bootstrap/dist',
    files: ['js/bootstrap.js', 'css/bootstrap.css']
  }
];
var bowerTrees = [];
var concatInputFiles = {css:[],js:[]}; // in the same order as bowerItems

bowerItems.forEach(function (item) {
  var tree = pickFiles(bower, {
    srcDir: item.dir,
    files: item.files,
    destDir: '/lib'
  });
  bowerTrees.push(tree);

  // build inputFiles lists
  item.files.forEach(function (file) {
    var extension = file.substring(file.length-3);
    var array = {'.js': concatInputFiles.js, 'css': concatInputFiles.css}[extension];
    array.push('lib/' + file);
  });
});

appLib = mergeTrees(bowerTrees);

appLibJs = concatenate(appLib, {
  inputFiles : concatInputFiles.js,
  outputFile : '/vendor.js'
});

appLibCss = concatenate(appLib, {
  inputFiles : concatInputFiles.css,
  outputFile : '/vendor.css'
});

appLib = mergeTrees([appLibJs, appLibCss]);

/**
 * transpile and browserify js files
 */

appJs = esTranspiler(app, {browserPolyfill: true});

appJs = browserify(appJs, {
  entries: ['./scripts/main.js'],
  outputFile: 'app.js'
});

//if (env === 'production') {
//  appJs = uglifyJs(appJs, {
//    compress: true,
//    mangle: true
//  });
//}


// appImg = pickFiles(app, {
//   srcDir  : '/assets',
//   files   : ['**/*.png'],
//   destDir : '/img'
// });


// Compile Sass to 1 css file
appCss = compileSass([app], 'styles/main.scss', '/style.css');

// fonts from bootstrap
appFonts = pickFiles(bower, {
  srcDir: 'bootstrap/dist',
  files: ['fonts/glyphicons-halflings-regular.*'],
  destDir: '/'
});


// merge HTML, JavaScript and CSS trees into a single tree and export it
module.exports = mergeTrees([appHtml, appLib, appJs, appCss, appFonts]);
