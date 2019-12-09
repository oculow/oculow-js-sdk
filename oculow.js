const axios = require('axios');
let FormData = require('form-data');
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

    setApiKey(API_KEY, SECRET_KEY) {
      this.apiKey = API_KEY;
      this.apiSecretKey = SECRET_KEY;
    }

    async postImage(path, baseUrl, processFunction, apiKey, apiSecretKey, appId, comparisonLogic, baselineManagement, viewportWidth, viewportHeight) {
      let formData = {
        // Pass a simple key-value pair
        api_key: apiKey + "__" + apiSecretKey,
        app_id: appId,
        comparison_logic: comparisonLogic,
        baseline_management: baselineManagement,
        viewport: "{\"width:" + viewportWidth + ", height:" + viewportHeight + "}",
        // Pass data via Streams
        file: fs.createReadStream(path),
      }


      let ret = await axios.post(`${baseUrl + processFunction}`,
        formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      return ret;
    }

    uploadImage(path) {
      return this.postImage(path, this.baseUrl, this.processFunction, this.apiKey, this.apiSecretKey, this.appId, this.comparisonLogic, this.baselineManagement, this.viewportHeight, this.viewportWidth);
    }

    executeAfterCapturingScreen() {
      console.log("THIS FUNCTION WAS EXECUTED AFTER CAPTURING SCREEN");
    }

    captureScreen(browser, title) {
      var final_image_path = this.path.join(this._dir.toString(), title)
      console.log("Final image path: " + final_image_path)
      browser.saveScreenshot(final_image_path);
      // this.viewportWidth = browser.getViewportSize('width')
      // this.viewportHeight = browser.getViewportSize('height')
      return this.uploadImage(final_image_path)
        .then(result => console.log(result)) //YOUR SUCCESS
        //Cuando la request quede funcionando y con success acá, se hace aca alguna logica
        //que storee localmente el id que precisas, y luego a las proximas request las usas 
        //basandote en ese id. 
        /*
        El codigo te quedaría algo asi como:
        let currentExecId = null; variable de ejemplo declara arriba junto a las demas
        
        .then(function (res) {
          currentExecId = res.data.id; Navegas hasta donde este el id o el dato que precisas y se lo asignas a currentExecId
        })
        */
        .catch(function (err) { //YOUR FAIL
          let response = err.response;
          let status = response.status;
          let statusText = response.statusText;
          console.log("CAPTURE SCREEN REQUEST THROWS: " + statusText + ":" + status);
        })
        .then(this.executeAfterCapturingScreen); //AFTER

    }
  }
}