const assert = require('assert')
const POST_METHOD = 'POST';
const GET_METHOD = 'GET';
const MULTIPART_FORMDATA = 'multipart/form-data';
const tmp = require('tmp');
const path = require('path');
let request = require('request');
let fs = require('fs');
const { v4: uuidv4 } = require('uuid')
let compareImages = require("resemblejs/compareImages");
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
            this.executionStatusFunction = "get_execution_status-dev"
            this.uploadImageFunction = "upload_image-dev"
            this.accFunction = "get_account-dev"

            this.execution = {}
            this.execution.id = uuidv4()
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

        uploadImage(path) {
            let url = this.baseUrl + this.uploadImageFunction;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                file: fs.createReadStream(path),
                acc_id: this.accId,
                execution_id: this.execution['id'],
                api_key: this.apiKey + "__" + this.apiSecretKey,
                app_id: this.appId
            }
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


        captureScreen(browser, title) {   
            if (path.extname(title) == '') {
                title = title + '.png'
            }
            this.final_image_path = path.join(this._dir.toString(), title);
            console.info("Captured image in path: " + this.final_image_path);
            browser.saveScreenshot(this.final_image_path);
            this.setViewportSize();
            
            //New code for resemblejs
            this.getAccount()
            let res_key = this.execution['viewportWidth'] + '_' + this.execution['viewportHeight']
            let dict_safe_title = title.replace(".","_").toLowerCase()
            console.info("Looking for baseline in account data: " + dict_safe_title +"   "+res_key)
            this.baseline_url = this.getBaselineUrl(dict_safe_title, res_key)
            let validation = this.execution['validation'] || []
            console.debug("Valiations retrievied", JSON.stringify(validation))
            this.uploadImage(this.final_image_path)
            if (this.baseline_url == null){
                console.info("No baseline detected, creating new execution log.")
                validation.push({
                    "res_key":res_key,
                    "dict_safe_title":dict_safe_title,
                    "save_path":this.final_image_path,
                    "new_execution":true
                })
                this.execution["validation"] = validation
                
            }else{
                this.baseline_path = this.final_image_path.replace(".png", "_baseline.png")
                console.info("Comparing images")
                
                this.compareImageToBaseline(browser, this.baseline_url, this.baseline_path, validation,res_key, dict_safe_title)
                
                // console.debug("Image comparison result: ")
                // console.debug(this.comparison)
                // assert.equal(this.comparison.misMatchPercentage,0)
            }
        }


        dispose(browser){
            let url = this.baseUrl + this.executionStatusFunction;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                api_key: this.apiKey,
                app_id: this.appId,
                execution_id: this.execution['id']
            }
            let options = {url: url, method: POST_METHOD, headers: headers, formData: data};
            browser.call(() => {
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
            let reportURL = this.reportBaseUrl + "?id=" + this.execution['id'] + "&app_id=" + this.appId + "&acc_id=" + this.accId;
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
            let accURL =this.baseUrl + this.accFunction + "?api_key=" + encodeURIComponent(this.apiKey) + "&secret=" + encodeURIComponent(this.apiSecretKey);
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
        getBaselineUrl(title, res_key){
            let baselines = this.account.data.baselines;
            console.debug("All baselines in app executions");
            let cond = (title in baselines) && (res_key in baselines[title]);
            console.debug("Condition: "+cond);
            if(cond){
                return baselines[title][res_key]["url"];
            }
            return null;
        }

        async compareImageToBaseline(browser, url, path, validation, res_key, dict_safe_title){
            console.log("Downloading image to " + path)
            let file = fs.createWriteStream(path);
            let options = {url: url, method: GET_METHOD, headers: {}};
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request(options, (err, res) => {
                        if (err) {
                            return reject(err);
                        };
                        resolve(res);
                    }).pipe(file).on('finish', () => {
                        console.log("Finished downloading baseline");
                        compareImages(this.baseline_path, this.final_image_path).then((res) => {
                            console.debug("Comparison result")
                            console.debug(this.comparison)
                            validation.push({
                                "res_key":res_key,
                                "dict_safe_title":dict_safe_title,
                                "save_path":this.final_image_path,
                                "new_execution":false,
                                "comparison": JSON.parse(JSON.stringify(res))
                            })
                            this.execution["validation"] = validation
                            this.comparison = null
                        })
                    })
                })
            })
        }
    }
}
