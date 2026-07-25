const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
    console.log('Starting Automation Bot...');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();

    // Set custom User-Agent to bypass bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        await page.goto('http://51.89.99.105/NumberPanel/login', { waitUntil: 'networkidle2' });

        await page.type('input[name="username"], #username', 'SairahmadZ016');
        await page.type('input[name="password"], #password', '112233');

        const captchaText = await page.$eval('#captcha-text, .captcha, label', el => el.innerText).catch(() => '5 + 3');
        const mathCleaned = captchaText.replace(/[^0-9+\-*/]/g, '');
        const captchaAnswer = eval(mathCleaned);

        await page.type('input[name="captcha"], #captcha', captchaAnswer.toString());

        await Promise.all([
            page.click('button[type="submit"], #login-btn'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        console.log('Logged into Dashboard successfully!');

        await page.click('.sidebar-toggle, .menu-icon, #menu-toggle').catch(() => {});
        await new Promise(r => setTimeout(r, 1000));

        await page.click('text/Reply & State, a.reply-state').catch(() => {});
        await new Promise(r => setTimeout(r, 1000));

        await Promise.all([
            page.click('text/SMS Report, a.sms-report'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]).catch(() => {});

        console.log('Navigated to SMS Report Page.');

        const extractedData = await page.evaluate(() => {
            const row = document.querySelector('table tbody tr');
            if (!row) return null;
            const cols = row.querySelectorAll('td');
            
            let fullClientName = cols[4] ? cols[4].innerText.trim() : 'Client';
            let halfName = fullClientName.substring(0, Math.ceil(fullClientName.length / 2));

            return {
                report_date: cols[0] ? cols[0].innerText.trim() : new Date().toLocaleDateString(),
                date_range_val: cols[1] ? cols[1].innerText.trim() : 'Standard',
                phone_number: cols[2] ? cols[2].innerText.trim() : '',
                cli: cols[3] ? cols[3].innerText.trim() : '',
                client_name: halfName,
                sms_content: cols[5] ? cols[5].innerText.trim() : (cols[0] ? cols[0].innerText.trim() : '')
            };
        });

        if (extractedData) {
            console.log('Extracted SMS Data:', extractedData);
            await axios.post('http://localhost:3000/api/forward-sms', extractedData).catch(() => {});
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
