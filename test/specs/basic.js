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
        oculow.setApiKey("10eVwxGqZMkJILKrlPnL8RmHZjAhDiNy","qzSqIAHye2MJvrt37VxzBsv4ADwO9Q7G")
        oculow.setAppId("oculowjs")
        oculow.setBaselineManagement(oculow.ASSISTED)
        oculow.setComparisonLogic(oculow.PIXEL_DIFF)
        
        browser.url('https://www.oculow.com')
        return oculow.captureScreen(browser, "testing js.png");
    })
})