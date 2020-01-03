const assert = require('assert')
const POST_METHOD = 'POST';
let request = require('request');
let fs = require('fs');

function _tempDirCreated(err, path) {
    if (err) throw err;
    console.log("TEMP PATH: " + path)
    return path;
}

module.exports = {
    Oculow: class Oculow {
        constructor() {
            this.tmp = require('tmp');
            this.path = require('path');

            // Find better solution for this...
            this.MANUAL = 0;
            this.ASSISTED = 1;
            this.FORCE_NEW = 2;
            this.FORCE_ALL = 3;
            this.PIXEL_DIFF = 0;
            this.IGNORE_AA = 1;
            this.DETECT_ERRORS = 3;

            this._dir = this.tmp.dirSync().name;
            console.log('Dir: ', this._dir);

            this.comparisonLogic = 1
            this.baselineManagement = 1
            this._executionId = null
            this.apiKey = null
            this.apiSecretKey = null
            this.appId = null
            this.viewportWidth = '200'
            this.viewportHeight = '200'
            this.baseUrl = "https://us-central1-lince-232621.cloudfunctions.net/"
            this.reportBaseUrl = "https://dev.oculow.com/dashboard/executions.html"
            this.executionStatusFunction = "get_execution_status-dev" // TODO extract to config file
            this.processFunction = "process_image-dev" // TODO extract to config file
        };

        setComparisonLogic(COMPARISON_LOGIC) {
            this.comparisonLogic = COMPARISON_LOGIC;
        }

        setBaselineManagement(MANAGEMENT_LEVEL) {
            this.baselineManagement = MANAGEMENT_LEVEL;
        }

        setExecutionId(EXECUTION_ID){
            this._executionId = EXECUTION_ID;
        }
        
        setAppId(APP_ID) {
            this.appId = APP_ID;
        }

        setKeys(API_KEY, SECRET_KEY) {
            this.apiKey = API_KEY;
            this.apiSecretKey = SECRET_KEY;
        }

        uploadImage(path) {
            let url = this.baseUrl + this.processFunction;
            let headers = { 'Content-Type': 'application/json' };
            let data = {
                file: fs.createReadStream(path),
                viewport: JSON.stringify({width: this.viewportWidth, height: this.viewportHeight}),
                baseline_management: this.baselineManagement,
                comparison_logic: this.comparisonLogic,
                api_key: this.apiKey + "__" + this.apiSecretKey,
                app_id: this.appId
            }
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request({url: url, method: POST_METHOD, headers: headers, formData: data, json:true, resolveWithFullResponse:true},(err,res) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(res)
                        console.log(res);
                        console.log("Get result STATUS CODE: ", res.statusCode);
                        console.log("Get result STATUS MESSAGE: ", res.statusMessage);
                        console.log("Get result BODY: ",res.body);
                        assert.equal(200, res.statusCode);
                    })
                })
            })
        }

        executeAfterCapturingScreen() {
            console.log("THIS FUNCTION WAS EXECUTED AFTER CAPTURING SCREEN");
        }

        captureScreen(browser, title) {
            if (this.path.extname(title) == '') {
                title = title + '.png'
            }
            let final_image_path = this.path.join(this._dir.toString(), title);
            console.log("Final image path: " + final_image_path);
            browser.saveScreenshot(final_image_path);
            // this.viewportWidth = browser.getViewportSize('width')
            // this.viewportHeight = browser.getViewportSize('height')
            this.setKeys('9HanEbAexPF2cPAJzlFNXBIGNzqhK2pU', 'uTLZZLR/HnUOCu5U7vNI6WrsYTBGTBxM');
            this.setAppId('ocw');
            this.uploadImage(final_image_path);
        }

        getResult(){
            let url = this.baseUrl + this.executionStatusFunction;
            let headers = { 'Content-Type': 'multipart/form-data' };
            this.setKeys('9HanEbAexPF2cPAJzlFNXBIGNzqhK2pU', 'uTLZZLR/HnUOCu5U7vNI6WrsYTBGTBxM');
            this.setAppId('ocw');
            this.setExecutionId('f2d31c51-bad2-4e39-8711-1cc1ff71ea4a_0de8ef6f-7837-4deb-81ed-6837ab67da23');
            let data = {
                api_key: this.apiKey,
                app_id: this.appId,
                execution_id: this._executionId

            }
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request({url: url, method: POST_METHOD, headers: headers, formData: data, json:true, resolveWithFullResponse:true},(err,res) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(res)
                        console.log(res);
                        console.log("Get result STATUS CODE: ", res.statusCode);
                        console.log("Get result STATUS MESSAGE: ", res.statusMessage);
                        console.log("Get result BODY: ", res.body);
                        assert.equal(200, res.statusCode);
                    })
                })
            })
            
        }
    }
}