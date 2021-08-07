/*

Storing and manipulating data to the file system

*/

// Dependencies
var path = require('path');
var fs = require('fs').promises;
var helpers = require('./helpers');

// Container for the module
var lib = {};

// Base directiory for the folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = async (dir, file, data) => {
    try {

        // Open the file for writing
        var newFile = await fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx');

        // Conver the data to a string
        var stringData = JSON.stringify(data);

        // Write to the file and close it
        await fs.writeFile(newFile, stringData);
        await newFile.close();
        return false;
    } catch (e) {
        return e.message
    };
};

// Read from a file
lib.read = async (dir, file) => {
    try {

        // Read the file
        var contents = await fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8');

        // Parse to Object
        var parsedData = helpers.JSONtoObject(contents);

        return { Error: false, result: parsedData };

    } catch (e) {
        return { Error: e.message, result: contents };
    };
};

// Update a file
lib.update = async (dir, file, data) => {
    try {

        // Open the file for writing
        var updateFile = await fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+');

        // Convert the data to a string
        var stringData = JSON.stringify(data);

        // Truncate the file
        await fs.truncate(`${lib.baseDir}${dir}/${file}.json`);

        // Write to the file and close it
        await fs.writeFile(updateFile, stringData);
        await updateFile.close()
        return false;
    } catch (e) {
        console.log(e)
        return e.message
    };
};

// Delete a file
lib.delete = async (dir, file) => {
    try {

        // Delete the file
        await fs.unlink(`${lib.baseDir}${dir}/${file}.json`);
        return false;
    } catch (e) {
        return e.message
    }
};

// Export the module
module.exports = lib

