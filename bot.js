const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
    console.log('Starting Automation Bot...');
    const browser = await puppeteer.launch({ headless: false }); // Set true for background running
    const page = await browser.newPage();

    try {
        // 1. Go to Old Website Login Page
        await page.goto('http://51.89.99.105/NumberPanel/login', { waitUntil: 'networkidle2' });

        // 2. Fill Username and Password
        await page.type('input[name="username"], #username', 'SairahmadZ016');
        await page.type('input[name="password"], #password', '112233');

        // 3. Auto Solve Math Captcha
        // Assuming the captcha text looks like "5 + 3 =" or similar inside an element
        const captchaText = await page.$eval('#captcha-text, .captcha, label', el => el.innerText);
        // Clean and evaluate simple math string safely (e.g., "4 + 2")
        const mathCleaned = captchaText.replace(/[^0-9+\-*/]/g, '');
        const captchaAnswer = eval(mathCleaned);

        await page.type('input[name="captcha"], #captcha', captchaAnswer.toString());

        // 4. Click Login
        await Promise.all([
            page.click('button[type="submit"], #login-btn'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        console.log('Logged into Dashboard successfully!');

        // 5. Click Left Side Three Lines Menu
        await page.click('.sidebar-toggle, .menu-icon, #menu-toggle');
        await page.waitForTimeout(1000);

        // 6. Click 'Reply & State' option
        await page.click('text/Reply & State, a.reply-state');
        await page.waitForTimeout(1000);

        // 7. Click 'SMS Report'
        await Promise.all([
            page.click('text/SMS Report, a.sms-report'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        console.log('Navigated to SMS Report Page.');

        // 8. Extract Details from the SMS Report Table
        const extractedData = await page.evaluate(() => {
            const row = document.querySelector('table tbody tr'); // Adjust selector based on actual panel markup
            if (!row) return null;
            const cols = row.querySelectorAll('td');
            
            let fullClientName = cols[4] ? cols[4].innerText.trim() : 'Client';
            // Shorten client name to half name
            let halfName = fullClientName.substring(0, Math.ceil(fullClientName.length / 2));

            return {
                report_date: cols[0] ? cols[0].innerText.trim() : new Date().toLocaleDateString(),
                date_range_val: cols[1] ? cols[1].innerText.trim() : 'Standard',
                phone_number: cols[2] ? cols[2].innerText.trim() : '',
                cli: cols[3] ? cols[3].innerText.trim() : '',
                client_name: halfName,
                sms_content: cols[5] ? cols[5].innerText.trim() : cols[0].innerText.trim()
            };
        });

        if (extractedData) {
            console.log('Extracted SMS Data:', extractedData);

            // 9. Forward Data to New Website API
            await axios.post('http://localhost:3000/api/forward-sms', extractedData);
            console.log('SMS Details successfully forwarded to New Website!');
        } else {
            console.log('No reports found on the page.');
        }

    } catch (error) {
        console.error('Error during bot execution:', error);
    } finally {
        await browser.close();
    }
})();
