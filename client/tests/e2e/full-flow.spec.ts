import { expect, Page, test } from '@playwright/test';

const DEFAULT_PASSWORD = 'TestPass123!';

const uniqueSuffix = () => Date.now().toString(36);

async function registerUser(page: Page, name: string, email: string, password: string) {
    await page.goto('/register');
    await page.getByTestId('register-name').fill(name);
    await page.getByTestId('register-email').fill(email);
    await page.getByTestId('register-password').fill(password);
    await page.getByTestId('register-submit').click();
    await page.waitForURL(/^(?!.*\/login).*$/);
    await expect(page.getByRole('button', { name: new RegExp(name, 'i') })).toBeVisible();
}

async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();
    await page.waitForURL(/^(?!.*\/login).*$/);
}

async function logoutUser(page: Page) {
    await page.locator('header').getByRole('button').last().click();
    await page.getByRole('menuitem', { name: /log out/i }).click();
    await page.waitForURL(/\/login$/);
}

async function createPost(page: Page, title: string, content: string, category: string) {
    await page.goto('/create-post');
    await page.getByTestId('post-title').fill(title);
    await page.getByTestId('post-content').fill(content);
    await page.getByTestId('post-category').fill(category);
    const [response] = await Promise.all([
        page.waitForResponse(
            (candidate) => candidate.url().endsWith('/api/posts') && candidate.request().method() === 'POST',
            { timeout: 15_000 }
        ),
        page.getByTestId('post-submit').click(),
    ]);
    expect(
        response.ok(),
        `Post creation failed with ${response.status()}: ${await response.text()}`
    ).toBeTruthy();
    await page.waitForURL(/\/$/);
}

async function openPostCard(page: Page, title: string) {
    await page.goto('/explore');
    const article = page.locator('article').filter({ hasText: title });
    await expect(article).toHaveCount(1);
    await expect(article).toContainText(title);
    await article.locator('a').first().click();
    await page.waitForURL(/\/posts\//);
}

async function findUserToFollow(page: Page, userName: string) {
    await page.goto('/users');
    await page.getByTestId('users-search-input').fill(userName);
    await page.getByTestId('users-search-button').click();
    await expect(page.getByText(userName)).toBeVisible();

    const followButton = page.getByRole('button', { name: /follow/i }).first();
    await expect(followButton).toBeVisible();
    await followButton.click();
    await expect(page.getByRole('button', { name: /unfollow/i }).first()).toBeVisible();

    await page.getByRole('button', { name: /unfollow/i }).first().click();
    await expect(page.getByRole('button', { name: /follow/i }).first()).toBeVisible();
}

async function editPost(page: Page, currentTitle: string, nextTitle: string) {
    await page.goto('/explore');
    const article = page.locator('article').filter({ hasText: currentTitle }).first();
    await expect(article).toBeVisible();
    await article.locator('a[href*="/edit"]').click();
    await page.waitForURL(/\/explore\/post\/.+\/edit$/);
    await page.getByTestId('edit-post-title').fill(nextTitle);
    await page.getByTestId('edit-post-submit').click();
    await page.waitForURL(/\/explore$/);
    await expect(page.locator('article')).toContainText(nextTitle);
}

async function deletePost(page: Page, title: string) {
    await page.goto('/explore');
    const article = page.locator('article').filter({ hasText: title }).first();
    await expect(article).toBeVisible();
    await article.locator('button').last().click();
    await page.getByRole('button', { name: /^delete post$/i }).click();
    await expect(page.locator('article')).not.toContainText(title);
}

test.describe.serial('full app journey', () => {
    test('registers, logs in, follows/unfollows, creates posts, comments, edits, and deletes', async ({ page }) => {
        const suffix = uniqueSuffix();
        const firstUser = {
            name: `Playwright User ${suffix}`,
            email: `playwright+${suffix}@example.com`,
            password: DEFAULT_PASSWORD,
        };

        const secondUser = {
            name: `Playwright Friend ${suffix}`,
            email: `playwright-friend+${suffix}@example.com`,
            password: DEFAULT_PASSWORD,
        };

        const postOneTitle = `Playwright Post One ${suffix}`;
        const postOneContent = `First post created by Playwright ${suffix}`;
        const postTwoTitle = `Playwright Post Two ${suffix}`;
        const postTwoContent = `Second post created by Playwright ${suffix}`;
        const editedPostTitle = `Playwright Post One Updated ${suffix}`;
        const commentText = `Playwright comment ${suffix}`;
        const replyText = `Playwright reply ${suffix}`;

        await test.step('register the primary user', async () => {
            await registerUser(page, firstUser.name, firstUser.email, firstUser.password);
        });

        await test.step('register a second user so the follow step has a target', async () => {
            await registerUser(page, secondUser.name, secondUser.email, secondUser.password);
        });

        await test.step('log out and log back in as the primary user', async () => {
            await logoutUser(page);
            await loginUser(page, firstUser.email, firstUser.password);
        });

        await test.step('search for another user and follow then unfollow them', async () => {
            await findUserToFollow(page, secondUser.name);
        });

        await test.step('create two posts for the account', async () => {
            await createPost(page, postOneTitle, postOneContent, 'Tech');
            await createPost(page, postTwoTitle, postTwoContent, 'Travel');
        });

        await test.step('open a created post and add a comment and reply', async () => {
            await openPostCard(page, postOneTitle);
            await page.getByTestId('comment-input').fill(commentText);
            await page.getByTestId('comment-submit').click();
            await expect(page.getByText(commentText)).toBeVisible();

            await page.getByTestId('reply-toggle').first().click();
            await page.getByTestId('reply-input').first().fill(replyText);
            await page.getByTestId('reply-submit').first().click();
            await expect(page.getByText(replyText)).toBeVisible();
        });

        await test.step('edit one created post and delete the other', async () => {
            await editPost(page, postOneTitle, editedPostTitle);
            await deletePost(page, postTwoTitle);
        });
    });
});
