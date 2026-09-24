# Online vendor replies: setup

With this set up, vendors get a short link such as
`https://<your-site>/#/q/k7pq2xma`. They open it, enter their rates, sign and
press **Submit**. The quote is then recorded in the program by itself: the RFQ
shows **Received**, and the quote appears in **Compare quotes**. It works like
Google Forms, and nobody copies a reply code back.

The replies are kept in a Google Sheet on your own Google account. It is free.

## 1. Create the server (about 5 minutes, once)

1. Go to <https://sheets.google.com> and create a blank spreadsheet. Name it
   *Milandhoo vendor quotes*.
2. In the spreadsheet, open **Extensions > Apps Script**.
3. Delete everything in the editor and paste in the whole of `vendor-server.gs`.
4. On the line `var OFFICE_KEY = 'CHANGE-ME';`, replace `CHANGE-ME` with a long
   password that only the office knows, for example `milandhoo-7Rk2-quotes-94`.
   Then save (Ctrl+S).
5. Click **Deploy > New deployment**. Next to "Select type", click the gear icon
   and choose **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy**, then allow access when Google asks. You may need to click
   *Advanced > Go to … (unsafe)*, because the script is your own.
6. Copy the **Web app URL**. It ends in `/exec`.

## 2. Connect the program

1. Open `config.js`, which sits next to `index.html`. You can edit it on GitHub
   with the pencil icon. Paste the URL between the quotes:

   ```js
   window.MQ_SERVER = "https://script.google.com/macros/s/AKfy…/exec";
   ```

   Save or commit it. The vendors' browsers read this file, so the program must
   be served from a web address, for example GitHub Pages, and not opened as a
   local file.
2. In the program, go to **Settings & backup > Online vendor replies**. Type the
   same office key and click **Test connection**.

## How it works day to day

- Create an RFQ with **"Send to vendor"** and issue it. The RFQ page shows the
  short link, with **Copy link** and **Share on WhatsApp** buttons.
- While the program is open, it checks for new replies every 20 seconds. When a
  vendor submits, you see "Quote received from …", the RFQ turns **Received**,
  and the quote appears in **Compare quotes**.
- A vendor can submit only once. To let a vendor change a quote, use
  **Revise…** on the RFQ. That makes a new RFQ with a new link.
- Every reply is also kept as a row in the Google Sheet.

If you change the script later, use **Deploy > Manage deployments > Edit >
Version: New version**. This keeps the same URL.
