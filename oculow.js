function _tempDirCreated(err, path) {
  if (err) throw err;

  console.log("TEMP PATH: "+path)
  return path;
}
var FormData = require('form-data');

module.exports ={
  Oculow : class Oculow {
    constructor(){
      this.tmp = require('tmp');
      this.path = require('path');
      this.fs = require('fs');
      this.axios = require('axios');

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

      this.module_comparison_logic = 1
      this.module_baseline_management = 1
      this._execution_id = null
      this.module_api_key = null
      this.module_api_secret_key = null
      this.module_app_id = null
      this.viewport_width = null
      this.viewport_height = null
      this.base_url = "https://us-central1-lince-232621.cloudfunctions.net/"
      this._report_base_url = "https://dev.oculow.com/dashboard/executions.html"
      this.execution_status_function = "get_execution_status-dev"  // TODO extract to config file
      this.process_function = "process_image-dev"  // TODO extract to config file


    };
    
    setComparisonLogic(COMPARISON_LOGIC){
      this.module_comparison_logic=COMPARISON_LOGIC;
    }
    
    setBaselineManagement(MANAGEMENT_LEVEL){
      this.module_baseline_management=MANAGEMENT_LEVEL;
    }
    setAppId(APP_ID){
      this.module_app_id=APP_ID;
    }
    
    setApiKey(API_KEY, SECRET_KEY){
      this.module_api_key=API_KEY;
      this.module_api_secret_key=SECRET_KEY;
    }
    
    uploadImage(path){
      let data = new FormData();
      data.append("file", this.fs.createReadStream(path));
      data.append('api_key', this.module_api_key + "__" + this.module_api_secret_key);
      data.append('app_id', this.module_app_id);
      console.log("MODULE COMPARISON LOGIC: "+this.module_comparison_logic)
      data.append('comparison_logic', this.module_comparison_logic);
      if (this._execution_id){
        data.append('execution_id', this._execution_id);
      }
      data.append('baseline_management', this.module_baseline_management);
      data.append('viewport', "{\"width:"+ this.viewport_width, "height:"+ this.viewport_height+"}");
    
      const request_config = {
        data: data
      };
      return this.axios.post(this.base_url+this.process_function,data, request_config)
      
    .then((res) => {
      console.log(`statusCode: ${res.statusCode}`)
      console.log(res)
      return res;
    })
    .catch((error) => {
      console.error(error)
      return error;
    })
    }
    captureScreen (browser, title) {
      var final_image_path= this.path.join(this._dir.toString(),title)
      console.log("Final image path: "+final_image_path)
      browser.saveScreenshot(final_image_path);
      return this.uploadImage(final_image_path)
    }
  }
}