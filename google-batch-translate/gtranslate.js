#!/usr/bin/env node

const { Translate } = require("@google-cloud/translate").v2;
const file_util = require("./lib/utils/file-util");
const argv_util = require("./lib/utils/argv-util");
const path = require("path");

let GT_MAX_LIMIT = 128;

let output_path = "__output";
let dotenv_path = __dirname + path.sep + ".env";

let args = argv_util.parseArgs();
if (args.help) {
  printHelp();
  return;
}
if (args["add-config"] && args["add-config"].values[0]) {
  addEnvConfig(args["add-config"].values[0]);
  return;
}
if (args["max-limit"] && args["max-limit"].values[0]) {
  GT_MAX_LIMIT = args["max-limit"].values[0];
}
validateArgs(args);

let file_to_be_translated = args.i.values[0];
let language_of_file_to_be_translated = args.l ? args.l.values[0] : null;
let target_languages = args.t.values;
output_path = args["output-dir"]
  ? args["output-dir"].values[0] || output_path
  : output_path;
dotenv_path = args.env ? args.env.values[0] || dotenv_path : dotenv_path;

require("dotenv").config({ path: dotenv_path });

if (!process.env.CREDENTIALS) {
  throw new Error(
    "Credentials not found! Add google cloud credentials either as enviorment variables or you can use .env file"
  );
}

const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

const translator = new Translate({
  credentials: CREDENTIALS,
  projectId: CREDENTIALS.project_id,
});

const translateText = async (text_list, to, from = null) => {
  let translation_properties = {
    to,
  };
  if (from) {
    translation_properties.from = from;
  }
  let [response] = await translator.translate(
    text_list,
    translation_properties
  );
  return response;
};

const translateTextArray = async ({
  target,
  input_values,
  from,
  to,
  from_language,
}) => {
  // Extract out this common logic
  if (to == -1) {
    to = input_values.length;
  }
  input_values = input_values.slice(from, to);
  let t = await translateText(input_values, target, from_language);
  const translation = t;
  const translations_arr = [];
  for (let i = 0; i < translation.length; i++) {
    translations_arr[i] = translation[i];
  }
  return translations_arr;
};

const translateKeyValues = async ({
  target,
  input_keys,
  input_values,
  from,
  to,
  from_language,
}) => {
  // Extract out this common logic
  if (to == -1) {
    to = input_values.length;
  }
  input_values = input_values.slice(from, to);
  let t = await translateText(input_values, target, from_language);
  const translation = t;
  input_keys = input_keys.slice(from, to);
  const translations_obj = {};
  for (let i = 0; i < translation.length; i++) {
    translations_obj[input_keys[i]] = translation[i];
  }
  return translations_obj;
};

let translateInBatches = async (input, GT_MAX_LIMIT, target, from_language) => {
  let is_input_array = input.constructor.name === "Array";
  let input_values = is_input_array ? input : Object.values(input);
  let input_value_count = input_values.length;

  let remaining_last = input_value_count % GT_MAX_LIMIT;
  let times = (input_value_count - remaining_last) / GT_MAX_LIMIT;

  let from = 0;
  let to = GT_MAX_LIMIT;

  let all_translations_obj = {};
  let all_translations_arr = [];
  let input_keys = is_input_array ? [] : Object.keys(input);
  for (let i = 0; i < times + 1; i++) {
    // translation logic if input is json obj
    if (!is_input_array) {
      let transaltion = await translateKeyValues({
        target,
        input_keys,
        input_values,
        from,
        to,
        from_language,
      });
      all_translations_obj = { ...transaltion, ...all_translations_obj };
    }
    // translation logic if input is json arr
    else {
      let transaltion = await translateTextArray({
        target,
        input_values,
        from,
        to,
        from_language,
      });
      all_translations_arr = [...transaltion, ...all_translations_arr];
    }
    from += GT_MAX_LIMIT;
    if (i == times - 1) {
      to = to + remaining_last;
    } else {
      to += GT_MAX_LIMIT;
    }
  }
  if (is_input_array) {
    return { translation: all_translations_arr, target };
  }
  return { translation: all_translations_obj, target };
};

let translateAndSave = async (
  input_file,
  GT_MAX_LIMIT,
  target_languages,
  from_language
) => {
  const input = JSON.parse(file_util.readFile(input_file, "utf8"));
  let translations = [];
  for (let j = 0; j < target_languages.length; j++) {
    console.info(`Translating to ${target_languages[j]}...`);
    let translation = await translateInBatches(
      input,
      GT_MAX_LIMIT,
      target_languages[j],
      from_language
    );
    translations.push(translation);
    console.info(`Successfully translated to ${target_languages[j]}`);
    console.log();
  }
  return translations;
};

let beginTranslation = (
  file_to_be_translated,
  GT_MAX_LIMIT,
  target_languages,
  language_of_file_to_be_translated
) => {
  translateAndSave(
    file_to_be_translated,
    GT_MAX_LIMIT,
    target_languages,
    language_of_file_to_be_translated
  ).then((translation_objs) => {
    translation_objs.forEach((translation_obj) => {
      let { translation, target } = translation_obj;
      let translation_json = JSON.stringify(translation, null, 2);
      let json_extension = ".json";
      file_util.createDirIfNotExists(output_path);
      let translation_file_name =
        output_path + path.sep + target + json_extension;
      file_util.saveFile(
        translation_file_name,
        translation_json,
        "utf8",
        function (err) {
          if (err) {
            console.error(
              "Error occurred while saving " + translation_file_name,
              err
            );
          }
        }
      );
    });
  });
};

function validateArgs(args) {
  if (!args.i) {
    throw new Error("No input files were given. Add input file with -i flag");
  }
  if (!args.i.values.length) {
    throw new Error("No input files were given. Flag -i is empty");
  }

  if (!args.t) {
    throw new Error(
      "No target languages were given. Add comma/space separated list of target languages with -t flag"
    );
  }

  if (!args.t.values.length) {
    throw new Error("No target languages were given. Flag -t is empty");
  }
}

function printHelp() {
  console.info("\tWelcome to gtranslage help!");
  console.log();
  console.log("Help is still under development :/");
  console.log();
  console.log("Usage");
  console.log(
    "\tnode gtranslage.js -i <input-file-to-translate> -t <target-languages> [-l <language-of-input-file>] [--output-dir <output-directory-of-translated-files] [--env <google-crendetials-.env-file]"
  );
  console.log("\ti.e: node gtranslage.js -i en.json -t fr --env .env");
}

function addEnvConfig(path) {
  file_util.copyFile(path, __dirname + "/.env");
}

beginTranslation(
  file_to_be_translated,
  GT_MAX_LIMIT,
  target_languages,
  language_of_file_to_be_translated
);
