const { Translate } = require("@google-cloud/translate").v2;
require("dotenv").config();
const jsonUtil = require("./jsonUtil");

const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

const translate = new Translate({
  credentials: CREDENTIALS,
  projectId: CREDENTIALS.projectId,
});

const translateText = async (text, targetLanguage) => {
  try {
    let [response] = await translate.translate(text, targetLanguage);
    return response;
  } catch (error) {
    console.log("err", error);
  }
};
const translateAndSave = async ({
  target,
  outputFile,
  inputFile,
  from,
  to,
}) => {
  var fs = require("fs");
  const keyValueObj = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  let values = Object.values(keyValueObj);
  if (to == -1) {
    to = values.length;
  }
  values = values.slice(from, to);
  let t = await translateText(values, target);
  // console.log(t)
  const translation = t;
  var obj = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  let keys = Object.keys(obj);
  keys = keys.slice(from, to);
  const translationsObj = {};
  for (let i = 0; i < to; i++) {
    translationsObj[keys[i]] = translation[i];
  }
  const translationsJSON = JSON.stringify(translationsObj, null, 2);
  fs.writeFileSync(outputFile, translationsJSON, "utf8");
  console.log(`${outputFile} file saved successfully`);
  // console.log(translationsObj)
};
let translateHelper = async (en_US, gt_max_limit, target) => {
  let translationFiles = [];
  var fs = require("fs");
  const en_US_obj = JSON.parse(fs.readFileSync(en_US, "utf8"));
  let en_US_values = Object.values(en_US_obj);
  let en_US_value_count = en_US_values.length;

  let remaining_last = en_US_value_count % gt_max_limit;
  console.log(en_US_value_count);
  console.log(gt_max_limit);
  let times = (en_US_value_count - remaining_last) / gt_max_limit;

  let from = 0;
  let to = gt_max_limit;
  for (let i = 0; i < times + 1; i++) {
    // console.log(`${target}, ${target}${i}.json, ${en_US}\t${from}-${to}`)
    translationFiles.push(`${target}${i}.json`);
    try {
      await translateAndSave({
        target: target,
        outputFile: `${target}${i}.json`,
        inputFile: en_US,
        from: from,
        to: to,
      });
    } catch (error) {
      console.error(error);
    }
    from += gt_max_limit;
    if (i == times - 1) {
      to = to + remaining_last;
    } else {
      to += gt_max_limit;
    }
  }
  return translationFiles;
  // jsonUtil.concatJsonFromList(translationFiles, `${target}-kaveesha.json`)
};

let translateAll = async (
  en_US,
  gt_max_limit,
  targets,
  targetCorrespondingFiles
) => {
  for (let j = 0; j < targets.length; j++) {
    let result = await translateHelper(en_US, gt_max_limit, targets[j]);
    targetCorrespondingFiles.push(result);
  }
};

const updateTargetCorrespondingFiles = () => {
  for (let j = 0; j < targets.length; j++) {
    let translationFiles = [];
    var fs = require("fs");
    const en_US_obj = JSON.parse(fs.readFileSync(en_US, "utf8"));
    let en_US_values = Object.values(en_US_obj);
    let en_US_value_count = en_US_values.length;

    let remaining_last = en_US_value_count % gt_max_limit;
    let times = (en_US_value_count - remaining_last) / gt_max_limit;

    let from = 0;
    let to = gt_max_limit;
    for (let i = 0; i < times + 1; i++) {
      // console.log(`${target}, ${target}${i}.json, ${en_US}\t${from}-${to}`)
      translationFiles.push(`${targets[j]}${i}.json`);
      from += gt_max_limit;
      if (i == times - 1) {
        to = to + remaining_last;
      } else {
        to += gt_max_limit;
      }
    }
    targetCorrespondingFiles.push(translationFiles);
  }
  console.log(targetCorrespondingFiles);
};

let gt_max_limit = 128;
let en_US = "en_US.json";
let targets = ["es", "fr", "ja"];
// let targets = ['es',];
let targetCorrespondingFiles = [];

translateAll(en_US, gt_max_limit, targets, targetCorrespondingFiles).then(
  (__) => {
    targetCorrespondingFiles.forEach((targetFiles, indx) => {
      jsonUtil.concatJsonFromList(targetFiles, `${targets[indx]}.json`);
    });
  }
);

/* translateAndSave({target: 'fr', outputFile: 'es2.json', inputFile: 'fr_FR.json', from: 0, to: 128})
translateAndSave({target: 'es', outputFile: 'es3.json', inputFile: 'fr_FR.json', from: 128, to: -1})

translateAndSave({target: 'es', outputFile: 'es2.json', inputFile: 'fr_FR.json', from: 0, to: 128})
translateAndSave({target: 'es', outputFile: 'es3.json', inputFile: 'fr_FR.json', from: 128, to: -1})

translateAndSave({target: 'ja', outputFile: 'ja2.json', inputFile: 'fr_FR.json', from: 0, to: 128})
translateAndSave({target: 'ja', outputFile: 'ja3.json', inputFile: 'fr_FR.json', from: 128, to: -1})

jsonUtil.concatJson('es2.json', 'es3.json', 'es_sandaru.json');
jsonUtil.concatJson('ja2.json', 'ja3.json', 'ja_sandaru.json'); */
