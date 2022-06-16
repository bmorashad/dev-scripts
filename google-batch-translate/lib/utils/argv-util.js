module.exports.parseArgs = () => {
  let arg_list = process.argv.slice(2);
  let args = {};
  let current_flag;
  arg_list.forEach((arg) => {
    let flag_regex = /^-{1,2}[aA-zZ|-]/;
    if (flag_regex.test(arg)) {
      let flag_name_regex = /^-{1,2}([aA-zZ|-]+)/;
      let flag_name = arg.match(flag_name_regex)[1];
      current_flag = flag_name;
      args[current_flag] = { values: [] };
    } else if (current_flag && arg !== ",") {
      let value = arg;
      if (arg[arg.length - 1] === ",") {
        value = arg.substr(0, arg.length - 1);
      }
      args[current_flag].values.push(value);
    }
  });
  return args;
};
