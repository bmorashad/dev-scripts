var fs = require("fs");

module.exports.saveFile = (filePath, content, options = null) => {
  fs.writeFile(filePath, content, options, function (err) {
    if (err) {
      console.error("Error occurred while saving " + target, err);
    }
  });
};

module.exports.copyFile = (filePath, dest) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("No such env file!");
  }
  fs.copyFileSync(filePath, dest);
};

module.exports.readFile = (file, options = null) => {
  return fs.readFileSync(file, options);
};

module.exports.createDirIfNotExists = (path, recursive = true) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, recursive);
  }
};
