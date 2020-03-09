var scopackage = require('../lib'),
  yaml = require("js-yaml"),
  fs = require("fs"),
  path = require("path"),
  merge = require("deepmerge"),
  handlebars = require("handlebars");


module.exports = {
  package: function() {
    const PATH_TO_ROOT = path.relative(__dirname, require("app-root-path") + "/../code" );
    const BASE_YAML = "/site/config.yaml";
    const IS_YAML = "/site/config/course/config-injection-safety.yaml";

    const COURSE_FOLDER = process.argv[3];
    var doc = null;

    try {
      var baseConfig = yaml.safeLoad(fs.readFileSync(PATH_TO_ROOT + BASE_YAML, "utf8"));
      var courseConfig = yaml.safeLoad(fs.readFileSync(PATH_TO_ROOT + IS_YAML, "utf8"));
      doc = merge(baseConfig, courseConfig);
      doc.courseFolder = COURSE_FOLDER;
    } catch (e) {
      console.log(e);
    }

    // require the package.json file
    var pjson = require(PATH_TO_ROOT + "/package.json");
    // Our template
    const scoStructure = pjson.config.scoStructure;

    // Use strict mode so that Handlebars will throw exceptions if we
    // attempt to use fields in our template that are not in our data set.
    const template = handlebars.compile(JSON.stringify(scoStructure), {strict: true});
    const result = JSON.parse(template(doc));
    // console.log(result);

    // process.exit();

    scopackage({
      version: "1.2",
      organization: "PalmettoGBA",
      title: doc.params.title.course,
      identifier: "00",
      source: PATH_TO_ROOT + "/dist/" + COURSE_FOLDER + "/scorm",
      destination: PATH_TO_ROOT + "/dist/" + COURSE_FOLDER + "/scorm-temp",
      zipFiles: true,
      destinationZip: PATH_TO_ROOT + "/dist/" + COURSE_FOLDER + "_SCORM-1.2.zip",
      scos: result
    }, function(msg) {
      console.log(msg);
    });


  }
};

require("make-runnable");
