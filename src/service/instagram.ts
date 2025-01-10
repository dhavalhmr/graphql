import puppeteer from "puppeteer";

export async function getFollowersWithLogin(username: string, password: string) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to Instagram login page
        await page.goto('https://www.instagram.com/accounts/login/');

        // Wait for login form and input username and password
        await page.waitForSelector('input[name="username"]');
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);

        // Click the login button
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Check if login was successful
        if (page.url().includes('/accounts/login/')) {
            console.error('Login failed. Check username or password.');
            return;
        }

        // Navigate to the profile page
        await page.goto(`https://www.instagram.com/${username}/`);
        await page.waitForSelector('meta[property="og:description"]');

        // Initialize window variables
        await page.evaluate(() => {
            (window as any).followers = [];
            (window as any).followings = [];
            (window as any).dontFollowMeBack = [];
            (window as any).iDontFollowBack = [];
        });

        // Inject the main script
        const scriptContent = `
        (async () => {
          try {
            console.log('Process started! Give it a couple of seconds');

            const userQueryRes = await fetch(
              \`https://www.instagram.com/web/search/topsearch/?query=${username}\`
            );

            const userQueryJson = await userQueryRes.json();
            const userId = userQueryJson.users
              .map(u => u.user)
              .filter(u => u.username === '${username}')[0]?.pk;

            console.log('userId:', userId);

            let after = null;
            let has_next = true;

            // Get followers
            while (has_next) {
              const res = await fetch(
                \`https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=\${
                  encodeURIComponent(
                    JSON.stringify({
                      id: userId,
                      include_reel: true,
                      fetch_mutual: true,
                      first: 50,
                      after: after,
                    })
                  )
                }\`
              );
              const data = await res.json();
              has_next = data.data.user.edge_followed_by.page_info.has_next_page;
              after = data.data.user.edge_followed_by.page_info.end_cursor;
              window.followers = window.followers.concat(
                data.data.user.edge_followed_by.edges.map(({ node }) => ({
                  username: node.username,
                  full_name: node.full_name,
                }))
              );
            }

            console.log({ followers: window.followers });

            // Get followings
            after = null;
            has_next = true;

            while (has_next) {
              const res = await fetch(
                \`https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=\${
                  encodeURIComponent(
                    JSON.stringify({
                      id: userId,
                      include_reel: true,
                      fetch_mutual: true,
                      first: 50,
                      after: after,
                    })
                  )
                }\`
              );
              const data = await res.json();
              has_next = data.data.user.edge_follow.page_info.has_next_page;
              after = data.data.user.edge_follow.page_info.end_cursor;
              window.followings = window.followings.concat(
                data.data.user.edge_follow.edges.map(({ node }) => ({
                  username: node.username,
                  full_name: node.full_name,
                }))
              );
            }

            console.log({ followings: window.followings });

            // Calculate who doesn't follow back
            window.dontFollowMeBack = window.followings.filter(following => 
              !window.followers.find(follower => follower.username === following.username)
            );

            console.log({ dontFollowMeBack: window.dontFollowMeBack });

            // Calculate who you don't follow back
            window.iDontFollowBack = window.followers.filter(follower =>
              !window.followings.find(following => following.username === follower.username)
            );

            console.log({ iDontFollowBack: window.iDontFollowBack });

            return {
              followers: window.followers,
              followings: window.followings,
              dontFollowMeBack: window.dontFollowMeBack,
              iDontFollowBack: window.iDontFollowBack
            };
          } catch (err) {
            console.error('Error:', err);
            return null;
          }
        })();
      `;

        // Execute the script and wait for results
        const results = await page.evaluate(scriptContent);

        // Wait a bit to ensure all data is processed
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Get final state of the variables
        const finalResults = await page.evaluate(() => ({
            followers: (window as any).followers,
            followings: (window as any).followings,
            dontFollowMeBack: (window as any).dontFollowMeBack,
            iDontFollowBack: (window as any).iDontFollowBack
        }));

        console.log('Final state:', JSON.stringify(finalResults));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
}