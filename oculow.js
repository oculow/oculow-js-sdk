module.exports ={
  Oculow : class Oculow {
    constructor(){
      this.tmp = require('tmp');
      this.path = require('path');
      this.fs = require('fs');
      this.axios = require('axios');
      
      this._dir = tmp.dir({ template: 'tmp-XXXXXX' }, function _tempDirCreated(err, path) {
        if (err) throw err;
      
        return path;
      });
      this.module_comparison_logic = 1
      this.module_baseline_management = 1
      this._execution_id = None
      this.module_api_key = None
      this.module_api_secret_key = None
      this.module_app_id = None
      this.viewport_width = None
      this.viewport_height = None
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
    
    
    captureScreen (browser, title) {
      var final_image_path= this.path.join(this._dir,title)
      browser.saveScreenshot(final_image_path);
      return uploadImage(final_image_path)
    }
    
    uploadImage(path){
      let data = new FormData();
      data.append("file", this.fs.createReadStream(path));
      data.append('api_key', module_api_key + "__" + module_api_secret_key);
      data.append('app_id', module_app_id);
      data.append('comparison_logic', module_comparison_logic);
      data.append('execution_id', _execution_id);
      data.append('baseline_management', module_baseline_management);
      data.append('viewport', json.dumps({"width": viewport_width, "height": viewport_height}));
    
      const request_config = {
        headers: {
          "Authorization": "Bearer " + access_token,
          "Content-Type": "multipart/form-data"
        },
        data: data
      };
      return this.axios.post(base_url+process_function,data, request_config)
      
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


}
}