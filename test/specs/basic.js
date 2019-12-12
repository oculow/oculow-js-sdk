const assert = require('assert')
var oculow = require('../../oculow.js')
oculow = new oculow.Oculow();


describe(`Preparing oculow driver`, () => {
    before(() => {
        oculow.setApiKey("10eVwxGqZMkJILKrlPnL8RmHZjAhDiNy","qzSqIAHye2MJvrt37VxzBsv4ADwO9Q7G")
        oculow.setAppId("oculowjs")
        oculow.setBaselineManagement(oculow.ASSISTED)
        oculow.setComparisonLogic(oculow.PIXEL_DIFF)
  });
})

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        const title = browser.getTitle()
        assert.strictEqual(title, 'WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})

describe('oculow sdk test', () => {
    it('should capture and process the image', () => {
        browser.url('https://www.oculow.com')
        oculow.captureScreen(browser, "Homesite");
        console.log(1)
        
        browser.url('https://www.oculow.com/blog/index.html')
        oculow.captureScreen(browser, "Blog");
        console.log(2)

        browser.url('https://www.oculow.com/404')
        oculow.captureScreen(browser, "Not found.png");
        console.log(3)

    })
})

after(() => {
    console.log("Teardown of test")
})