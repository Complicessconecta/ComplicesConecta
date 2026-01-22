import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Find and select the demo mode option to access demo environment.
        frame = context.pages[-1]
        # Click on 'Ingresar' button to proceed to authentication options including demo mode
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/div/div/main/section[2]/div/div/div[2]/div/div/div/div[4]/div/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Saltar introducción' to skip the introduction and access authentication options including demo mode.
        frame = context.pages[-1]
        # Click 'Saltar introducción' to skip the introduction modal
        elem = frame.locator('xpath=html/body/div[2]/div/div/div[7]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Ingresar' button to proceed to authentication options and find demo mode.
        frame = context.pages[-1]
        # Click 'Ingresar' button to open authentication options including demo mode
        elem = frame.locator('xpath=html/body/div/div/div/div/div/header/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Scroll to 'Ingresar' button to ensure it is fully visible and retry clicking it.
        frame = context.pages[-1]
        # Retry clicking 'Ingresar' button after scrolling to it
        elem = frame.locator('xpath=html/body/div/div/div/div/div/header/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'Acceso Demo' button to access demo mode and verify demo environment access.
        frame = context.pages[-1]
        # Click 'Acceso Demo' button to enter demo mode
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/div/div[2]/div/div[2]/div/div[2]/form/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Explorar como Single' to enter demo mode as a single user and verify demo environment access.
        frame = context.pages[-1]
        # Click 'Explorar como Single' button to enter demo mode as single user
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/div/div[3]/div[2]/div/div[2]/div[2]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify interactivity of key demo features by clicking on 'Reclamar 500 CMPX Gratis' button to test token claim functionality.
        frame = context.pages[-1]
        # Click 'Reclamar 500 CMPX Gratis' button to test token claim feature in demo mode
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/main/div/div/div/div[3]/div[2]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Verify navigation to other demo features such as Posts, Matches, and Gallery to ensure full demo exploration capability.
        frame = context.pages[-1]
        # Click 'Posts' tab to verify demo posts are accessible
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/main/div/div/div/div[6]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Matches' tab to verify demo matches are accessible
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/main/div/div/div/div[6]/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Galería' tab to verify demo gallery is accessible
        elem = frame.locator('xpath=html/body/div/div/div/div/div/main/div/div/div/div[2]/main/div/div/div/div[6]/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Demo User').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Esta es una wallet demo con datos mock para familiarizarte con el ecosistema.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Reclamar 500 CMPX Gratis').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Posts').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Matches').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Galería').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    