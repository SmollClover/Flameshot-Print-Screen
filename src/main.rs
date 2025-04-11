#[macro_use] extern crate log;

use std::{fs, path::{Path, PathBuf}, process::{exit, Command}};
use log::LevelFilter;
use rand::{distr::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use simplelog::{format_description, ColorChoice, ConfigBuilder, TermLogger, TerminalMode};

#[derive(Serialize, Deserialize, Debug, Default)]
struct Config {
    #[serde(rename = "Name")]
    name: String,

    #[serde(rename = "DestinationType")]
    destination_type: String,

    #[serde(rename = "RequestType")]
    request_type: String,

    #[serde(rename = "RequestURL")]
	request_url: String,

    #[serde(rename = "FileFormName")]
	file_form_name: String,

    #[serde(rename = "Arguments")]
	arguments: ConfigArguments,

    #[serde(rename = "ResponseType")]
	response_type: String,

    #[serde(rename = "URL")]
	url: String,
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct ConfigArguments {
    auth: String,
    secure: String,
    url: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct PSReponse {
    status: String,
    errormsg: String,
    url: String
}

fn ensure_config(config_path: &PathBuf) {
    debug!("Checking to ensure that config exists");

    match fs::exists(config_path) {
        Ok(true) => {
            debug!("Found config without any issues")
        },
        _ => {
            info!("No config found, writing default empty config");
            let empty_config = Config::default();
            fs::write(config_path, serde_json::to_string_pretty(&empty_config).unwrap()).unwrap();
        }
    }
}

fn load_config(config_path: &PathBuf) -> Config {
    debug!("Loading config and trying to parse it");

    let config_file = match fs::read_to_string(config_path) {
        Ok(config_file) => config_file,
        Err(e) => {
            error!("Failed to read config file: {}", e);
            exit(1);
        }
    };

    info!("Successfully loaded config");
    serde_json::from_str(&config_file).unwrap()
}

fn screenshot() -> Vec<u8> {
    info!("Starting flameshot and waiting for user");

    let flameshot = Command::new("flameshot").args(["gui", "--raw"]).output().unwrap();
    if !flameshot.status.success() {
        error!("Failed to take screenshot");
        print!("{}", String::from_utf8(flameshot.stderr).unwrap());
        exit(1);
    }

    if flameshot.stdout.is_empty() {
        warn!("Flameshot returned nothing, presuming user canceled action");
        exit(0);
    }

    if !flameshot.stdout.starts_with(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) {
        error!("Expected to receive a PNG from flameshot");
        exit(1);
    }

    info!("Received PNG by flameshot");
    flameshot.stdout.to_owned()
}

fn upload(config: &Config, png: Vec<u8>) -> String {
    debug!("Uploading to: {}", config.request_url);

    let client = reqwest::blocking::Client::new();
    let rand_name: String = rand::rng().sample_iter(Alphanumeric).take(8).map(char::from).collect();
    let file_name = "Print-Screen-Uploader_".to_string() + &rand_name + ".png";

    let image_part = reqwest::blocking::multipart::Part::bytes(png)
        .file_name(file_name)
        .mime_str("image/png")
        .unwrap();

    let form = reqwest::blocking::multipart::Form::new()
        .text("auth", config.arguments.auth.clone())
        .text("secure", config.arguments.secure.clone())
        .text("url", config.arguments.url.clone())
        .part(config.file_form_name.clone(), image_part);

    let res = client.post(&config.request_url).multipart(form).send().unwrap();
    let response: PSReponse = res.json().unwrap();

    if response.status != "OK" {
        error!("Unexepcted return status: {}", response.status);
        exit(1)
    }
    
    response.url
}

fn copy_to_clipboard(url: String) {
    info!("Copying to clipboard: {}", url);

    // I'd like to use the arboard crate here instead but due to it not being able to keep clipboard contents after the program exits,
    // I will use this hacky workaround that requires wl-copy to be used.
    Command::new("wl-copy").arg(url).spawn().unwrap();
}

fn main() {
    let log_config = ConfigBuilder::new()
        .set_time_format_custom(format_description!("[day].[month].[year] [hour]:[minute]:[second]"))
        .build();
    let log_level = if std::env::var("RUST_LOG").unwrap_or_else(|_| "".to_string()).contains("debug") { LevelFilter::Debug } else { LevelFilter::Info };
    TermLogger::init(log_level, log_config, TerminalMode::Mixed, ColorChoice::Auto).unwrap();

    let config_path = Path::new("").join(home::home_dir().unwrap()).join(".config/print-screen-uploader/config.json");
    info!("Config location: {}", &config_path.as_os_str().to_str().unwrap());

    ensure_config(&config_path);
    let config = load_config(&config_path);
    
    let png = screenshot();
    let url = upload(&config, png);
    copy_to_clipboard(url);
}
