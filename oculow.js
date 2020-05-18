const assert = require('assert')
const POST_METHOD = 'POST';
const GET_METHOD = 'GET';
const MULTIPART_FORMDATA = 'multipart/form-data';
let request = require('request');
var rp = require('request-promise');
let fs = require('fs');
let compareImages = require("resemblejs/compareImages");
const util = require("util");
const readFile = util.promisify(fs.readFile);
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
            this.tmp = require('tmp');
            this.path = require('path');
            this.MANUAL = 0;
            this.ASSISTED = 1;
            this.FORCE_NEW = 2;
            this.FORCE_ALL = 3;
            this.PIXEL_DIFF = 0;
            this.IGNORE_AA = 1;
            this.DETECT_ERRORS = 3;
            this._dir = this.tmp.dirSync().name;
            console.debug('Dir: ', this._dir);
            this.comparisonLogic = 1
            this.baselineManagement = 1
            
            
            this.viewportWidth = null
            this.viewportHeight = null
            this.baseUrl = "https://us-central1-lince-232621.cloudfunctions.net/"
            this.reportBaseUrl = "https://oculow.com/dashboard/executions.html"
            this.executionStatusFunction = "get_execution_status-dev"
            this.processFunction = "process_image-dev"
            this.accFunction = "get_account-dev"

            this.execution = {}
        };

        setComparisonLogic(COMPARISON_LOGIC) {
            console.info("Setting baseline comparison logic")
            this.comparisonLogic = COMPARISON_LOGIC;
        }

        setBaselineManagement(MANAGEMENT_LEVEL) {
            console.info("Setting baseline management level")
            this.baselineManagement = MANAGEMENT_LEVEL;
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
            let url = this.baseUrl + this.processFunction;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                file: fs.createReadStream(path),
                viewport: JSON.stringify({width: this.viewportWidth, height: this.viewportHeight}),
                baseline_management: this.baselineManagement,
                comparison_logic: this.comparisonLogic,
                api_key: this.apiKey + "__" + this.apiSecretKey,
                app_id: this.appId
            }
            if(this.execution['id']){
                data.execution_id = this.execution['id'];
            }
            let options = {url: url, method: POST_METHOD, headers: headers, formData: data};
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request(options,(err,res) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(res)
                        console.info("Capture screen: ", res.statusCode + " " + res.statusMessage);
                        let load = JSON.parse(res.body);
                        this.setExecutionId(load.execution_id);
                        this.setAccId(load.acc_id);
                        assert.equal(200, res.statusCode);
                    })
                }).then(this.getResult())
            })
        }


        captureScreen(browser, title) {   
            if (this.path.extname(title) == '') {
                title = title + '.png'
            }
            this.final_image_path = this.path.join(this._dir.toString(), title);
            console.info("Captured image in path: " + this.final_image_path);
            browser.saveScreenshot(this.final_image_path);
            this.setViewportSize();
            // this.uploadImage(final_image_path);
            
            //New code for resemblejs
            this.getAccount()
            let res_key = this.execution['viewportWidth'] + '_' + this.execution['viewportHeight']
            let dict_safe_title = title.replace(".","_").toLowerCase()
            console.info("Looking for baseline in account data: " + dict_safe_title +"   "+res_key)
            this.baseline_url = this.getBaselineUrl(dict_safe_title, res_key)
            let validation = this.execution || []

            if (this.baseline_url == null){
                console.info("No baseline detected, creating new execution log.")
                validation.push({"res_key":res_key, "dict_safe_title":dict_safe_title, "save_path":this.final_image_path})
                this.execution["validation"] = validation
                
            }else{
                this.baseline_path = this.final_image_path.replace(".png", "_baseline.png")
                console.info("Comparing images")
                this.compareImageToBaseline(browser, this.baseline_url, this.baseline_path)
                validation.append(this.comparison)
                this.execution["validation"] = validation
                this.comparison = null
                // console.debug("Image comparison result: ")
                // console.debug(this.comparison)
                // assert.equal(this.comparison.misMatchPercentage,0)
            }
        }


        getResult(){
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
                        resolve(res)
                        console.log("Get result: ", res.statusCode + " " + res.statusMessage);
                        this.setExecutionStatus(res.body)
                        assert.equal(200, res.statusCode);
                    })
                }).then(this.dispose(this.execution['status']))
            })   
        }

        dispose(status){
            let reportURL = this.reportBaseUrl + "?id=" + this.execution['id'] + "&app_id=" + this.appId + "&acc_id=" + this.accId;
            if(status){
                if (status.includes("action required")) {
                console.log("Baseline action is required, visit:", reportURL);
                }
                else if (status.includes("failed")) {
                    console.log("Tests failed, please review at: ", reportURL);
                }
            }
            console.warn("To view a detailed report of the execution please navigate to: ", this.reportBaseUrl + "?id=" + this.execution['id']);
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
                    request(options,(err,res) => {
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

        compareImageToBaseline(browser, url, path){
            console.log("Downloading image to " + path)
            let file = fs.createWriteStream(path);
            let options = {url: url, method: GET_METHOD, headers: {}};
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request(options,(err,res) => {
                        if (err) {
                            return reject(err)
                        };
                        resolve(res)
                    }).pipe(file).on('finish', () => {
                        console.log("RESPONSE HERE")
                    this.comparison = compareImages(this.baseline_path, this.final_image_path)
                    console.log("comparison actual value", this.comparison)
                    })
                })
            })
        }
    }
}
