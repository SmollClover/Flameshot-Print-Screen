# Print Screen Uploader

### A Project designed to be used to upload files/pictures directly to Print Screen via your config

> This Program was designed with personal use in mind, so there's no guarantee for it to work on your system

---

## Setup Instructions

> Make sure to have NodeJS installed. I've built this Program on NodeJS v18.1.0

### Using NVM

```bash
$ nvm install
$ nvm use
```

### Yarn

```bash
$ yarn install
$ yarn start
```

### NPM

```bash
$ npm install
$ npm start
```

---

## ToDo List

-   [ ] Configuration file
    -   [ ] Create empty JSON config if none exists
    -   [ ] Validate config against known Template
    -   [ ] Read config in on start
-   [ ] Input Args
    -   [ ] Check if path to a file
        -   [ ] Make sure it's not a folder
        -   [ ] Read in file
        -   [ ] Send in correct format to Server
    -   [ ] Check if data of picture
        -   [ ] Send in correct format to Server
-   [ ] Server Response
    -   [ ] Check if everything went smooth
    -   [ ] Return Error if not
    -   [ ] Automatically put returned Link into clipboard
