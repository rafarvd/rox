// save_session.js
const { connect } = require("puppeteer-real-browser");
const fs = require("fs");
const { execSync } = require("child_process");

require("dotenv").config({ quiet: true });

const COOKIES_PATH = "cookies.json";
const LOCALSTORAGE_PATH = "localstorage.json";
const LOGIN = process.env.LOGIN;
const SENHA = process.env.SENHA;
const PROXY = JSON.parse(process.env.PROXY) || false;

const loginRox = async () => {
  const { page, browser } = await connect({
    args: ["--start-maximized"],
    turnstile: false,
    headless: false,
    proxy: PROXY,
    customConfig: {},
    connectOption: {
      defaultViewport: null,
    },
    plugins: [],
  });

  try {
    await page.goto("https://app.robox.digital/", {
      waitUntil: "networkidle2",
    });

    await new Promise((r) => setTimeout(r, 2000));

    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => {
        const botao = Array.from(
          document.querySelectorAll('div[dir="auto"]')
        ).find((el) => {
          const texto = el.textContent.trim();
          return texto === "Ganhe seu ROX" || texto === "Earn your ROX";
        });
        if (botao) {
          botao.click();
          return true;
        }
        return false;
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

    const clica = await page.evaluate(() => {
      const botao = Array.from(
        document.querySelectorAll('div[dir="auto"]')
      ).find((el) => {
        const texto = el.textContent.trim();
        return texto === "Google";
      });
      if (botao) {
        botao.click();
        return true;
      }
      return false;
    });

    await new Promise((r) => setTimeout(r, 5000));

    if (clica) {
      const pages = await browser.pages();
      console.log("PAGES LENGTH:", pages.length);
      if (pages.length > 1) {
        const googlePage = pages[pages.length - 1];
        await googlePage.type('input[type="email"]', LOGIN);
        await googlePage.keyboard.press("Enter");
        await new Promise((r) => setTimeout(r, 3000));
        await googlePage.type('input[type="password"]', SENHA);
        await googlePage.keyboard.press("Enter");
      }
    }

    await new Promise((r) => setTimeout(r, 10000));

    const saldo = await page.evaluate(() => {
      const el = document.querySelector("span.css-1jxf684.r-jwli3a.r-n644vd");
      return el ? el.textContent.trim() : null;
    });

    // saldo ? console.log("Login bem-sucedido!") : console.log("Falha no login.");

    if (saldo) {
      const cookies = await page.cookies();
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      console.log("✅ Cookies salvos em", COOKIES_PATH);
      const localStorageData = await page.evaluate(() => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      });
      fs.writeFileSync(
        LOCALSTORAGE_PATH,
        JSON.stringify(localStorageData, null, 2)
      );

      await new Promise((r) => setTimeout(r, 2000));

      execSync(`gh secret set COOKIES < ${COOKIES_PATH}`, {
        stdio: "inherit",
      });

      execSync(`gh secret set LOCALSTORAGE < ${LOCALSTORAGE_PATH}`, {
        stdio: "inherit",
      });

      console.log("✅ LocalStorage salvo em", LOCALSTORAGE_PATH);
    }
  } catch (error) {
    console.error(`Erro interno do servidor: ${error.message}`);
  } finally {
    await browser.close();
  }
};

module.exports = loginRox;

// loginRox();
