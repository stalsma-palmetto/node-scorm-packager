var scopackage = require('../lib');
yaml = require('js-yaml');
fs = require('fs');
var merge = require('deepmerge')

// require the package.json file
var pjson = require('../../../code/package.json');

const PATH_TO_ROOT = '../../../';
const BASE_YAML = 'code/site/config.yaml'
const IS_YAML = 'code/site/config/course/config-injection-safety.yaml'

var doc = null;

try {
  var baseConfig = yaml.safeLoad(fs.readFileSync(PATH_TO_ROOT + BASE_YAML, 'utf8'));
  var courseConfig = yaml.safeLoad(fs.readFileSync(PATH_TO_ROOT + IS_YAML, 'utf8'));
  doc = merge(baseConfig, courseConfig);
} catch (e) {
  console.log(e);
}

// process.exit();

scopackage({
  version: '1.2',
  organization: 'PalmettoGBA',
  title: doc.params.title.course,
  identifier: '00',
  masteryScore: 80,
  startingPage: 'index.html',
  source: 'tempIS',
  destination: 'packaged',
  scos: [
    {
      "id": "sco_intro",
      "moduleTitle": doc.params.title.intro,
      "launchPage": "Injection-Safety/intro/splash.html",
      "includeCommonResources": true,
      "files": [
        "Injection-Safety/intro/**/*.*",
        "Injection-Safety/images/intro/**/*.*",
        "Injection-Safety/images/splash/**/*.*"
      ]
    },
    {
      "id": "sco_lesson1",
      "moduleTitle": doc.params.title.lesson01,
      "launchPage": "Injection-Safety/lesson01/index.html",
      "prereqId": "sco_intro",
      "includeCommonResources": true,
      "files": [
        "Injection-Safety/lesson01/**/*.*",
        "Injection-Safety/images/lesson01/**/*.*"
      ]
    },
    {
      "id": "sco_lesson2",
      "moduleTitle": doc.params.title.lesson02,
      "launchPage": "Injection-Safety/lesson02/index.html",
      "prereqId": "sco_lesson1",
      "includeCommonResources": true,
      "files": [
        "Injection-Safety/lesson02/**/*.*",
        "Injection-Safety/images/lesson02/**/*.*"
      ]
    },
    {
      "id": "sco_lesson3",
      "moduleTitle": doc.params.title.lesson03,
      "launchPage": "Injection-Safety/lesson03/index.html",
      "prereqId": "sco_lesson2",
      "includeCommonResources": true,
      "files": [
        "Injection-Safety/lesson03/**/*.*",
        "Injection-Safety/images/lesson03/**/*.*"
      ]
    },
    {
      "id": "sco_lesson4",
      "moduleTitle": doc.params.title.lesson04,
      "launchPage": "Injection-Safety/lesson04/index.html",
      "prereqId": "sco_lesson3",
      "includeCommonResources": true,
      "files": [
        "Injection-Safety/lesson04/**/*.*",
        "Injection-Safety/images/lesson04/**/*.*"
      ]
    },
    {
      "id": "sco_postAssessment",
      "moduleTitle": doc.params.title.postassessment,
      "launchPage": "Injection-Safety/postAssessment/index.html",
      "prereqId": "sco_lesson4",
      "masteryScore": "70",
      "includeCommonResources": true,
      "files": "Injection-Safety/postAssessment/**/*.*"
    }
  ]
}, function (msg) {
  console.log(msg);
});


