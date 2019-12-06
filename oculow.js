function _tempDirCreated(err, path) {
  if (err) throw err;

  console.log("TEMP PATH: "+path)
  return path;
}
var FormData = require('form-data');
var fs = require('fs');
const axios = require('axios');

module.exports ={
  Oculow : class Oculow {
    constructor(){
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
      this.executionStatusFunction = "get_execution_status-dev"  // TODO extract to config file
      this.processFunction = "process_image-dev"  // TODO extract to config file


    };
    
    setComparisonLogic(COMPARISON_LOGIC){
      this.comparisonLogic=COMPARISON_LOGIC;
    }
    
    setBaselineManagement(MANAGEMENT_LEVEL){
      this.baselineManagement=MANAGEMENT_LEVEL;
    }
    setAppId(APP_ID){
      this.appId=APP_ID;
    }
    
    setApiKey(API_KEY, SECRET_KEY){
      this.apiKey=API_KEY;
      this.apiSecretKey=SECRET_KEY;
    }
    
    uploadImage(path){
      postImage(path, this.baseUrl, this.processFunction, this.apiKey, this.apiSecretKey, this.appId, this.comparisonLogic, this._executionId, this.baselineManagement, this.viewportHeight, this.viewportWidth);
    }
    captureScreen (browser, title) {
      var final_image_path= this.path.join(this._dir.toString(),title)
      console.log("Final image path: "+final_image_path)
      browser.saveScreenshot(final_image_path);
      // this.viewportWidth = browser.getViewportSize('width')
      // this.viewportHeight = browser.getViewportSize('height')
      this.uploadImage(final_image_path);
    }
  }
}

function postImage (path, baseUrl, processFunction, apiKey, apiSecretKey, appId, comparisonLogic, executionId, baselineManagement, viewportWidth, viewportHeight) {
  
    // let data = new FormData();
    // data.append("file", fs.createReadStream(path));
    // data.append('api_key', apiKey + "__" + apiSecretKey);
    // data.append('app_id', appId);
    // console.log("MODULE COMPARISON LOGIC: "+comparisonLogic)
    // data.append('comparison_logic', comparisonLogic);
    // if (executionId){
    //   data.append('execution_id', executionId);
    // }
    // data.append('baseline_management', baselineManagement);
    // data.append('viewport', "{\"width:"+ viewportWidth + ", height:"+ viewportHeight+"}");
    // const requestConfig = {
    //   data: data
    // };


    var formData = {
      // Pass a simple key-value pair
      api_key:  apiKey + "__" + apiSecretKey,
      app_id:  appId,
      comparison_logic: comparisonLogic,
      baseline_management:  baselineManagement,
      viewport:  "{\"width:"+ viewportWidth + ", height:"+ viewportHeight+"}",

      // Pass data via Streams
      file: fs.createReadStream(path),
      }
      // console.log(
      //   "api_key:  "+  apiKey + "__" + apiSecretKey+
      //   "\napp_id:  " +appId+
      //   "\ncomparison_logic:  "+comparisonLogic+
      //   "\nexecution_id:  "+ executionId+
      //   "\nbaseline_management:  "+baselineManagement+
      //   "\nviewport:  {\"width:"+ viewportWidth + ", height:"+ viewportHeight+"}",
      // )
  //     if (executionId){
  //       console.log("exec id found!!!")
  //       formData['executionId'] = executionId
  //     }
  //   return axios.post({url:baseUrl+processFunction, formData: formData}, function optionalCallback(err, httpResponse, body) {
  //     if (err) {
  //       return console.error('upload failed:', err);
  //     }
  //     console.log('Upload successful!  Server responded with:', body);
  // })
  // console.log(`${baseUrl + processFunction}`);
  // console.log(JSON.stringify(formData));
      let ret = Promise.resolve();
      ret = ret.then(() => axios.post(`${baseUrl + processFunction}`,
        formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(response => console.log(`RES: ${JSON.stringify(response)}`)).catch(function (error) {
                console.log(error);
                console.log(error.response.status);
        }));
        return ret;
};
