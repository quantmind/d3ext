/*eslint-env node */
module.exports = function(grunt) {
    'use strict';

    var srcPath = 'src',
        config_file = srcPath +'/config.json',
        cfg = grunt.file.readJSON(config_file),
        jslibs = cfg.js,
        path = require('path'),
        _ = require('lodash'),
        baseTasks = [],
        jsTasks = [],
        cssTasks = [],
        // These entries are tasks configurators not libraries
        skipEntries = ['options', 'watch'],
        concats = {
            options: {
                sourceMap: false // TODO change to true when Chrome sourcemaps bug is fixed
            }
        },
        requireOptions = {
            baseUrl: srcPath + '/',
            generateSourceMaps: false, // TODO change to true when Chrome sourcemaps bug is fixed
            optimize: 'none',
            name: 'app',
            out: srcPath + '/build/bundle.js',
            paths: _.reduce(cfg.thirdParty, function (obj, el) {
                obj[el] = 'empty:';
                return obj;
            }, {})
        },
        rollupPlugins = {
            babel: "rollup-plugin-babel",
            nodeResolve: "rollup-plugin-node-resolve"
        },
        lux = {
            buildLuxConfig: {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: function () {
                    return path.resolve('manage.py') + ' media';
                }
            },
            buildPythonCSS: {
                options: {
                    stdout: true,
                    stderr: true
                },
                command: function () {
                    return path.resolve('manage.py') + ' style --cssfile ' + path.resolve('scss/deps/py.lux');
                }
            }
        };

    if (cfg.useLux) {
        baseTasks = ['shell:buildLuxConfig', 'luxbuild'];
        // Extend shell tasks with lux configuration tasks
        cfg.shell = _.extend(lux, cfg.shell);
    }

    if (!jslibs)
        grunt.log.debug('"js" entry not available in "' + config_file + '"');

    delete cfg.js;

    cfg.pkg = grunt.file.readJSON('package.json');

    //
    cfg.concat = concats;
    //
    // Extend clean tasks with standard cleanup duties
    cfg.clean = _.extend({
        js: {
            src: [srcPath + '/build']
        },
        css: {
            src: ['scss/deps']
        },
        test: {
            src: ['coverage', 'junit']
        }
    }, cfg.clean);

    //
    //  JS tasks
    //  -----------------------
    //  Tasks are loaded only if specified in the cfg
    //
    //  ESLINT
    if (cfg.eslint) {
        if (!cfg.eslint.options)
            cfg.eslint.options = {
                quiet: true
            };
        grunt.loadNpmTasks('grunt-eslint');
        jsTasks.push('eslint');
    }
    //
    //  HTML2JS
    if (cfg.html2js) {
        grunt.loadNpmTasks('grunt-html2js');
        jsTasks.push('html2js');
    }
    //
    // REQUIREJS
    if (cfg.requirejs) {
        grunt.loadNpmTasks('grunt-contrib-requirejs');
        jsTasks.push('requirejs');
        _.forOwn(cfg.requirejs, function (value, name) {
            cfg.requirejs[name] = _.extend({}, requireOptions, value);
        });
    }
    //
    //  HTTP
    if (cfg.http) {
        grunt.loadNpmTasks('grunt-http');
        jsTasks.push('http');
    }
    //
    //  COPY
    if (cfg.copy) {
        grunt.loadNpmTasks('grunt-contrib-copy');
        jsTasks.push('copy');
    }
    //
    //  ROLLUP
    if (cfg.rollup) {
        var rollup = cfg.rollup.options;
        if (rollup) {
            var plugins = [];
            _.forOwn(rollup.plugins, function(options, name) {
                var plugin = require(rollupPlugins[name]);
                grunt.log.debug('Adding ' + name + ' rollup plugin');
                plugins.push(plugin(options));
            });
            rollup.plugins = plugins;
        }
        grunt.loadNpmTasks('grunt-rollup');
        jsTasks.push('rollup');
    }
    // CONCAT and UGLIFY always added at the end
    jsTasks = jsTasks.concat(['concat', 'uglify']);
    // Add initial tasks
    jsTasks = baseTasks.concat(jsTasks);

    var buildTasks = [].concat(jsTasks),
        testTasks = baseTasks.concat(['karma:dev']);
    //
    //  Build CSS if required
    //  --------------------------
    //
    //  When the ``sass`` key is available in config, add the necessary tasks
    if (cfg.sass) {
        grunt.log.debug('Adding sass configuration');

        _.forOwn(cfg.sass, function(value, key) {
            if (skipEntries.indexOf(key) < 0) cssTasks.push('sass:' + key);
        });

        if (cssTasks.length) {
            grunt.loadNpmTasks('grunt-sass');
            if (cfg.useLux)
                cssTasks = ['shell:buildPythonCSS'].concat(cssTasks);

            if (!cfg.sass.options) cfg.sass.options = {
                sourceMap: true,
                sourceMapContents: true,
                includePaths: [path.join(__dirname, 'node_modules')]
            };

            // Add watch for sass files
            add_watch(cfg, 'sass', ['css']);

            if (cfg.cssmin) {
                grunt.loadNpmTasks('grunt-contrib-cssmin');

                _.forOwn(cfg.cssmin, function(value, key) {
                    if (skipEntries.indexOf(key) < 0) cssTasks.push('cssmin:' + key);
                });

                if (!cfg.cssmin.options) cfg.cssmin.options = {
                    shorthandCompacting: false,
                    roundingPrecision: -1,
                    sourceMap: true,
                    sourceMapInlineSources: true
                };
            }

            var buildCss = baseTasks.concat(cssTasks);
            buildTasks = buildTasks.concat(cssTasks);
            grunt.registerTask('css', 'Compile python and sass styles', buildCss);
        }
    }
    //
    //
    // Preprocess Javascript jslibs
    _.forOwn(jslibs, function(value, name) {
        var options = value.options;
        if (options && options.banner) {
            options.banner = grunt.file.read(options.banner);
        }
        add_watch(jslibs, name, jsTasks);
        if (value.dest) concats[name] = value;
    });
    // Initialise Grunt with all tasks defined above
    cfg.uglify = uglify_jslibs();
    // Main config is in karma.conf.js, with overrides below
    // We may want to set up an auto-watch config, see https://github.com/karma-runner/grunt-karma#running-tests
    cfg.karma = {
        options: {
            configFile: 'karma.conf.js'
        },
        ci: {
            browsers: ['PhantomJS'],
            coverageReporter: {
                includeAllSources: true,
                reporters: [{
                    subdir: '.',
                    type: 'cobertura',
                    dir: 'coverage/'
                }, {
                    subdir: '.',
                    type: 'lcovonly',
                    dir: 'coverage/'
                }, {
                    type: 'text-summary'
                }]
            }
        },
        phantomjs: {
            browsers: ['PhantomJS']
        },
        dev: {
            browsers: ['PhantomJS', 'Firefox', 'Chrome']
        },
        debug_chrome: {
            singleRun: false,
            browsers: ['Chrome'],
            preprocessors: {},
            coverageReporter: {},
            reporters: ['dots']
        },
        debug_firefox: {
            singleRun: false,
            browsers: ['Firefox'],
            preprocessors: {},
            coverageReporter: {},
            reporters: ['dots']
        }
    };

    //
    grunt.registerTask('luxbuild', 'Load lux configuration', function() {
        var paths = cfg.requirejs.compile.options.paths,
            filename = srcPath + '/build/lux.json',
            obj = grunt.file.readJSON(filename);
        _.extend(paths, obj.paths);
    });

    //
    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-clean');
    //
    grunt.registerTask('test', testTasks);
    grunt.registerTask('test:debug-chrome', ['karma:debug_chrome']);
    grunt.registerTask('test:debug-firefox', ['karma:debug_firefox']);
    grunt.registerTask('js', 'Compile and lint javascript libraries', jsTasks);
    grunt.registerTask('build', 'Compile and lint javascript and css libraries', buildTasks);
    grunt.registerTask('coverage', 'Test coverage using Jasmine and Istanbul', ['clean:test', 'karma:ci']);
    grunt.registerTask('all', 'Compile lint and test all libraries', ['build', 'test']);
    grunt.registerTask('default', ['build', 'karma:ci']);
    //
    grunt.initConfig(cfg);

    //
    // Add a watch entry to ``cfg``
    function add_watch(obj, name, tasks) {
        var src = obj[name],
            watch = src ? src.watch : null;
        if (watch) {
            grunt.log.debug('Adding watch configuration for ' + name);
            delete src.watch;
            if (!cfg.watch) cfg.watch = {
                options: {
                    atBegin: true,
                    // Start a live reload server on the default port 35729
                    livereload: true
                }
            };
            if (!watch.files)
                watch = {files: watch};
            cfg.watch[name] = watch;
            if (!watch.tasks) {
                watch.tasks = tasks;
            }
        }
    }
    //
    function uglify_jslibs() {
        var result = {};
        _.forOwn(concats, function(value, name) {
            if (name !== 'options' && value.minify !== false) {
                result[name] = {
                    dest: value.dest.replace('.js', '.min.js'),
                    src: [value.dest],
                    options: {
                        sourceMap: false, // TODO change to true when Chrome sourcemaps bug is fixed
                        sourceMapIn: value.dest + '.map',
                        sourceMapIncludeSources: false // TODO change to true when Chrome sourcemaps bug is fixed
                    }
                };
            }
        });
        return result;
    }
};
