const request = require('request');
const querystring = require('querystring');
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
        setAppId(APP_ID) {
            this.appId = APP_ID;
        }

        setKeys(API_KEY, SECRET_KEY) {
            this.apiKey = API_KEY;
            this.apiSecretKey = SECRET_KEY;
        }

        postImage(headers, baseUrl, formData) {

            request({
                headers,
                uri: baseUrl,
                body: formData,
                method: 'POST'
            }, function(err, res, body) {
                console.log('ERROR: ', err);
                console.log('STATUS CODE: ', res && res.statusCode);
            });

        }



        async uploadImage(path) {
            let data = {
                'file': fs.createReadStream(path),
                'viewport': "{\"width:" + this.viewportWidth + ", height:" + this.viewportHeight + "}",
                'baseline_management': this.baselineManagement,
                'comparison_logic': this.comparisonLogic,
                'api_key': this.apiKey + "__" + this.apiSecretKey,
                'app_id': this.appId
            }
            let fdata = querystring.stringify(data);
            let fdataLength = fdata.length;
            let headers = {
                'Content-Length': fdataLength,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            let baseURL = this.baseUrl + this.processFunction;
            return await this.postImage(headers, baseURL, fdata);
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
            return this.uploadImage(final_image_path).then(this.executeAfterCapturingScreen);
        }
    }
}