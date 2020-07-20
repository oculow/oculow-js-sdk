const assert = require('assert')
const POST_METHOD = 'POST';
const GET_METHOD = 'GET';
const MULTIPART_FORMDATA = 'multipart/form-data';
const tmp = require('tmp');
const path = require('path');
let { promisify } = require('util');
let sizeOf = promisify(require('image-size'));
let request = require('request');
let fs = require('fs');
const { v4: uuidv4 } = require('uuid')
let compareImages = require("resemblejs/compareImages");
const { INTERNAL_COMPUTE_OFFSET_SCRIPT } = require('selenium-webdriver/lib/input');

function getEnv(name) {
    return eval("process.env."+name+" || null");
}
module.exports = {
    Oculow: class Oculow {
        constructor() {
            console.log("Environment variables:" + process.env.KEY)
            //Detect os environment variables fo oculow and asignconst example: this.apiKey = process.env.KEY || 3000; this.apiSecretKey = process.env.SECRET
            this.apiKey = getEnv("KEY")
            this.apiSecretKey = getEnv("SECRET")
            this.appId = getEnv("APP")
            //Load up account data if creds are inserted.
            this.getAccount()
            this.accId = null
            this.MANUAL = 0;
            this.ASSISTED = 1;
            this.FORCE_NEW = 2;
            this.FORCE_ALL = 3;
            this.PIXEL_DIFF = 0;
            this.IGNORE_AA = 1;
            this.DETECT_ERRORS = 3;
            this._dir = tmp.dirSync().name;
            console.debug('Dir: ', this._dir);
            
            this.baseUrl = "https://us-central1-lince-232621.cloudfunctions.net/"

            this.reportBaseUrl = "https://www.oculow.com/dashboard/executions.html"
            this.executionStatusFunction = "update_execution-prod"
            this.uploadImageFunction = "upload_image-prod"
            this.accFunction = "get_account-prod"
            this.errorDetect = "detect_errors-prod"

            this.execution = {}
            this.execution.id = uuidv4()
            this.execution['status'] = "passed"

        };

        setComparisonLogic(COMPARISON_LOGIC) {
            console.info("Setting baseline comparison logic")
            this.execution['comparisonLogic'] = COMPARISON_LOGIC;
        }

        setBaselineManagement(MANAGEMENT_LEVEL) {
            console.info("Setting baseline management level")
            this.execution['baselineManagement'] = MANAGEMENT_LEVEL;
        }

        setExecutionId(EXECUTION_ID){
            console.info("Setting execution id")
            this.execution['id'] = EXECUTION_ID;
        }

        setExecutionStatus(STATUS){
            console.info("Setting execution status")
            this.execution['status'] = STATUS;
        }
        
        setAppId(APP_ID) {
            console.info("Setting app id")
            this.appId = APP_ID;
        }

        setAccId(ACC_ID){
            console.info("Setting acc id")
            this.accId = ACC_ID;
        }

        setKeys(API_KEY, SECRET_KEY) {
            console.info("Setting keys")
            this.apiKey = API_KEY;
            this.apiSecretKey = SECRET_KEY;
        }

        setViewportSize(){
            console.info("Setting viewport size")
            this.execution['viewportWidth'] = this.getBrowserWindowSize('width');
            this.execution['viewportHeight'] = this.getBrowserWindowSize('height');
        }

        getBrowserWindowSize(param){
            let size = browser.getWindowSize();
            switch(param){
                case "width":
                return size.width;
                
                case "height":
                return size.height;

                default:
                return size;
            }
            
        }
        
        detectError(browser, imagePath) {
            let url = this.baseUrl + this.errorDetect;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                file: fs.createReadStream(imagePath),
                acc_id: this.accId,
                execution_id: this.execution['id']+"_"+this.accId,
                api_key: this.apiKey + "__" + this.apiSecretKey,
                app_id: this.appId
            }

            let options = {url: url, method: POST_METHOD, headers: headers, formData: data};

            browser.call(() => {
                console.log("Running error detection" + imagePath)
                return new Promise((resolve, reject) => {
                    request(options, (err, res) => {
                        if (err) {
                            return reject(err);
                        };
                        console.log("Finished with error detection", res.body);
                        this.errors=JSON.parse(res.body)
                        resolve()
                    })
                })
            })
        }

        uploadImage(path) {
            let url = this.baseUrl + this.uploadImageFunction;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                file: fs.createReadStream(path),
                acc_id: this.accId,
                execution_id: this.execution['id']+"_"+this.accId,
                api_key: this.apiKey + "__" + this.apiSecretKey,
                app_id: this.appId
            }
            console.log("Uploading image: ", url)

            let options = {url: url, method: POST_METHOD, headers: headers, formData: data};
            return new Promise((resolve, reject) => {
                request(options,(err,res) => {
                    if (err) {
                        console.log("Error uploading image")
                        console.log(err)
                        return reject(err)
                    }
                    console.log("Succesfully uploaded image")
                    resolve(res)
                })
            })
        }

        async setImageSize(browser, final_image_path){
            browser.call(async () => { 
                const dimensions = await sizeOf(final_image_path);
                this.image_height = dimensions.height
                this.image_width = dimensions.width
                console.log("set image size")
            })
        }

        handleBaselineCreation(browser, validation, res_key, dict_safe_title, title){
            console.info("No baseline detected, creating new execution log.")
            console.info("Error detection asgiend value.", this.errors)
            if (this.execution['status'] == "passed" && 'execution_status' in this.errors){
                console.log("Updating execution status to ", this.errors["execution_status"])
                this.execution['status'] = this.errors["execution_status"]
            }
            var new_valid = {
                "res_key":res_key,
                "dict_safe_title":dict_safe_title,
                "save_name":title,
                "height":this.execution['viewportHeight'],
                "width": this.execution['viewportWidth'],
                "image_height": this.image_height,
                "image_width": this.image_width,
                "save_path":this.final_image_path,
                "new_execution":true,
            }
            if("execution_status" in this.errors){
                new_valid["status"]= this.errors["execution_status"]
            }
            else{
                new_valid["status"]= "passed"

            }
            if("prediction" in this.errors){
                new_valid["prediction"] = this.errors["prediction"]                 
            } 
            validation.push(new_valid)
                this.execution["validation"] = validation
        }

        captureScreen(browser, title) {
            //Reset error detection
            this.errros = {}   
            if (path.extname(title) == '') {
                title = title + '.png'
            }
            this.final_image_path = path.join(this._dir.toString(), title);
            console.info("Captured image in path: " + this.final_image_path);
            browser.saveScreenshot(this.final_image_path);
            this.setViewportSize();
            
            
            this.getAccount()
            let res_key = this.execution['viewportWidth'] + '_' + this.execution['viewportHeight']
            let dict_safe_title = title.replace(".","_")
            console.info("Looking for baseline in account data: " + dict_safe_title +"   "+res_key)
            this.baseline = this.getBaseline(dict_safe_title, res_key)
            let validation = this.execution['validation'] || []
            console.debug("Valiations retrievied", JSON.stringify(validation))
            this.uploadImage(this.final_image_path)
            console.log("Setting image size")
            this.setImageSize(browser, this.final_image_path)
            if (this.baseline == null){
                this.detectError(browser, this.final_image_path)
                this.handleBaselineCreation(browser, validation, res_key, dict_safe_title, title)
                
            }
            else{
                this.baseline_path = this.final_image_path.replace(".png", "_baseline.png")
                console.info("Comparing images")
                this.downloadBaseline(browser, this.baseline["url"], this.baseline_path)
                this.compareImageToBaseline(browser, validation,res_key, dict_safe_title, title, JSON.parse(this.baseline["ignored"]))
                
            }
        }


        dispose(browser){
            let url = this.baseUrl + this.executionStatusFunction;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                api_key: this.apiKey+'__'+this.apiSecretKey,
                app_id: this.appId,
                execution_id: this.execution['id'],
                baseline_management: this.execution['baselineManagement'],
                comparison_logic: this.execution['comparisonLogic'],
                execution_status: this.execution['status'],
                processed_files: JSON.stringify(this.execution["validation"])
            }
            console.log("Post data: ", data)
            let options = {url: url, method: POST_METHOD, headers: headers, formData: data};
            browser.call(() => {
                console.log("Calling url")
                return new Promise((resolve, reject) => {
                    request(options,(err,res) => {
                        if (err) {
                            return reject(err)
                        }
                        console.log("Get result: ", res.statusCode + " " + res.statusMessage);
                        this.setExecutionStatus(res.body)
                        assert.equal(200, res.statusCode);
                        resolve(res)
                    })
                }).then(this.logExecution(this.execution['status']))
            })   
        }

        logExecution(status){
            let reportURL = this.reportBaseUrl + "?id=" + encodeURIComponent(this.execution['id']+"_"+this.accId) + "&app_id=" + encodeURIComponent(this.appId) + "&acc_id=" + encodeURIComponent(this.accId);
            if(status){
                if (status.includes("action required")) {
                console.log("Baseline action is required, visit:", reportURL);
                }
                else if (status.includes("failed")) {
                    console.log("Tests failed, please review at: ", reportURL);
                }
            }
            console.warn("To view a detailed report of the execution please navigate to: ", reportURL);
        }

        getAccount(){
            console.log("Retrieving account details")
            if (!this.apiKey && !this.apiSecretKey && !this.appId){
                console.warn("Apikey or appid not set for retrieving account details")
                console.debug(this.apiKey)
                console.debug(this.apiSecretKey)
                console.debug(this.appId)
                return null;
            }
            let headers = { };
            let accURL =this.baseUrl + this.accFunction + "?api_key=" + encodeURIComponent(this.apiKey) + "&secret=" + encodeURIComponent(this.apiSecretKey)+"&project=" + encodeURIComponent(this.appId);
            console.debug("request url: "+accURL)
            let options = {url: accURL, method: GET_METHOD, headers: headers};
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request(options,(err, res) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(res)
                        console.info("Retrieved account", res.statusCode + " " + res.statusMessage);
                        console.debug(res.body)
                        this.account = JSON.parse(res.body).results;
                        this.accId = this.account.acc_id;
                    })
                })
            })
        }
        getBaseline(title, res_key){
            console.debug("Looking for ", title, res_key)
            if (this.account && this.account.data && this.account.data.hasOwnProperty('baseline')){
                let baselines = this.account.data.baselines;
                console.debug("All baselines in app executions: ", baselines);
                let cond = (title in baselines) && (res_key in baselines[title]);
                if(cond){
                    return {
                        "url": baselines[title][res_key]["url"],
                        "ignored":baselines[title][res_key]["marked_regions"] || "{}"
                    };
                }
            }
            return null;
        }

        downloadBaseline(browser, url, path){
            let file = fs.createWriteStream(path);
            let options = {url: url, method: GET_METHOD, headers: {}};
            browser.call(() => {
                console.log("Downloading image to " + path)
                return new Promise((resolve, reject) => {
                    request(options, (err, res) => {
                        if (err) {
                            return reject(err);
                        };
                    }).pipe(file).on('finish', () => {
                        console.log("Finished downloading baseline");
                        resolve()
                    })
                })
            })
        }

        async compareImageToBaseline(browser, validation, res_key, dict_safe_title, title, ignored_regions){
            browser.call(() => { 
                var _ignoredBoxes = []
                if (Object.keys(_ignoredBoxes).length > 0){
                    ignored_regions.forEach(elem => {
                        if (elem["label"] === "ignore"){
                            _ignoredBoxes.push({
                                left: elem["x_min"],
                                top: elem["y_min"],
                                right: elem["x_max"],
                                bottom: elem["y_max"]
                            });
                        }
                    });
                }
                var options = {
                    output:{
                        errorColor: {
                            red: 255,
                            green: 0,
                            blue: 255
                        },
                        errorType: "diffOnly",
                        transparency: 0.3,
                        largeImageThreshold: 1200,
                        useCrossOrigin: true,
                        outputDiff: true,
                        ignoredBoxes: _ignoredBoxes
                    }
                };
                console.debug("Comparing with options", options)
                compareImages(this.baseline_path, this.final_image_path, options).then((res) => {
                    console.debug("Comparison result")
                    console.debug(JSON.stringify(res))
                    let currValid = "passed"
                    if (res.rawMisMatchPercentage > 0){
                        currValid = "failed"
                        this.execution['status'] = "failed"
                    }
                    validation.push({
                        "res_key":res_key,
                        "dict_safe_title":dict_safe_title,
                        "save_path":this.final_image_path,
                        "save_name":title,
                        "new_execution":false,
                        "height":this.execution['viewportHeight'],
                        "width": this.execution['viewportWidth'],
                        "image_height": this.image_height,
                        "image_width": this.image_width,
                        "status": currValid,
                        "comparison": JSON.parse(JSON.stringify(res))
                    })
                    this.execution["validation"] = validation
                    this.comparison = null
                })
            })   
        }
    }
}
