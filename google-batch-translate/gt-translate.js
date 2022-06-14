const { Translate } = require("@google-cloud/translate").v2;
require("dotenv").config();
const fileUtil = require("./file-utils");
const path = require("path");

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

const translate = async ({ target, input, from, to, from_language }) => {
  let input_values = Object.values(input);
  let input_keys = Object.keys(input);
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

let translateInBatches = async (input, gt_max_limit, target, from_language) => {
  let input_values = Object.values(input);
  let input_value_count = input_values.length;

  let remaining_last = input_value_count % gt_max_limit;
  let times = (input_value_count - remaining_last) / gt_max_limit;

  let from = 0;
  let to = gt_max_limit;
  let all_translations = {};

  for (let i = 0; i < times + 1; i++) {
    let transaltion = await translate({
      target,
      input,
      from,
      to,
      from_language,
    });
    all_translations = { ...transaltion, ...all_translations };
    from += gt_max_limit;
    if (i == times - 1) {
      to = to + remaining_last;
    } else {
      to += gt_max_limit;
    }
  }
  return { translation: all_translations, target };
};

let translateAndSave = async (
  input_file,
  gt_max_limit,
  target_languages,
  from_language
) => {
  const input = JSON.parse(fileUtil.readFile(input_file, "utf8"));
  let translations = [];
  for (let j = 0; j < target_languages.length; j++) {
    let translation = await translateInBatches(
      input,
      gt_max_limit,
      target_languages[j],
      from_language
    );
    translations.push(translation);
  }
  return translations;
};

let gt_max_limit = 128;
let file_to_be_translated = "/home/bmora/Work/Entgra/Translation/en_US.json";
let language_of_file_to_be_translated = null;
let target_languages = ["es"];
let output_path = "__output";

translateAndSave(
  file_to_be_translated,
  gt_max_limit,
  target_languages,
  language_of_file_to_be_translated
).then((translation_objs) => {
  translation_objs.forEach((translation_obj) => {
    let { translation, target } = translation_obj;
    let translation_json = JSON.stringify(translation, null, 2);
    let json_extension = ".json";
    fileUtil.createDirIfNotExists(output_path);
    let translation_file_name =
      output_path + path.sep + target + json_extension;
    fileUtil.saveFile(
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
