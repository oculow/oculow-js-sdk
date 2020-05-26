const assert = require('assert')
let oculow = require('../../oculow.js')
oculow = new oculow.Oculow();


describe(`Preparing oculow driver`, () => {
    before(() => {
        
  });
})

describe('oculow sdk test', () => {

    it('should capture and process the image', () => {
        oculow.setKeys("ackRlE2pr/fJstpPqFTBha3gCkguKRGG", "UjrJX2lT8oij0dvDrcVV2fkBKg1tAAdX")
        oculow.setAppId("oculowjs")
        oculow.setBaselineManagement(oculow.ASSISTED)
        oculow.setComparisonLogic(oculow.PIXEL_DIFF)
        
        browser.url('https://www.oculow.com')
        oculow.captureScreen(browser, "Homesite");
        
        
        browser.url('https://www.oculow.com/blog/index.html')
        oculow.captureScreen(browser, "Blog");
        

        browser.url('https://www.oculow.com/404')
        oculow.captureScreen(browser, "Not found.png");

    })
    
})

after(() => {
    console.log("Teardown of test")
})