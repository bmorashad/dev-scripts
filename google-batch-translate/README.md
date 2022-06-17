# Google Batch Translate

## Description

This uses Google Cloud translation api and helps you to translate all your text by reading them from a json file.
However Google Cloud free account only allows 128 text at a time, hence the script translates the input in batches,
then combines the result and saves it as json. You can increase the batch size by passing the limit as an argument to `--max-limit` flag. 
At the moment only way to translate all your input at once instead of batches is by providing a
higher (or equal) value than the avaialable text to `--max-limit` flag.

## Prerequisites

- Google Cloud account (Free or Paid)
- Node.js

## Installation

- clone the project
```
git clone https://github.com/bmorashad/dev-scripts.git
```
- cd into project repository
```
cd dev-script/google-batch-translate
```
- Run below commands to make the script executable
```
chmod +x main.js
```
- Execute the script as `./gtranslate.js <args>`

**To run as command**

- Run `npm link`
- Now you can execute the script as `gtranslate <args>`

## Usage

### Input/Output File Format

The input file should be a key, value json file. At the moment an array of text is not supported. So it should look like below

**i.e**
```
{
	"hello_there": "Hello There!",
	"thank_you": "Thank You",
}

```
Similarly the translated output file would look like below.

```
{
	"hello_there":"你好",
	"thank_you": "谢谢"
}

```

**NOTE:** This was done for a **react app when adding locale support** and the format of input file and
output files is as it is, as a result of that.



### Adding .env file

- Create an env file
- Generate Google Cloud client credentials 
- Add your Google Cloud credentials to env file which would look like below.
```
CREDENTIALS={"type": "service_account", "project_id": "translate-1", "private_key_id": "private_key_id", "private_key": "private_key", "client_email": "your_email@translate-1.iam.gserviceaccount.com", "client_id": "1144445454", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/rashad%40translate-319310.iam.gserviceaccount.com"}
```
- Now you can either pass the .env file created above as an argument to the script with --env flag each time you run
**i.e**
```
gtranslate <args> --env <path_to_env_file>

```
- Or you can permanantly add that env file with below command, and forget about it
```
gtranslate --add-config <path_to_env_file>
```

### Running the script

You must pass some required arguments to run the script successfully and there are some optionals as well. 
Also note that the script doesn't take argument order into account

#### Requiered Args

```
-i - Path to input file
-t - Space/comma separated list of language code to be translated into (i.e: es, fr)
```

#### Optional Args

```
-l 						- Language of the input file (This is auto detected by google api if not passed)
--output-dir 	- Directory in which the translated files should be saved (default: __output)
--env 				- This is optional only if an env is already added permanantly with --add-config command
--max-limit 	- Amount of text that gets translated in each batch (default 128) 
```

Using above args you can run the script as below examples.

**i.e**
- `gtranslate -i <path-to-input> -t <targets-languages>`
- `gtranslate -l en -i <path-to-input> -t <targets-languages> --output-dir <path-to-output-dir>`
- `gtranslate -l en -i <path-to-input> -t <targets-languages> --env <path-to-env-file>`
