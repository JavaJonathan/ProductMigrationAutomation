var Bot = require('./Bot.js'), Amazon = require('./Amazon.js');

class Shopify
{
    //this will hold the sku number for the products
    sku;
    botConfigs;

    constructor(){}

    static async listProductOnShopify(page, product)
    {
        try
        {
            await page.bringToFront()
            await this.makeListingInactive(page)
            await this.addShopifyTitle(page, product)    
            await this.addShopifyDescription(page, product)
            await this.uploadImageUrls(page, product)  
            await this.addBrandAndPrice(page, product)        
            await this.checkBackOrderCheckBox(page)
            await this.addShopifyQuantity(page)
            await this.addUpcAndCountry(page, product)
            await Bot.LogListedItem(page, product)
        }
        catch(exception)
        {
            await Bot.sendSlackMessage("Broke during shopify step: " + exception)
            await Bot.LogProductError(page, product.Asin, exception)
            throw exception
        }
    }

    static async addSku(page, product)
    {
        product.SKU = await Bot.getNextSku(page)
        await page.type('input[name="sku"]', `${product.SKU}`)
    }

    static async addCompareAtPrice(page, product)
    {
        let compareAtPrice = product.Price * 1.3
        compareAtPrice = (Math.round(compareAtPrice * 100) / 100).toFixed(2);
        await page.type('input[name="compareAtPrice"]', `${compareAtPrice}`)
    }

    static async addBrandAndPrice(page, product)
    {
        try
        {
            await page.type('input[name="price"]', `${product.Price}`) 
            await page.waitForTimeout(250)
            await page.type('input[id="PolarisTextField7"]', `${product.Brand}`)
        }
        catch(Exception)
        {
            throw "Could not add brand/price"
        }
    }

    static async makeListingInactive(page)
    {
        try
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
        catch(Exception) 
        {
            throw "Could not deactivate listing"
        }
    }

    static async uploadImageUrls(page, product)
    {
        try
        {
            for(let counter = 0; counter < product.ImageLinks.length; counter++)
            {
                await page.waitForTimeout(500)
                await page.waitForSelector('button[aria-controls="Polarispopover6"]')
                await page.click('button[aria-controls="Polarispopover6"]')
                let imageUrlElements = await page.$$('button[class="Polaris-ActionList__Item_yiyol"]')
                await imageUrlElements[0].click()

                await page.waitForSelector('input[placeholder="https://"]')
                await page.type('input[placeholder="https://"]', `${product.ImageLinks[counter]}`)

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
        catch(Exception)
        {
            throw "Could not upload images"
        }
    }

    static async logInToShopify(page)
    {
        try
        {
            this.botConfigs = await Bot.grabBotConfigs(page)

            await page.goto('https://pbdcollectibles.myshopify.com/admin/products/new', { waitUntil: 'networkidle2' })
            await page.type('input[id="account_email"]', `${this.botConfigs.username}`)
            await page.waitForTimeout(5000)
            await page.click('button[name="commit"]')
            await page.waitForSelector('input[id="account_password"]')
            await page.type('input[id="account_password"]', `${this.botConfigs.password}`)
            await page.waitForTimeout(3000)
            await page.click('button[name="commit"]')
        }
        catch(Exception)
        {
            await Bot.sendSlackMessage('Human intervention needed, could not log in.')
            //gives us an hour to help it log in
            await page.waitForSelector('span[class="Polaris-Button__Text_yj3uv"]', {timeout: 60000 * 60})
        }
    }

    static async checkBackOrderCheckBox(page)
    {
        await page.click('label[for="InventoryTrackingAllowOutOfStockPurchases"] span')
    }

    static async addShopifyTitle(page, product)
    {
        await page.waitForSelector('input[name="title"]')
        await page.waitForTimeout(500)
        await page.click('input[name="title"]')
        await page.type('input[name="title"]', `${product.Title == "" ? "Coming Soon" : product.Title}`)
    }

    static async addShopifyQuantity(page)
    {   
        await page.waitForTimeout(250)
        await page.click('input[id="AdjustQuantityPopoverTextFieldActivator"]')
        await page.keyboard.press('Delete'); 
        await page.type('input[id="AdjustQuantityPopoverTextFieldActivator"]', '5')
        await page.waitForTimeout(250)
    }

    static async addShopifyDescription(page, product)
    {    
        await page.waitForSelector('button[aria-describedby="PolarisTooltipContent5"]')
        await page.click('button[aria-describedby="PolarisTooltipContent5"]')
        await page.click('div[id="product-description_iframecontainer"]')

        if(product.Descriptions.length == 0)
        {
            await page.type('div[id="product-description_iframecontainer"]', `Coming Soon`)
            return
        }

        for(let counter = 0; counter < product.Descriptions.length; counter++)
        {
            await page.type('div[id="product-description_iframecontainer"]', `${product.Descriptions[counter]}`)
            await page.keyboard.press('Enter'); 
        }

        await page.keyboard.press('Backspace');
    }

    static async addUpcAndCountry(page, product)
    {
        await page.type('input[name="barcode"]', `${product.UPC == "" ? "Coming Soon" : product.UPC}`)
        await page.select('select[id="PolarisSelect2"]', 'US')
    }
}

module.exports = Shopify