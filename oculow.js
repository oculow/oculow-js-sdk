var tmp = require('tmp');
var fs = require('fs'),

const axios = require('axios')


var _dir = tmp.dir({ template: 'tmp-XXXXXX' }, function _tempDirCreated(err, path) {
    if (err) throw err;
   
    return path;
  });
var module_comparison_logic = 1
var module_baseline_management = 1
var _execution_id = None
var module_api_key = None
var module_api_secret_key = None
var module_app_id = None
var viewport_width = None
var viewport_height = None
var base_url = "https://us-central1-lince-232621.cloudfunctions.net/"
var _report_base_url = "https://dev.oculow.com/dashboard/executions.html"
var execution_status_function = "get_execution_status-dev"  // TODO extract to config file
var process_function = "process_image-dev"  // TODO extract to config file


function captureScreen (browser, title) {
    browser.saveScreenshot(title);
}

function uploadImage(path){
  let data = new FormData();
  axios.post(base_url+process_function, {
    'api_key': module_api_key + "__" + module_api_secret_key,
    'app_id': module_app_id,
    'comparison_logic': module_comparison_logic,
    'execution_id': _execution_id,
    'baseline_management': module_baseline_management,
    "viewport": json.dumps({"width": viewport_width, "height": viewport_height})
})
.then((res) => {
  console.log(`statusCode: ${res.statusCode}`)
  console.log(res)
})
.catch((error) => {
  console.error(error)
})
}
