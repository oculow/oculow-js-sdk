const assert = require('assert')
const POST_METHOD = 'POST';
const MULTIPART_FORMDATA = 'multipart/form-data';
let request = require('request');
let fs = require('fs');


module.exports = {
    Oculow: class Oculow {
        constructor() {
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
            console.log('Dir: ', this._dir);
            this.comparisonLogic = 1
            this.baselineManagement = 1
            this.executionId = null
            this.apiKey = null
            this.apiSecretKey = null
            this.appId = null
            this.accId = null
            this.viewportWidth = null
            this.viewportHeight = null
            this.executionStatus = null
            this.baseUrl = "https://us-central1-lince-232621.cloudfunctions.net/"
            this.reportBaseUrl = "https://dev.oculow.com/dashboard/executions.html"
            this.executionStatusFunction = "get_execution_status-dev"
            this.processFunction = "process_image-dev"
        };

        setComparisonLogic(COMPARISON_LOGIC) {
            this.comparisonLogic = COMPARISON_LOGIC;
        }

        setBaselineManagement(MANAGEMENT_LEVEL) {
            this.baselineManagement = MANAGEMENT_LEVEL;
        }

        setExecutionId(EXECUTION_ID){
            this.executionId = EXECUTION_ID;
        }

        setExecutionStatus(STATUS){
            this.executionStatus = STATUS;
        }
        
        setAppId(APP_ID) {
            this.appId = APP_ID;
        }

        setAccId(ACC_ID){
            this.accId = ACC_ID;
        }

        setKeys(API_KEY, SECRET_KEY) {
            this.apiKey = API_KEY;
            this.apiSecretKey = SECRET_KEY;
        }

        setViewportSize(){
            this.viewportWidth = this.getBrowserWindowSize('width');
            this.viewportHeight = this.getBrowserWindowSize('height');
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
            if(this.executionId){
                data.execution_id = this.executionId;
            }
            let options = {url: url, method: POST_METHOD, headers: headers, formData: data};
            browser.call(() => {
                return new Promise((resolve, reject) => {
                    request(options,(err,res) => {
                        if (err) {
                            return reject(err)
                        }
                        resolve(res)
                        console.log("Capture screen: ", res.statusCode + " " + res.statusMessage);
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
            let final_image_path = this.path.join(this._dir.toString(), title);
            console.log("Final image path: " + final_image_path);
            browser.saveScreenshot(final_image_path);
            this.setViewportSize();
            this.setKeys('9HanEbAexPF2cPAJzlFNXBIGNzqhK2pU', 'uTLZZLR/HnUOCu5U7vNI6WrsYTBGTBxM');
            this.setAppId('ocw');
            this.uploadImage(final_image_path);
        }


        getResult(){
            let url = this.baseUrl + this.executionStatusFunction;
            let headers = { 'Content-Type': MULTIPART_FORMDATA };
            let data = {
                api_key: this.apiKey,
                app_id: this.appId,
                execution_id: this.executionId
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
                }).then(this.dispose(this.executionStatus))
            })   
        }

        dispose(status){
            let reportURL = this.reportBaseUrl + "?id=" + this.executionId + "&app_id=" + this.appId + "&acc_id=" + this.accId;
            if(status){
                if (status.includes("action required")) {
                console.log("Baseline action is required, visit:", reportURL);
                }
                else if (status.includes("failed")) {
                    console.log("Tests failed, please review at: ", reportURL);
                }
            }
            console.log("To view a detailed report of the execution please navigate to: ", this.reportBaseUrl + "?id=" + this.executionId);
        }
    }
}