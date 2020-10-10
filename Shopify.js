const Bot = require('./Bot.js'), Amazon = require('./Amazon.js');

class Shopify
{
    constructor(){}

    static async listProductsOnShopify(page)
    {
        await this.makeListingInactive(page)
        await this.addShopifyTitle(page)    
        await this.addShopifyDescription(page)
        await this.uploadImageUrls(page)

        await page.type('input[name="price"]', `${Amazon.products[0].Price}`) 
        await page.waitForTimeout(250)

        await this.checkBackOrderCheckBox(page)
        await this.addShopifyQuantity(page)

        await page.type('input[id="PolarisTextField7"]', `${Amazon.products[0].Brand}`)
    }

    static async makeListingInactive(page)
    {
        await page.waitForSelector('span[class="Polaris-Button__Text_yj3uv"]')
        let buttonElements = await page.$$('span[class="Polaris-Button__Text_yj3uv"]')
        for (let counter = 0; counter < buttonElements.length; counter++)
        {
            let buttonText = await page.evaluate(el => el.textContent, buttonElements[counter])
            if(buttonText == "Manage")
            {
                await buttonElements[counter].click()
                break
            }
        }

        await page.waitForSelector('button[class="Polaris-Modal-CloseButton_bl13t"]')
        let storeCheckBoxElements = await page.$$('span[class="Polaris-Checkbox_1d6zr"]')
        for (let counter = 0; counter < storeCheckBoxElements.length; counter++)
        {
            await page.waitForTimeout(250)
            await storeCheckBoxElements[counter].click()
        }

        let closeModalElements = await page.$$('button[class="Polaris-Button_r99lw Polaris-Button--primary_7k9zs"]')
        for (let counter = 0; counter < closeModalElements.length; counter++)
        {
            let buttonText = await page.evaluate(el => el.textContent, closeModalElements[counter])
            if(buttonText == "Done")
            {
                await closeModalElements[counter].click()
                break
            }
        }
    }

    static async uploadImageUrls(page)
    {
        for(let counter = 0; counter < Amazon.products[0].ImageLinks.length; counter++)
        {
            await page.waitForTimeout(500)
            await page.waitForSelector('button[aria-controls="Polarispopover6"]')
            await page.click('button[aria-controls="Polarispopover6"]')
            let imageUrlElements = await page.$$('button[class="Polaris-ActionList__Item_yiyol"]')
            imageUrlElements[0].click()

            await page.waitForSelector('input[placeholder="https://"]')
            await page.type('input[placeholder="https://"]', `${Amazon.products[0].ImageLinks[counter]}`)

            let buttonElements = await page.$$('div[class="Polaris-ButtonGroup__Item_yiyol"]')
            for (let counter = 0; counter < buttonElements.length; counter++)
            {
                let buttonText = await page.evaluate(el => el.textContent, buttonElements[counter])
                if(buttonText == "Add media")
                {
                    await buttonElements[counter].click()
                    break
                }
            }
        }
    }

    static async checkBackOrderCheckBox(page)
    {
        await page.click('label[for="InventoryTrackingAllowOutOfStockPurchases"] span')
    }

    static async addShopifyTitle(page)
    {
        await page.waitForSelector('input[name="title"]')
        await page.waitForTimeout(500)
        await page.click('input[name="title"]')
        await page.type('input[name="title"]', `${Amazon.products[0].Title}`)
    }

    static async addShopifyQuantity(page)
    {   
        await page.waitForTimeout(250)
        await page.click('input[id="AdjustQuantityPopoverTextFieldActivator"]')
        await page.keyboard.press('Delete'); 
        await page.type('input[id="AdjustQuantityPopoverTextFieldActivator"]', '5')
        await page.waitForTimeout(250)
    }

    static async addShopifyDescription(page)
    {    
        await page.waitForSelector('button[aria-describedby="PolarisTooltipContent5"]')
        await page.click('button[aria-describedby="PolarisTooltipContent5"]')
        await page.click('div[id="product-description_iframecontainer"]')
        for(let counter = 0; counter < Amazon.products[0].Descriptions.length; counter++)
        {
            await page.type('div[id="product-description_iframecontainer"]', `${Amazon.products[0].Descriptions[counter]}`)
            await page.keyboard.press('Enter'); 
        }

        await page.keyboard.press('Backspace');
    }
}

module.exports = Shopify