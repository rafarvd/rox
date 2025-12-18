const { connect } = require("puppeteer-real-browser");
const fs = require("fs");

require("dotenv").config({ quiet: true });

const URL = process.env.URL;
const COOKIES_PATH = "cookies.json";
const LOCALSTORAGE_PATH = "localstorage.json";

const rox = async () => {
  const { page, browser } = await connect({
    args: ["--start-maximized"],
    turnstile: true,
    headless: false,
    // disableXvfb: true,
    // proxy: {
    //   host: "",
    //   port: ,
    //   username: "",
    //   password: "",
    // },
    customConfig: {},
    connectOption: {
      defaultViewport: null,
    },
    plugins: [],
  });

  try {
    await page.goto(URL, {
      waitUntil: "networkidle2",
    });

    await new Promise((r) => setTimeout(r, 2000));

    if (fs.existsSync(COOKIES_PATH)) {
      let cookies = JSON.parse(fs.readFileSync(COOKIES_PATH));
      cookies = cookies.map((c) => ({
        ...c,
        expires: c.expires ? Math.floor(c.expires) : undefined,
      }));
      await page.setCookie(...cookies);
    }

    if (fs.existsSync(LOCALSTORAGE_PATH)) {
      const localData = JSON.parse(fs.readFileSync(LOCALSTORAGE_PATH));
      await page.evaluate((data) => {
        for (const k in data) localStorage.setItem(k, data[k]);
      }, localData);
    }

    await new Promise((r) => setTimeout(r, 2000));

    await page.reload({ waitUntil: "networkidle2" });

    await page.goto(URL, {
      waitUntil: "networkidle2",
    });

    await new Promise((r) => setTimeout(r, 2000));

    for (let i = 0; i < 5; i++) {
      const clica = await page.evaluate(() => {
        const botao = Array.from(
          document.querySelectorAll('div[dir="auto"]')
        ).find((el) => {
          const texto = el.textContent.trim();
          return texto === "Ganhe mais" || texto === "Earn more";
        });
        if (botao) {
          botao.click();
          return true;
        }
        return false;
      });
      if (clica) {
        console.log("Botão clicado, parando o loop.");
        break;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    await new Promise((r) => setTimeout(r, 38000));

    await page.reload({ waitUntil: "networkidle2" });

    await new Promise((r) => setTimeout(r, 5000));

    await page.screenshot({ path: "screen.png" });
  } catch (error) {
    console.error(`Erro interno do servidor: ${error.message}`);
  } finally {
    await browser.close();
  }
};

rox();
