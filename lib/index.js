var
    fs = require('fs'),
    fse = require('fs-extra'),
    path = require('path'),
    archiver = require('archiver'),
    files = require('./files.js'),
    schema = require('./schema.js'),
    schema = require('./schema.js'),

    manifest = require('./manifest.js');

var _logSuccess = function (msg) {
    var date = new Date;
    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    console.log('[' + time + ']', 'Created', "'" + '\x1b[32m' + msg + '\x1b[0m' + "'");
};

var _logError = function (err) {
    var date = new Date;
    var time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    console.log('[' + time + ']' + '\x1b[31m', err, '\x1b[0m');
};

var buildPackage = function (obj, callback) {
    var
        schemaVersion,
        schemaDefinition;

    switch (obj.version) {
        case 'standalone':
            schemaVersion = 'scorm12';
            schemaDefinition = 'scorm12edition';
            break;
        case '1.2':
            schemaVersion = 'scorm12';
            schemaDefinition = 'scorm12edition';
            break;
        case '2004 3rd Edition':
            schemaVersion = 'scorm2004';
            schemaDefinition = 'scorm20043rdedition';
            break;
        case '2004 4th Edition':
            schemaVersion = 'scorm2004';
            schemaDefinition = 'scorm20044thedition';
            break;
    }

    if (!schemaVersion) {
        callback('Supported versions:\n1.2\n2004 3rd Edition\n2004 4th Edition');
        return;
    }

    var
        rootDir = path.dirname(fs.realpathSync(__filename)),
        //where are we copying to?
        destination = path.join(obj.destination, (obj.version != 'standalone' ? 'Scorm' : '') + obj.version),
        fileList = files(obj.source).map(function (file) {
            return {
                name: file,
                source: path.join(obj.source, decodeURI(file)),
                destination: path.join(destination, decodeURI(file))
            }
        }),
        definitionFileList = files(path.join(rootDir, 'schemas', 'definitionFiles', schemaDefinition))
            .map(function (file) {
                return {
                    name: file,
                    source: path.join(rootDir, 'schemas', 'definitionFiles', schemaDefinition, file),
                    destination: path.join(destination, file)
                }
            });

    fse.emptyDir(destination, function (err) {
        if (err) return callback(err);

        fileList.forEach(function (file) {
            if (file.source !== file.destination) {
                try {
                    fse.copySync(file.source, file.destination);
                    _logSuccess(file.destination);
                } catch (err) {
                    _logError(err);
                }
            }
        });

        if( obj.version != 'standalone') {
            var manifestFile = fse.outputFile(path.join(destination, 'imsmanifest.xml'), manifest(schemaVersion, obj))
                .then(results => {
                    // { bytesWritten: 20, buffer: <Buffer 0f 34 5d ...> }
                    console.log(results)
                    _logSuccess(path.join(destination, 'imsmanifest.xml'));

                    definitionFileList.forEach(function (file) {
                        try {
                            fse.copySync(file.source, file.destination);
                            _logSuccess(file.destination);
                        } catch (err) {
                            _logError(err);
                        }
                    });
                    if (obj.zipFiles && obj.destinationZip !== null) {
                        compressPackage(destination, obj.destinationZip, function () {
                            callback('Zipped and Done');
                        })
                    } else {
                        callback('Done');
                    }

                });
        } else {
            if (obj.zipFiles && obj.destinationZip !== null) {
                compressPackage(destination, obj.destinationZip, function () {
                    callback('Zipped and Done');
                })
            } else {
                callback('Done');
            }

        }



    });
};



var compressPackage = function (src, dest, callback) {
    // create a file to stream archive data to.
    var output = fs.createWriteStream(dest);
    var archive = archiver('zip', {
        zlib: {level: 9} // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');


        callback();
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
        console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
        if (err.code === 'ENOENT') {
            // log warning
        } else {
            // throw error
            throw err;
        }
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
        throw err;
    });

    // pipe archive data to the file
    archive.pipe(output);

    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(src, false);


    archive.finalize();
};

module.exports = buildPackage;
