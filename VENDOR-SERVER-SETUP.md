# Online vendor replies: setup (EdgeOne Pages)

Vendors get a short link such as `https://mcprocurement.edgeone.dev/?q=k7pq2x`.
They open it, enter their rates, sign and press **Submit**. The quote is then
recorded in the program by itself: the RFQ shows **Received**, and the quote
appears in **Compare quotes**.

The replies are stored by `functions/api/mq.js`, a small edge function that runs
on the same EdgeOne Pages site, in EdgeOne's KV storage.

## One-time setup (about 3 minutes)

1. In the EdgeOne Pages console, open **KV Storage**. Enable it if asked, and
   create a namespace, for example `milandhoo-quotes`.
2. Open the **mcprocurement** project and go to **KV Storage > Bind namespace**.
   Choose the namespace you created, and type the variable name **`MQ_KV`**
   exactly like this.
3. Deploy again. The function only goes live when the whole folder, including
   the `functions` folder, is deployed:
   - **If the project is connected to GitHub:** redeploy it from the console.
     The latest push also triggers a new build.
   - **If you upload files by hand:** upload the whole repository folder, not
     just `index.html`.
4. Open the program and go to **Settings & backup > Online vendor replies**.
   Click **Test connection**. It should say "Connected".

Optional: in the project's **Environment variables**, add `OFFICE_KEY` with a
password, then redeploy and type the same password under Settings. With a key
set, only the office can create links and read replies.

## Day to day

- Create an RFQ with **"Send to vendor"** and issue it. The RFQ page shows the
  short link, with **Copy link** and **Share on WhatsApp** buttons.
- While the program is open, it checks for replies every 15 seconds. A new
  quote can take up to a minute to arrive, because the KV storage spreads
  updates across EdgeOne's servers.
- A vendor can submit only once. To let a vendor change a quote, use
  **Revise…** on the RFQ, which gives it a new link.
