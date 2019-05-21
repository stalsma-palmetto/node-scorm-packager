var glob = require("glob"),
  path = require('path');


module.exports = function (obj) {
  var
    identifier = obj.title.replace(/ /g, '.'),
    itemIdentifier = 'item_' + obj.identifier.replace(/ /g, ''),
    identifierref = 'resource_' + obj.identifier.replace(/ /g, ''),
    organization = obj.organization.replace(/ /g, '_');

  var scos = obj.scos.map(function (value) {
    var rObj = {};
    rObj['@identifier'] = value.id;
    rObj['@identifierref'] = value.id.concat('_resource');
    rObj['@isvisible'] = true;
    rObj['title'] = value.moduleTitle;
    if (value.hasOwnProperty('prereqId')) {
      rObj['adlcp:prerequisites'] = {};
      rObj['adlcp:prerequisites']['@type'] = 'aicc_script';
      rObj['adlcp:prerequisites']['#text'] = value.prereqId;
    }
    if (value.hasOwnProperty('masteryScore')) {
      rObj['adlcp:masteryscore'] = value.masteryScore;
    }

    return rObj;
  });


  var resourceBlocks = obj.scos.map(function (value) {
    var rObj = {};
    rObj['@identifier'] = value.id.concat('_resource');
    rObj['@type'] = 'webcontent';
    rObj['@href'] = value.launchPage;
    rObj['@adlcp:scormtype'] = 'sco';
    rObj.file = [];
    rObj['dependency'] = {};
    rObj['dependency']['@identifierref'] = 'commonResources';

    const options = {
      cwd: obj.destination
    };

    //we might be getting an array of glob strings, or simply a single string
    let pattern = Array.isArray(value.files) ? '{' + value.files.join(',') + '}' : value.files;

    //find files matching glob for SCO
    var files = glob.sync(pattern, options);
    // add each file to SCO's resource section
    files.map(function (curScoFile) {
      rObj.file.push({'@href': curScoFile});

      //now remove that file from the master list of files passed in
      var index = obj.files.indexOf(curScoFile);
      if (index > -1) {
        obj.files.splice(index, 1);
      } else {
        //we don't want to error out here; in theory, file could be used in mult SCOs, so it may not be in
        // the list, if it was already removed in a prior iteration
        console.log('file not found for removal: '.concat(curScoFile));
      }
    });

    return rObj;
  });

  //the only thing left in files are those assets not explicitly referenced by a SCO; these go into the common section
  var commonResources = {};
  commonResources['@identifier'] = 'commonResources';
  commonResources['@type'] = 'webcontent';
  commonResources['@adlcp:scormtype'] = 'asset';
  commonResources.file = obj.files.map(function (file) {
    return {'@href': file};
  });
  resourceBlocks.push(commonResources);


  return {
    '@identifier': identifier,
    '@version': 1,
    '@xmlns:adlcp': 'http://www.adlnet.org/xsd/adlcp_rootv1p2',
    '@xmlns': 'http://www.imsproject.org/xsd/imscp_rootv1p1p2',
    '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    '@xsi:schemaLocation': 'http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd ' +
      'http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd ' +
      'http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd',
    metadata: {
      schema: 'ADL SCORM',
      schemaversion: obj.version
    },
    organizations: {
      '@default': organization,
      organization: {
        '@identifier': organization,
        title: obj.title,
        item: scos,
      }
    },
    resources: {
      resource: resourceBlocks
    }
  }
};
