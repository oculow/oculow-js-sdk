const assert = require('assert')
var oculow = require('../../oculow.js')
oculow = new oculow.Oculow();

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        const title = browser.getTitle()
        assert.strictEqual(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})

describe('oculow sdk test', () => {
    it('should capture and process the image', () => {
        oculow = oculow.Oculow()
        oculow.setApiKey()
        oculow.setAppId()
        oculow.setBaselineManagement()
        oculow.setComparisonLogic()
        
        browser.url('https://www.oculow.com')
        var result = oculow.captureScreen(browser, "testing js.png")
        console.log("RESULT: "+result)


    })
})